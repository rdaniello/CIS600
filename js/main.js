function main(data){    
    geoJson = topojson.feature(data[0],data[0].objects.cb_2018_us_county_20m).features;
    county_data = d3.group(data[1],function(d){return d.fips;}); // groups of fips
    irate_data = data[2];
    filtered_irate_data = irate_data;
    hlightPoints = [];

    // set the init filters limits based on data extent
    filters.setInitLimits(irate_data, county_data);
    
    // set-up jQueryUI filter widgets
    $( "#filteredCount" ).text(irate_data.length);
    filters.applyjQUI();
    

    // get initial filtered fips and do intial drawing
    applyFilters();
}

function checkToggleRegion(elem, region){
    filters.toggleRegion(elem, region);
}

function applyFilters(){
    // remove any lines and labels
    svgScatter.selectAll('.lineLabel').remove();
    svgScatter.selectAll('line').remove();

    filteredFips = [];
    let tmpfil = irate_data.filter(function(item, index){
            let density = +county_data.get(item.fips)[0].density;
            let stateID = item.fips.substring(0,2);

            if(!(filteredFips.includes(item.fips) )){
                filteredFips.push(item.fips);
            }
            return item.rate <= filters.highIrate &&
                item.rate >= filters.lowIrate &&
                item.temp >= filters.lowTemp &&
                item.temp <= filters.highTemp &&
                density <= filters.highPopDen &&
                density >= filters.lowPopDen &&
                new Date(item.week) >= filters.lowDate &&
                new Date(item.week) <= filters.highDate &&
                filters.stateFilter.includes(stateID);
                
    });

    $( "#filteredCount" ).text(tmpfil.length);
    
    filtered_irate_data = tmpfil;
    
    // draw visulaization elements
    drawBar('canvasBarTemp', 'temp');
    drawBar('canvasBarIRate', 'irate');
    drawScatter();
    drawHighLightedData();
    drawMap();
}

function resetFilters(){
    // reset map scale and center
    mapZoom = {'k': 1, 'x': 1, 'y':1};

    // clear selected county highlighted points
    hlightPoints = [];
    
    // set the filter back to intial values
    filters.resetFiltersValues();   

    // get initial filtered fips and do intial drawing
    applyFilters();
}

function getColor(density){
    if(density < 25){
        return 0;
    }
    if(density < 50){
        return 1;
    }
    if(density < 75){
        return 2;
    }
    if(density < 100){
        return 3;
    }
    if(density < 150){
        return 4;
    }
    if(density < 200){
        return 5;
    }
    if(density < 300){
        return 6;
    }
    if(density < 500){
        return 7;
    }
    if(density < 700){
        return 8;
    }
    if(density < 1000){
        return 9;
    }
    if(density < 2000){
        return 10;
    }
    return 11
}

function checkBoxEvt(elem, stateID){
    let tmpArr = [];
    if(elem.checked){
        filters.stateFilter.push(stateID);
    }
    else{
        tmpArr = filters.stateFilter.filter(function(val){
            if(val != stateID){
                return val
            }
        })
        filters.stateFilter = tmpArr;
    }
    
    applyFilters();
}

function toggleExpand(id){
    let elem = d3.select('#' + id);
    if(elem.classed('stateFilterEX')){
        elem.classed('stateFilterEX', false);
        elem.classed('stateFilterCOL', true);
        elem.select('span')
            .text('+')
    }
    else{
        elem.classed('stateFilterEX', true);
        elem.classed('stateFilterCOL', false);
        elem.select('span')
            .text('-')
    }
}