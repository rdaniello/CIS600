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
        this.stateFilter = ['01','02','04','05','06','08','09','10','11','12','13','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29',
                            '30','31','32','33','34','35','36','37','38','39','40','41','42','44','45','46','47','48','49','50','51','53','54','55','56'];
        this.NEStates = ['23','33','50','25','44','09','36','34','42','10','24'];
        this.SEStates = ['54','51','21','47','37','45','13','01','28','05','22','12'];
        

        // the limits for full data set
        // same time when resetting filter limits
        this.lowIrateI = 0;
        this.highIrateI = 15000;
        this.lowPopDenI = 0;
        this.highPopDenI = 0;
        this.lowTempI = 0;
        this.highTempI = 0;
        this.lowDateI = new Date(2020,1,1)
        this.highDateI = new Date(2021,2,1);
        this.stateFilterI = this.stateFilter;

        // margins 
        this.margB = 20;
        this.margL = 40;
        this.margT = 20;
        this.margR = 5;
    }

    toggleRegion(elem, region){
        let statesFil = null;
        if(region == 'NE'){
            statesFil = this.NEStates;
        }
        if(region == 'SE'){
            statesFil = this.SEStates;
        }
        let statesElem  = d3.selectAll('.' + region)
        if(elem.checked){
            statesElem.property('checked', true);
            
            statesFil.forEach(function(elem){
                if(!(filters.stateFilter.includes(elem)))
                {
                    filters.stateFilter.push(elem);
                }
            })
        }
        else{
            statesElem.property('checked', false);

            let tmpArr = this.stateFilter.filter(function(val){
                if(!statesFil.includes(val)){
                    return val;
                }
            })
            this.stateFilter = tmpArr;

        }
        console.log(this.stateFilter);
        applyFilters();
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

        // assign these values to init fields 
        // don't have to find extents again when resetting filters
        this.lowIrateI = this.lowIrate;
        this.highIrateI = this.highIrate;
        this.lowPopDenI = this.lowPopDen;
        this.highPopDenI = this.highPopDen;
        this.lowTempI = this.lowTemp;
        this.highTempI = this.highTemp;
        this.lowDateI = this.lowDate;
        this.highDateI = this.highDate;
    }

    Print(){
        return("HRate: " + this.highIrate + " LRate: " + this.lowIrate 
            + " HTemp: " + this.highTemp + " LTemp: " + this.lowTemp
            + " HDen: " + this.highPopDen + " LDen: " + this.lowPopDen);
    }

    resetFiltersValues(){
        this.lowIrate = this.lowIrateI;
        this.highIrate = this.highIrateI;
        this.lowPopDen = this.lowPopDenI;
        this.highPopDen = this.highPopDenI;
        this.lowTemp = this.lowTempI;
        this.highTemp = this.highTempI;
        this.lowDate = this.lowDateI;
        this.highDate = this.highDateI;
        this.stateFilter = this.stateFilterI;

        // ui
        $( "#irateSlider" ).slider('values',0,this.lowIrateI);
        $( "#irateSlider" ).slider('values',1,this.highIrateI);
        $( "#irateSliderTxt" ).text(Math.floor(this.lowIrate) + " - " + Math.ceil(this.highIrate));

        $( "#tempSlider" ).slider('values',0,this.lowTemp);
        $( "#tempSlider" ).slider('values',1,this.highTemp);
        $( "#tempSliderTxt" ).text(this.lowTemp + " - " + this.highTemp);

        $( "#popDenSlider" ).slider('values',0,this.lowPopDen);
        $( "#popDenSlider" ).slider('values',1,this.highPopDen);
        $( "#popDenSliderTxt" ).text(this.lowPopDen + " - " + this.highPopDen);

        $( "#dateSlider" ).slider('values',0,this.lowDate.getTime() / 1000);
        $( "#dateSlider" ).slider('values',1,this.highDate.getTime() / 1000);
        $( "#dateSliderTxt" ).text(this.lowDate.toLocaleDateString() + " - " + this.highDate.toLocaleDateString());

        d3.selectAll('input').property('checked', true);
    }

    applyjQUI(){
        // infection rate slider
        let tmpMarT = this.margT; // need local copies of class values
        let tmpMarR = this.margR; // need local copies of class values
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

                let tmpYScale = d3.scaleLinear()
                  .domain([filters.lowIrate, filters.highIrate])
                  .range([200 - tmpMarB, tmpMarT])
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
                if(lineY <= tmpMarT){
                    lineY = tmpMarT;
                }
                if(lineY >  200 - tmpMarB){
                    lineY = 200 - tmpMarB ;
                }
                
                let svgScatter = d3.select('#canvasScatter')
                svgScatter.selectAll('line').remove();
                svgScatter.selectAll('.lineLabel').remove();
                svgScatter.append('line')
                    .style('stroke', 'black')
                    .style('stroke-width', .5)
                    .attr('x1',tmpMarL )
                    .attr('x2',1000 - tmpMarR)
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
                    .classed('lineLabel',true);
              },
              change: function(event, ui){
                  // only do if triggered from UI
                  if(event.originalEvent){
                    // inverse log10 of slider values
                    filters.lowIrate = Math.floor(Math.pow(10, ui.values[0]));
                    filters.highIrate = Math.ceil(Math.pow(10, ui.values[1]));
                    // if low limit is 1 make low limit 0 - log of 0 undefined
                    if(filters.lowIrate == 1){
                        filters.lowIrate = 0;
                    }
                    applyFilters();
                }
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
                  .range([tmpMarL,1000 - tmpMarR])
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
                if(lineX >  1000 - tmpMarR){
                    lineX = 1000 ;
                }
                
                let svgScatter = d3.select('#canvasScatter')
                svgScatter.selectAll('line').remove();
                svgScatter.selectAll('.lineLabel').remove();
                svgScatter.append('line')
                  .style('stroke', 'black')
                  .style('stroke-width', .5)
                  .attr('x1',lineX)
                  .attr('x2',lineX)
                  .attr('y1', tmpMarT)
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
                    .attr('y', 100 - tmpMarB / 2)
                    .text(newLim + '\u00B0')
                    .classed('lineLabel',true);
              },
              change: function(event, ui){
                  // only do if triggered from UI
                  if(event.originalEvent){
                    filters.lowTemp = ui.values[0];
                    filters.highTemp = ui.values[1];
                    applyFilters();
                  }
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
                  // only do if triggered from UI
                  if(event.originalEvent){
                    filters.lowPopDen = Math.floor(Math.pow(10, ui.values[0]));
                    filters.highPopDen = Math.ceil(Math.pow(10, ui.values[1]));
                    // if low limit is 1 make low limit 0 - log of 0 undefined
                    if(filters.lowPopDen == 1){
                        filters.lowPopDen = 0;
                    }
                    applyFilters();
                }
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
                  // only do if triggered from UI
                  if(event.originalEvent){
                    filters.lowDate = new Date(ui.values[0] * 1000);
                    filters.highDate = new Date(ui.values[1] * 1000);
                    // if low limit is 1 make low limit 0 - log of 0 undefined
                    applyFilters();
                  }
              }
            });
            $( "#dateSliderTxt" ).text((new Date($( "#dateSlider" ).slider( "values", 0 ) * 1000).toLocaleDateString())  +
              " - " + (new Date($( "#dateSlider" ).slider( "values", 1 ) * 1000).toLocaleDateString()));
          } );
    }
}