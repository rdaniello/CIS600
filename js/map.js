function drawMap(){    
    let projection = d3.geoAlbersUsa()
                    .scale(1300).translate([500, 400]);
    let geo_generator = d3.geoPath().projection(projection);

    let density_extent = d3.extent(county_data,function (d){
        return getColor(+d.density);
    })
    
    density_extent[0]=1
    let colorScale = d3.scaleLinear()
        .domain(density_extent)
        .range(["green","red"])
    svgMap.selectAll('g').remove();
    let mapCanvas = svgMap.append('g')
    mapCanvas.selectAll('path')
        .data(geoJson)
        .enter()
        .append('path')
        .attr("class","path_geo")
        .attr("d",geo_generator)
        .on("mousemove",function (mouseData,d){
            d3.selectAll('.tooltip').remove();
            d3.selectAll('.tooltipScatter').remove();
            d3.select('body')
                .append("div")
                .classed('tooltip',true)
                .style("opacity",.9)
                .style("left",(mouseData.x + 10).toString() +"px")
                .style("top",(mouseData.y + 10).toString()+"px")
                .html(
                    "<div class='tooltipData'>County: "+county_data.get(d.properties.GEOID)[0].cname+"</div>" +
                    "<div class='tooltipData'>State: "+county_data.get(d.properties.GEOID)[0].sname+"</div>" +
                    "<div class='tooltipData'>Pop Density: "+county_data.get(d.properties.GEOID)[0].density.toString()+" / sq. mile</div>" 
                )
        })
        .on("mouseleave",function (mouseData,d){
            d3.selectAll('.tooltip').remove();
            d3.selectAll('.tooltipScatter').remove();

        })
        .on("click",function (mouseData,d){
            // if the same county is clicked then unhightlight and put reg line back
            if(d.properties.GEOID == prevCountyFips){
                let countyElem = d3.select(this);
                countyElem.attr('fill', prevCountColor);
                prevCountColor = null;
                prevCountyElem = null;
                prevCountyFips = null;
                hlightPoints = [];

                // remove any old highlighted points
                svgScatter.select('#hlightGrp').remove();

                // draw regression line
                linRegr();
            }
            else{
                // unhighlight selected county back to original color - if one is
                if(!(prevCountyElem === null)){
                    prevCountyElem.attr('fill', prevCountColor);
                }

                // will draw a highlighted point over data point 
                // faster than assigning class to each point
                // and then letting d3 select by class
                // update highlighted array and then call to draw highleted points
                hlightPoints = [];
                hlightPoints = irate_data.filter(function(item){
                        return item.fips == d.properties.GEOID;
                })

                // update previous selected county to this one
                prevCountyElem = d3.select(this);
                prevCountColor = prevCountyElem.attr('fill');
                prevCountyFips = d.properties.GEOID;

                // change selected fill color
                prevCountyElem.attr('fill', 'rgb(117, 166, 189)');

                // only draw if there are points to draw
                if(hlightPoints.length > 0){
                    drawHighLightedData();
                }
            }
        })

        .transition()
        .delay(function (d,i){return i/2})
        .duration(100)
        .attr("fill",function (d){
            try{
                let density = county_data.get(d.properties.GEOID)[0].density;
                let stateID = (d.properties.GEOID).substring(0,2);
                
                if(density >= filters.lowPopDen && density < filters.highPopDen 
                    && filters.stateFilter.includes(stateID)
                    && filteredFips.includes(d.properties.GEOID)){
                    let tmp = getColor(density);
                    return colorScale(tmp);
                }
                else{
                    return 'gray';
                }
            }
            catch (error)
            {
                return "white"
            }
        })
    
    // apply zoom setting and attach callbacks
    mapCanvas.attr('transform', mapZoom);
    svgMap.call(d3.zoom()
        .extent([[0,0],[1000,800]])
        .scaleExtent([1,8])
        .on("zoom",zoomedMap)
    )
    function zoomedMap({transform}){
        mapCanvas.attr("transform",transform)
        mapZoom = transform;
    }

    //Title
    let mapTitleSVG = d3.select('#canvasMapTitle');
    mapTitleSVG.selectAll('g').remove();
    mapTitleSVG.append("g")
        .attr("text-anchor", "middle")
        .attr('transform','translate(500,25)')
        .append("text")
        .attr('font-size', '24px')
        .attr('font-family','Arial, Helvetica, sans-serif')
        .text("Population Density / Square Mile")
}