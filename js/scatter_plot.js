function drawScatter(){
    // margins - also set in filters so lines draw correctly
    let margT = 20;
    let margB = 30;
    let margL = 60;
    let margR = 5;
    filters.margT = margT;
    filters.margR = margR;
    filters.margL = margL;
    filters.margB = margB;

    // Extents
    let irateExtent = d3.extent(filtered_irate_data, function(d){
        return +d.rate;
    })
    let tempExtent = d3.extent(filtered_irate_data, function(d){
        return +d.temp;
    })

    // Scales -set in filters, so highlighting points do not have to recalculate
    var tempScale = d3.scaleLinear()
        .domain(tempExtent)
        .range([margL, 1000 - margR])
    var irateScale = d3.scaleLinear()
        .domain(irateExtent)
        .range([200 - margB, margT])
    filters.currTempScale = tempScale;
    filters.currIrateScale = irateScale;

    let density_extent = d3.extent(county_data,function (d){
        return getColor(+d.density);
    })
    
    density_extent[0]=1
    let colorScale = d3.scaleLinear()
        .domain(density_extent)
        .range(["green","red"])
    
    // remove old brush
    svgScatter.select('.brush').remove();
    
    // remove old circles
    svgScatter.selectAll('g').remove();
    let scatterCanvas = svgScatter.append('g')

    scatterCanvas.selectAll('circle')
        .data(filtered_irate_data)
        .enter()
        .append('circle')
        .attr('cx',function(d){
            return tempScale(+d.temp);
        })
        .attr('cy',function(d){
            if(+d.rate == 0){
                return irateScale(Math.log10(.000001)) ;
            }
            return irateScale((+d.rate)) ;
        })
        .attr('r', .4)
        .style("fill", function(d){
            try{
                // let density = county_data.get(d.fips)[0].density;
                // let tmp = getColor(density);
                // return colorScale(tmp);
                //return 'rgb(236, 148, 148)';
                return 'gray';
            }
            catch (error)
            {
                console.log(error)
                return "white"
            }
        })

    // Brush
    let brushg = svgScatter.append('g');
    let brush = brushg.call(d3.brush()
        .extent([[margL,margT],[1000 - margR, 200 - margB]])
        .on('end', updateScatterBrush)
    )
    
    scatterAxises();

    // calc and draw linear regression
    linRegr();

    function updateScatterBrush({selection}){
        // get the bounds of the selected area scaled to irate and temperature
        // set the 
        filters.lowTemp = Math.floor(tempScale.invert(selection[0][0]));
        filters.highTemp = Math.ceil(tempScale.invert(selection[1][0]));
        filters.lowIrate = irateScale.invert(selection[1][1]);
        filters.highIrate = irateScale.invert(selection[0][1]);

        $( "#irateSlider" ).slider('values',0,Math.log10(filters.lowIrate));
        $( "#irateSlider" ).slider('values',1,Math.log10(filters.highIrate));
        $( "#irateSliderTxt" ).text(Math.floor(filters.lowIrate) + " - " + Math.ceil(filters.highIrate));

        $( "#tempSlider" ).slider('values',0,filters.lowTemp);
        $( "#tempSlider" ).slider('values',1,filters.highTemp);
        $( "#tempSliderTxt" ).text(filters.lowTemp + " - " + filters.highTemp);

        applyFilters();
    }
}

