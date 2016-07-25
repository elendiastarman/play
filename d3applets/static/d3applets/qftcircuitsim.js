"use strict";

var renderLoop = false;
var cellSize = 50;
var tick = 0;
var origin = [0,0];
var mouseorigin = null;
var infield = 0;
var W, H, xdim, ydim, offx, offy;

$(function(){
    drawGrid(1);
});

function drawGrid(init=0){
    // var field = 
    W = $('#field').width();
    H = $('#field').height();
    xdim = parseInt(W/cellSize/2);
    ydim = parseInt(H/cellSize/2);
    offx = (W-cellSize) / 2;
    offy = (H-cellSize) / 2;
    
    var field = d3.select('#field');

    if(init){
        for(var x = -xdim; x < xdim+1; x++){
            field.append('line')
                .attr('x1', x*cellSize + offx)
                .attr('y1', 0)
                .attr('x2', x*cellSize + offx)
                .attr('y2', H)
                .attr('stroke','#F00')
                .attr('stroke-width','3px');
        }

        for(var y = -ydim; y < ydim+1; y++){
            field.append('line')
                .attr('x1', 0)
                .attr('y1', y*cellSize + offy)
                .attr('x2', W)
                .attr('y2', y*cellSize + offy)
                .attr('stroke','#00F')
                .attr('stroke-width','3px');
        }
        
        field.append('rect')
            .attr('id','testrect')
            .attr('x', offx)
            .attr('y', offy)
            .attr('width', cellSize)
            .attr('height', cellSize)
            .attr('fill', '#0FF')
    }
    
    d3.selectAll('text').remove();
    for(var y = -ydim; y < ydim+1; y++){
        for(var x = -xdim; x < xdim+1; x++){
            field.append('text')
                .attr('x', x*cellSize + offx + cellSize/2)
                .attr('y', y*cellSize + offy + cellSize/2)
                .attr('fill','#AAA')
                .attr('font-size', '12px')
                .attr('text-anchor', 'middle')
                .text("("+(x-origin[0])+", "+(y-origin[1])+")");
        }
    }

}

var tile1 = {"inCoords":[[-1,0]],
         "outCoords":[[0,0]],
         "bodyCoords":[[0,0],[0,1],[1,1]],
         "shape":[],
         "position":[[0,0]],
         "orientation":0,
         "name":"wire (straight)"
};

var tiles = [tile1];

function renderTiles(){
    //
}

var gridDrag = d3.behavior.drag()
	.on('drag', function(d){
        // console.log(d3.mouse(this));
        var mx = d3.mouse(this)[0];
        var my = d3.mouse(this)[1];
        // console.log('mx,my:'+mx+','+my);
		var cellx = Math.floor((mx - offx)/cellSize);
		var celly = Math.floor((my - offy)/cellSize);
        // console.log(cellx+","+celly);
        
        d3.select('#testrect').attr('x', cellx*cellSize + offx).attr('y', celly*cellSize + offy);
        
        if(!mouseorigin){
            mouseorigin = [cellx,celly];
        }else if(mouseorigin[0] !== cellx || mouseorigin[1] !== celly){
            origin[0] += cellx-mouseorigin[0];
            origin[1] += celly-mouseorigin[1];
            mouseorigin = [cellx,celly];
            drawGrid();
        }
	});
d3.select('#field').call(gridDrag);
$('#field').mouseup(function(){mouseorigin = null});

$('#field').mouseenter(function(){infield=1});
$('#field').mouseleave(function(){infield=0});
$('#field').scroll(function(){console.log(this)});