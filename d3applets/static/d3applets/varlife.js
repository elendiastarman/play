"use strict";

var renderLoop = false;
$(function(){
	$('#tps').on('change', function(){
		$('#mspt').val(Math.round(1000/this.val()));
		if (renderLoop) { setRenderLoop(); }
	});
	$('#mspt').on('change', function(){
		$('#tps').val(Math.round(1000/this.val()));
		if (renderLoop) { setRenderLoop(); }
	});
	$('#toroidal').on('change', function(){
		toroidal = this.checked;
	});
	
	initGrid();
});

function setRenderLoop() {
	if (renderLoop) { clearInterval(renderLoop); }
	renderLoop = setInterval(update, $('#mspt').val());
}

function start() { setRenderLoop(); }
function stop() { clearInterval(renderLoop); renderLoop = false; }

var rules = [{'dead':'#000000', 'alive':'#FFFFFF', 'birth':[3], 'survive':[2,3]}];
var grid = [];
var gridW = 20;
var gridH = 20;
var cellSize = 10;
var toroidal = false;

function initGrid() {
	for (var j=0; j<gridH; j++) {
		var row = [];
		for (var i=0; i<gridW; i++) {
			row.push( [0,0,0] ); //rule number, current state, new state
			d3.select('#blocks').append('rect')
				.attr('x',i*cellSize)
				.attr('y',j*cellSize)
				.attr('width',cellSize)
				.attr('height',cellSize)
				.attr('fill', '#000000')
				.attr('stroke','#808080')
				.attr('stroke-width','1px')
				.attr('id','b_'+i+'_'+j)
				.attr('class','block')
				.on('click', toggleCell)
		}
		grid.push(row);
	}
	
	d3.select('#field')
		.attr('width', cellSize*(gridW+0))
		.attr('height', cellSize*(gridH+1))
}

function update() {
	updateGrid();
	updateGraphics();
}

function updateGrid() {
	for (var j=0; j<gridH; j++) {
		for (var i=0; i<gridW; i++) {
			var total = 0;
			
			for (var dj=-1; dj<2; dj++) {
				var j2 = j+dj;
				
				if (j2 < 0 || j2 >= gridH) {
					if (toroidal) {
						j2 = (j2+gridH)%gridH;
					} else {
						continue;
					}
				}
				
				for (var di=-1; di<2; di++) {
					var i2 = i+di;
					
					if (i2 < 0 || i2 >= gridW) {
						if (toroidal) {
							i2 = (i2+gridW)%gridW;
						} else {
							continue;
						}
					}
					
					if (di !== 0 || dj !== 0) {
						total += grid[j2][i2][1];
					}
				}
			}
			
			var cell = grid[j][i];
			var part = rules[cell[0]][cell[1] ? 'survive' : 'birth'];
			
			cell[2] = 0;
			for (var k=0; k<part.length; k++) {
				if (total === part[k]) {
					cell[2] = 1;
				}
			}
		}
	}
}

function updateGraphics() {
	for (var j=0; j<gridH; j++) {
		for (var i=0; i<gridW; i++) {
			var cell = grid[j][i];
			var rule = rules[cell[0]];
			cell[1] = cell[2];
			d3.select("#blocks").select('#b_'+i+'_'+j).attr('fill', rule[cell[1] ? 'alive' : 'dead']);
		}
	}
}

function toggleCell() {
	var coords = d3.select(this).attr('id').split('_').map(Number);
	var cell = grid[coords[2]][coords[1]];
	var state = 1 - cell[1];
	
	if (renderLoop) {
		cell[2] = state; //flip state
	} else {
		cell[1] = state;
		var rule = rules[cell[0]];
		d3.select(this).attr('fill', rule[state ? 'alive' : 'dead']);
	}
}

function setRules() {
	//
}

function resize() {
	//
}

function addRule() {
	//
}