function scatterAxises(){
    // background rectangles for hiding out of bounds points
    // needed for left and top
    d3.selectAll('.axisBkgrnd').remove();
    svgScatter.append('rect')
        .classed('axisBkgrnd', true)
        .attr('x', 0)
        .attr('y', 0)
        .attr('height', 200)
        .attr('width', filters.margL)
    svgScatter.append('rect')
        .classed('axisBkgrnd', true)
        .attr('x', 0)
        .attr('y', 0)
        .attr('height', filters.margT)
        .attr('width', 1000)

    //Title
    svgScatter.append("g")
        .attr("text-anchor", "middle")
        .attr('transform','translate(500,' + filters.margT + ")")
        .append("text")
        .attr('font-size', '12px')
        .attr('font-family','Arial, Helvetica, sans-serif')
        .text("Infection Rate vs Temperature")

    // Axises
    var tempAxis = d3.axisBottom()
        .scale(filters.currTempScale)
        .tickFormat(function(d){
            return d + '\u00B0';
        })
    
    svgScatter.append('g')
        .attr('transform','translate(0,' + (200 - filters.margB) + ")")
        .attr('class', 'axis')
        .call(tempAxis);
    
    var iRateAxis = d3.axisLeft()
        .scale(filters.currIrateScale)
        
    svgScatter.append('g')
        .attr('transform','translate(' + (filters.margL) + ',0)')
        .attr('class', 'axis')
        .call(iRateAxis);

    // Axis Labels
    svgScatter.append("g").attr("class","label")
        .attr('transform','translate(500,' + (200-2) + ")")
        .append("text")
        .attr('font-size', '11px')
        .attr('font-family','Arial, Helvetica, sans-serif')
        .text("Temperature \u00B0F")

    svgScatter.append("g")
        .attr("text-anchor", "middle") 
        .attr("transform", `translate(${10},${200/2}) rotate(270)`)
        .append("text")
        .attr('font-size', '11px')
        .attr('font-family','Arial, Helvetica, sans-serif')
        .attr('text-rendering','optimizeLegibility')
        .text("7 Day Cases / 100k pop")
}


function drawHighLightedData(){
    // the highlighted point array was updated on map click
    // draw on top of the scatter plot here
    // uses scales calculated in scatter draw so it's not done twice

    // remove linear regression line if highlighted pints to draw
    if(hlightPoints.length > 0){
        svgScatter.selectAll('.linregline').remove();
    }

    // create colorscale to better visualize time series 
    let hlightExtent = d3.extent(hlightPoints, function(d){
        return new Date(d.week);
    });

    let hlightScale = d3.scaleLinear()
        .domain(hlightExtent)
        .range([0,1]);

    // remove any old highlighted points
    svgScatter.select('#hlightGrp').remove();

    // add highlighted points in group - easier to remove old ones
    let hlightGrp = svgScatter.append('g')
    hlightGrp.attr('id', 'hlightGrp')

    // line
    var line = d3.line()
                .x(function(d){return filters.currTempScale(d.temp)})
                .y(function(d){return filters.currIrateScale(d.rate)});
        
    hlightGrp.append('path')
        .datum(hlightPoints)
        .attr('stroke', 'black')
        .attr('stroke-width', 1)
        .attr('d', line)
        .style('fill', 'none');

    // the points
    hlightGrp.selectAll('circle')
        .data(hlightPoints)
        .enter()
        .append('circle')
        .classed('hlight', true)
        .attr('cx',function(d){
            return filters.currTempScale(+d.temp);
        })
        .attr('cy',function(d){
            if(+d.rate == 0){
                return filters.currIrateScale(Math.log10(.000001)) ;
            }
            return filters.currIrateScale((+d.rate)) ;
        })
        .attr('r', 0)
        .attr("fill", 'black')
        .on("mousemove",function (mouseData,d){
            d3.selectAll('.tooltip').remove();
            d3.selectAll('.tooltipScatter').remove();
            d3.select('body')
                .append("div")
                .classed('tooltipScatter',true)
                .style("opacity",.9)
                .style("left",(mouseData.x -150).toString() +"px")
                .style("top",(mouseData.y + 10).toString()+"px")
                .html(
                    "<div class='tooltipData' style='text-align:center;font-weight:bold'>County: "+county_data.get(d.fips)[0].cname+", " +
                    county_data.get(d.fips)[0].sname+"</div>" +
                    "<div class='tooltipData'>Date: "+d.week+"</div>" +
                    "<div class='tooltipData'>Infection Rate: "+d.rate+"</div>" +
                    "<div class='tooltipData'>Temperature: "+d.temp+"&#176;F</div>" 
                )
        })
        .on("mouseleave",function (mouseData,d){
            d3.selectAll('.tooltip').remove();
            d3.selectAll('.tooltipScatter').remove();

        })
        .transition()
        .delay(function (d,i){return i * 10})
        .duration(150)
        .attr('r',6)
        .transition()
        .delay(function (d,i){return i * 10})
        .duration(150)
        .attr('r',5)
        .attr('stroke', 'none')
        .attr('fill', function(d){
            return d3.interpolateRdYlGn(hlightScale(new Date(d.week)));
        });

        // redraw axises and labels - hide out of bounds points
        scatterAxises();
}

