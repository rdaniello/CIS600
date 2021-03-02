class Filters{
    constructor(){
        this.lowIrate = 0;
        this.highIrate = 15000;
        this.lowPopDen = 0;
        this.highPopDen = 0;
        this.lowTemp = 0;
        this.highTemp = 0;
        this.lowDate = new Date(2020,1,1)
        this.highDate = new Date(2021,2,1)

        // margins 
        this.margB = 20;
        this.margL = 40;
    }

    setInitLimits(iratedata, countydata){
        // set initial filter values to extent of data
        // infection rate
        let irate_extent = d3.extent(iratedata,function (d){
            return +d.rate;
        })
        this.highIrate = irate_extent[1];
        this.lowIrate = 0;

        // temperature
        let temp_extent = d3.extent(iratedata,function (d){
            return +d.temp;
        })
        this.highTemp = temp_extent[1];
        this.lowTemp = temp_extent[0];

        // population density
        let popDen_extent = d3.extent(countydata,function (d){
            return +d[1][0].density;
        })
        this.lowPopDen = popDen_extent[0];
        this.highPopDen = popDen_extent[1];

        // date 
        let date_Extent = d3.extent(iratedata, function(d){
            
            return new Date(d.week);
        })
        this.lowDate = date_Extent[0];
        this.highDate = date_Extent[1];
    }

    Print(){
        return("HRate: " + this.highIrate + " LRate: " + this.lowIrate 
            + " HTemp: " + this.highTemp + " LTemp: " + this.lowTemp
            + " HDen: " + this.highPopDen + " LDen: " + this.lowPopDen);
    }

    applyjQUI(){
        // infection rate slider
        let tmpMarB = this.margB; // need local copies of class values
        let tmpMarL = this.margL; // need local copies of class values
        let tmplDate = this.lowDate;  // need local copies of class values
        let tmphDate = this.highDate;  // need local copies of class values
        $( function() {
            $( "#irateSlider" ).slider({
              range: true,
              min: filters.lowIrate,
              max: Math.log10(filters.highIrate),
              step: .01,
              values: [ 0, Math.log10(filters.highIrate) ],
              slide: function( event, ui ) {
                $( "#irateSliderTxt" ).text(Math.floor(Math.pow(10,ui.values[ 0 ])) + " - " + Math.ceil(Math.pow(10,ui.values[ 1 ] )));
                let newLim = 0;
                let lineY = 0;
                console.log(tmpMarB);
                let tmpYScale = d3.scaleLinear()
                  .domain([filters.lowIrate, filters.highIrate])
                  .range([200 - tmpMarB, 0])
                if(ui.handleIndex == 0){
                    // lower filter limit
                    newLim = Math.floor(Math.pow(10,ui.values[0]));
                    lineY = tmpYScale(Math.floor(Math.pow(10,ui.values[0])));
                }
                else{
                    // upper filter limit
                    newLim = Math.floor(Math.pow(10,ui.values[1]));
                    lineY = tmpYScale(Math.floor(Math.pow(10,ui.values[1])));
                }

                // if new line position of plot then limit position to inside plot
                if(lineY <= 0){
                    lineY = 0;
                }
                if(lineY >  200 - tmpMarB){
                    lineY = 200 - tmpMarB ;
                }
                console.log(lineY);
                
                let svgScatter = d3.select('#canvasScatter')
                svgScatter.selectAll('line').remove();
                svgScatter.selectAll('.lineLabel').remove();
                svgScatter.append('line')
                    .style('stroke', 'black')
                    .style('stroke-width', .5)
                    .attr('x1',tmpMarL )
                    .attr('x2',1000)
                    .attr('y1', lineY)
                    .attr('y2', lineY);
                svgScatter.append('text')
                    .attr('x', 500)
                    .attr('y', function(){
                        if(lineY > 100){
                            return lineY -2
                        }
                        else{
                            return lineY + 10
                        }
                    })
                    .text(newLim)
                    .style('font-size', '12px')
                    .classed('lineLabel',true);
              },
              change: function(event, ui){
                  // inverse log10 of slider values
                  filters.lowIrate = Math.floor(Math.pow(10, ui.values[0]));
                  filters.highIrate = Math.ceil(Math.pow(10, ui.values[1]));
                  // if low limit is 1 make low limit 0 - log of 0 undefined
                  if(filters.lowIrate == 1){
                      filters.lowIrate = 0;
                  }
                  applyFilters();
              }
            });
            $( "#irateSliderTxt" ).text(Math.floor(Math.pow(10, $( "#irateSlider" ).slider( "values", 0 ))) +
              " - " + Math.ceil(Math.pow(10, $( "#irateSlider" ).slider( "values", 1 ))));
          } );

          // temperature slider
          $( function() {
            $( "#tempSlider" ).slider({
              range: true,
              min: filters.lowTemp,
              max: filters.highTemp,
              step: .1,
              values: [ filters.lowTemp, filters.highTemp ],
              slide: function( event, ui ) {
                $( "#tempSliderTxt" ).text(ui.values[0] + " - " + ui.values[1]);
                let newLim = 0;
                let lineX = 0;
                
                let tmpXScale = d3.scaleLinear()
                  .domain([filters.lowTemp, filters.highTemp])
                  .range([tmpMarL,1000])
                if(ui.handleIndex == 0){
                  // lower filter limit
                  newLim = ui.values[0]
                  lineX = tmpXScale(ui.values[0]);
                }
                else{
                    // upper filter limit
                    newLim = ui.values[1]
                    lineX = tmpXScale(ui.values[1]);
                }
                
                // if new line position of plot then limit position to inside plot
                if(lineX <= tmpMarL){
                    lineX = tmpMarL;
                }
                if(lineX >  1000){
                    lineX = 1000 ;
                }
                console.log(lineX);
                let svgScatter = d3.select('#canvasScatter')
                svgScatter.selectAll('line').remove();
                svgScatter.selectAll('.lineLabel').remove();
                svgScatter.append('line')
                  .style('stroke', 'black')
                  .style('stroke-width', .5)
                  .attr('x1',lineX)
                  .attr('x2',lineX)
                  .attr('y1', 0)
                  .attr('y2', 200 - tmpMarB);
                svgScatter.append('text')
                    .attr('x', function(){
                        if(lineX > 500){
                            return lineX - 30
                        }
                        else{
                            return lineX + 5
                        }
                    })
                    .attr('y', 100)
                    .text(newLim + '\u00B0')
                    .style('font-size', '12px')
                    .classed('lineLabel',true);
              },
              change: function(event, ui){
                  // inverse log10 of slider values
                  filters.lowTemp = ui.values[0];
                  filters.highTemp = ui.values[1];
                  applyFilters();
                  console.log(filters.lowTemp + ", " + filters.highTemp);
              }
            });
            $( "#tempSliderTxt" ).text($( "#tempSlider" ).slider( "values", 0 ) +
              " - " + $( "#tempSlider" ).slider( "values", 1 ));
          } );
  
          // Population density slider
          $( function() {
            $( "#popDenSlider" ).slider({
              range: true,
              min: filters.lowPopDen,
              max: Math.log10(filters.highPopDen),
              step: .01,
              values: [ 0, Math.log10(filters.highPopDen) ],
              slide: function( event, ui ) {
                $( "#popDenSliderTxt" ).text(Math.floor(Math.pow(10,ui.values[ 0 ])) + " - " + Math.ceil(Math.pow(10,ui.values[ 1 ] )));
              },
              change: function(event, ui){
                  // inverse log10 of slider values
                  filters.lowPopDen = Math.floor(Math.pow(10, ui.values[0]));
                  filters.highPopDen = Math.ceil(Math.pow(10, ui.values[1]));
                  // if low limit is 1 make low limit 0 - log of 0 undefined
                  if(filters.lowPopDen == 1){
                      filters.lowPopDen = 0;
                  }
                  applyFilters();
              }
            });
            $( "#popDenSliderTxt" ).text(Math.floor(Math.pow(10, $( "#popDenSlider" ).slider( "values", 0 ))) +
              " - " + Math.ceil(Math.pow(10, $( "#popDenSlider" ).slider( "values", 1 ))));
          } );

          // Date slider
          $( function() {
            $( "#dateSlider" ).slider({
              range: true,
              min: tmplDate.getTime() / 1000,
              max: tmphDate.getTime() / 1000,
              step: 86400,
              values: [ tmplDate.getTime() / 1000, tmphDate.getTime() / 1000 ],
              slide: function( event, ui ) {
                $( "#dateSliderTxt" ).text((new Date(ui.values[0] * 1000).toLocaleDateString()) + " - " + (new Date(ui.values[1] * 1000).toLocaleDateString()));
              },
              change: function(event, ui){
                  // inverse log10 of slider values
                  filters.lowDate = new Date(ui.values[0] * 1000);
                  filters.highDate = new Date(ui.values[1] * 1000);
                  // if low limit is 1 make low limit 0 - log of 0 undefined
                  applyFilters();
              }
            });
            $( "#dateSliderTxt" ).text((new Date($( "#dateSlider" ).slider( "values", 0 ) * 1000).toLocaleDateString())  +
              " - " + (new Date($( "#dateSlider" ).slider( "values", 1 ) * 1000).toLocaleDateString()));
          } );
    }
}