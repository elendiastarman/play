"use strict";

var renderLoop = false;
$(function(){
	$('#tps').on('change', function(){
		$('#mspt').val(Math.round(1000/$('#tps').val()));
		if (renderLoop) { setRenderLoop(); }
	});
	$('#mspt').on('change', function(){
		$('#tps').val(Math.round(1000/$('#mspt').val()));
		if (renderLoop) { setRenderLoop(); }
	});
	$('#toroidal').on('change', function(){
		toroidal = this.checked;
	});
	
	$('#rules').on('change', 'input[type=text]', changeRules);
	
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
		.attr('width', cellSize*gridW)
		.attr('height', cellSize*gridH);
}

function clearGrid() {
	for (var j=0; j<gridH; j++) {
		for (var i=0; i<gridW; i++) {
			grid[j][i][1] = 0;
			grid[j][i][2] = 0;
		}
	}
	if (!renderLoop){ update(); stop(); }
}

function step(){update()}
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
			
			if (renderLoop){ cell[1] = cell[2]; }
			
			d3.select("#blocks").select('#b_'+i+'_'+j).attr('fill', rule[cell[1] ? 'alive' : 'dead']);
		}
	}
}

function toggleCell() {
	var coords = d3.select(this).attr('id').split('_').map(Number);
	var cell = grid[coords[2]][coords[1]];
	var state = 1 - cell[1];
	
	cell[1] = state;
	var rule = rules[cell[0]];
	d3.select(this).attr('fill', rule[state ? 'alive' : 'dead']);
}

function resize() {
	//
}

var regex = new RegExp('.*([0-9]+)(.*)');
function changeRules() {
	var R = regex.exec($(this).attr('id'));
	var num = R[1];
	var kind = R[2];
	
	if (kind === "text") {
		var s = $(this).val().split('/').map(function(x){ return x.substr(1,x.length-1).split('').map(Number); });
		rules[num-1]["birth"] = s[0];
		rules[num-1]["survive"] = s[1];
	} else if (kind === "alive" || kind === "dead") {
		rules[num-1][kind] = $(this).val();
		d3.select('#'+$(this).attr('id')+'color').style("background-color",$(this).val());
		
		if (!renderLoop){ updateGraphics(); }
	}
}

function addRule() {
	var n = rules.length+1;
	
	var div = $('.rule:last').clone();
	div.attr('id','rule'+n);
	
	var R = new RegExp('(id=".*?)'+rules.length+'(.*?")', 'g'); //these two lines do a find-and-replace on rules[n-1]whatever -> rules[n]whatever
	div.html( div.html().replace(R, '$1'+n+'$2') );
	
	$('#rules').append(div);
	
	rules.push( $.extend(true, {}, rules[rules.length-1]) ); //http://stackoverflow.com/a/5164215/1473772
}

function removeRule() {
	//
}