// displays best fit straight line of filtered data
// code from: https://stackoverflow.com/questions/6195335/linear-regression-in-javascript
function linRegr(){
    var lr = {};
    var sum_x = 0;
    var sum_y = 0;
    var sum_xy = 0;
    var sum_xx = 0;
    var sum_yy = 0;

    // remove old line
    svgScatter.selectAll('.linregline').remove();

    // if there are no highlighted (county selected) points the draw line
    // also there has to data
    if(hlightPoints.length == 0 && filtered_irate_data.length > 0){
        // get x and y
        let x = [];
        let y = [];
        for (var i =0; i < filtered_irate_data.length; i++){
            x.push(+filtered_irate_data[i].temp);
            y.push(+filtered_irate_data[i].rate)
        }

        var n = y.length;

        for (var i = 0; i < y.length; i++) {

            sum_x += x[i];
            sum_y += y[i];
            sum_xy += (x[i]*y[i]);
            sum_xx += (x[i]*x[i]);
            sum_yy += (y[i]*y[i]);
        } 

        lr['slope'] = (n * sum_xy - sum_x * sum_y) / (n*sum_xx - sum_x * sum_x);
        lr['intercept'] = (sum_y - lr.slope * sum_x)/n;
        lr['r2'] = Math.pow((n*sum_xy - sum_x*sum_y)/Math.sqrt((n*sum_xx-sum_x*sum_x)*(n*sum_yy-sum_y*sum_y)),2);

        // y intercept
        let yInt = lr['intercept'];
        if(yInt < 0){
            yInt = (lr['slope'] * filters.highTemp) + lr['intercept']
        }

        // x intercept
        let xInt = lr['intercept']/ (lr['slope'] * -1.0);

        // calculate x1,x2,y1,y1
        let x1 = x2 = y1 = y2 = 0.0;
        if(lr['slope'] < 0){
            x1 = filters.margL;
            x2 = filters.currTempScale(xInt);
            y1 = filters.currIrateScale(yInt);
            y2 = 200 - filters.margB;
        }
        else{
            x1 = 1000 - filters.margR;
            x2 = filters.currTempScale(xInt);
            y1 = filters.currIrateScale(yInt);
            y2 = 200 - filters.margB;
        }

        // add the line
        let lrg = svgScatter.append('g')
        lrg.attr('class', 'linregline');

        lrg.append('line')
            .datum(lr)
            .style("stroke", "red")  
            .style("stroke-width", "1px")  
            .attr("x1", function(){return x1})    
            .attr("y1", function(){return y1})     
            .attr("x2", function(){return x2})    
            .attr("y2", function(){return y2})
            .on("mousemove",function (mouseData,d){
                d3.selectAll('.tooltip').remove();
                d3.selectAll('.tooltipScatter').remove();
                d3.select('body')
                    .append("div")
                    .classed('tooltipScatter', true)
                    .style("opacity",.9)
                    .style('font-weight','bold')
                    .style("left",(mouseData.x -150).toString() +"px")
                    .style("top",(mouseData.y + 10).toString()+"px")
                    .style('height', '40px')
                    .style('width', '175px')
                    .html(
                        "<div class='tooltipData'>Line: y = " +d.slope.toFixed(2) + "x + " +  d.intercept.toFixed(2) + "</div>" +
                        "<div class='tooltipData'>r2: "+d.r2.toFixed(2)+"</div>"
                    )
            })
            .on("mouseleave",function (mouseData,d){
                d3.selectAll('.tooltip').remove();
                d3.selectAll('.tooltipScatter').remove();

            })
    }
    return lr;
}