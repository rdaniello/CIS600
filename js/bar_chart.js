    // used to draw both barcharts - called twice
    function drawBar(svgContainer, type){
        let avgMap = null;
        let height = 370;
        let width = 1000;
        let margin = 70;

        // group the data by date
        avgMapTemp = d3.rollup(filtered_irate_data,
                            v => d3.mean(v, d => d.temp), 
                            d => d.week);

        sumMapCases = d3.rollup(filtered_irate_data,
                            v => d3.sum(v, d => d.cases), 
                            d => d.week);

        // transform into array of JSON - need to sort by date
        let barData = [];
        avgMapTemp.forEach(function(value, key, i){
            barData.push({
                date: new Date(key),
                temp: value,
                cases: sumMapCases.get(key),
                dType: type,
            })
        })
        barData = barData.sort(function(a,b){
            if(a.date > b.date){return 1}
            if(a.date < b.date){return -1;}
            return 0;
        })

        // extents and scales
        let xExtent = d3.extent(barData, function(d,i){
                return i;
        })
        let xExtentDate = d3.extent(barData, function(d,i){
                return new Date(d.date);
        })
        let xScale = d3.scaleLinear()
                        .domain(xExtent)
                        .range([margin, width - margin]);
        let xScaleDate = d3.scaleTime()
                        .domain(xExtentDate)
                        .range([margin, width - margin]);

        let yExtent = d3.extent(barData, function(d){
            if(type == 'temp'){
                return d.temp;
            }
            else{
                return d.cases;
            }
        })
  
        let yScale = d3.scaleLinear()
            .domain(yExtent)
            .range([height -10, 10])

        // color Scale - for temp use low and high from filter - entire data set
        colorScale = null;
        if(type == 'temp'){
            colorScale = d3.scaleLinear()
                .domain([filters.lowWeeklyTempI, filters.highWeeklyTempI])
                .range([1,0])
        }
        else{
            colorScale = d3.scaleLinear()
                .domain([filters.lowWeeklyCaseTotI, filters.highWeeklyCaseTotI])
                .range([1,0])
        }

        let tmpSVG = d3.select('#' + svgContainer)
        tmpSVG.selectAll('.bars').remove()
        tmpSVG.selectAll('.bars')
            .data(barData)
            .enter()
            .append('rect')
            .attr('class',function(d){
                // assign class to pair the barchart charts by date for highlighting mouse over
                return 'b' + d.date.getTime();
            })
            .classed('bars', true)
            
            .attr('x', function(d,i){
                return xScale(i);
            })
            .attr('y', function(d){
                var val = 0;
                if(type == 'temp'){
                    val = d.temp;
                }
                else{
                    val = d.cases;
                }
                return yScale(val);
            })
            .attr('height', function(d){
                var val = 0;
                if(type == 'temp'){
                    val = d.temp;
                }
                else{
                    val = d.cases;
                }
                return height - yScale(val);
            })
            .attr('width', function(d){
                return (width-2*margin)/ barData.length;
            })
            .attr('fill', function(d,i){
                if(type == 'temp'){
                    return d3.interpolateRdYlBu(colorScale(d.temp));
                }
                else{
                    return d3.interpolateRdYlBu(colorScale(d.cases));
                }
            })
            .on("mousemove",function (mouseData,d,i){
                // get the corresponding bar chart element
                let othBar = null;
                if(d.dType == 'temp'){
                    othSVG = d3.select('#canvasBarIRate')
                    othBar = othSVG.select('.b' + d.date.getTime())
                }
                else{
                    othSVG = d3.select('#canvasBarTemp')
                    othBar = othSVG.select('.b' + d.date.getTime())
                }

                // reset all bar strokes
                d3.selectAll('.bars').classed('outline',false)

                // outline 2 corresponding bars
                othBar.classed('outline',true);
                d3.select(this).classed('outline',true);

                // add tooltip
                d3.selectAll('.tooltip').remove();
                d3.selectAll('.tooltipScatter').remove();
                d3.select('body')
                    .append("div")
                    .classed('tooltipScatter',true)
                    .style("opacity",.9)
                    .style("left",(mouseData.x -170).toString() +"px")
                    .style("top",(mouseData.y + 10).toString()+"px")
                    .style('height', '60px')
                    .style('width', '150px')
                    .html(function(){
                        return "<div class='tooltipData' style='text-align:center;font-weight:bold'></div>" +
                        "<div class='tooltipData'><b>Date:</b> "+ d.date.toDateString() +"</div>" +
                        "<div class='tooltipData'><b>Temperature:</b> "+ d.temp.toFixed(1) +"\u00B0 F</div>" +
                        "<div class='tooltipData'><b>Weekly Cases:</b> "+ d.cases +"</div>"
                    })
            })
            .on("mouseleave",function (mouseData,d){
                d3.selectAll('.tooltip').remove();
                d3.selectAll('.tooltipScatter').remove();
                d3.selectAll('.bars').classed('outline',false)
            })

        // draw the x(time axis)
        let xSVG = d3.select('#canvasBarDateAxis');
        xsvg = xSVG.selectAll('g').remove();

        var xAxis = d3.axisBottom()
            .scale(xScaleDate)
            .tickFormat(function(d){
                return (d.getMonth() + 1) +'/' + d.getFullYear();
            })
        
        xSVG.append('g')
            .attr('transform','translate(0,0)')
            .attr('class', 'axis')
            .style("font-size", "16px")
            .call(xAxis);

        // draw the y(data axis)
        tmpSVG.selectAll('g').remove();

        var yAxis = d3.axisLeft()
            .scale(yScale)
            .tickFormat(function(d){
                if(type == 'temp'){
                    return d+ '\u00B0';
                }
                else{
                    return d/1000 + 'K';
                }
            })
        
        tmpSVG.append('g')
            .attr('transform','translate('+ margin + ',0)')
            .attr('class', 'axis')
            .style('font-size', '16px')
            .call(yAxis);
        
        //Title
        let barTitleSVG = d3.select('#canvasBarTitle');
        barTitleSVG.selectAll('g').remove();
        barTitleSVG.append("g")
            .attr("text-anchor", "middle")
            .attr('transform','translate(500,25)')
            .append("text")
            .attr('font-size', '24px')
            .attr('font-family','Arial, Helvetica, sans-serif')
            .text("Time Series Comparison: Cases and Temperature")
    }