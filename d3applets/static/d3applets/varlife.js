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
	
	$('#width').on('change', resize);
	$('#height').on('change', resize);
	
	$('#rules').on('change', 'input[type=text]', changeRules);
	$('#rules').on('click', '.rule', function(){
		$('.picked').removeClass('picked');
		$(this).addClass('picked');
	});
	
	// $('#field').on('mousedown', function(){ console.log("down"); mouseDown = true; });
	$('#field').on('mouseup', function(){ mouseDown = false; toggleTo = -1; });
	
	initGrid();
});

function setRenderLoop() {
	if (renderLoop) { clearInterval(renderLoop); }
	renderLoop = setInterval(update, fastMode ? 1 : $('#mspt').val());
}

function start() {
	if (steps === 0) { steps = -1; }
	setRenderLoop();
}
function stop() { clearInterval(renderLoop); renderLoop = false; }

var rules = [{'dead':'#000000', 'alive':'#FFFFFF', 'birth':[3], 'survive':[2,3]}];
var grid = [];
var gridW = 20;
var gridH = 20;
var cellSize = 10;
var toroidal = false;
var steps = -1;
var generations = 0;
var fastMode = false;
var mouseDown = false;
var toggleTo = -1;

function initGrid() {
	grid = [];
	
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
				.on('mousedown', function(){
					mouseDown = true;
					d3.select(this).call(changeCell.bind(this));
				})
				.on('mouseover', changeCell)
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
	generations = 0;
	steps = 0;
	updateGraphics();
	stop();
}

function update() {
	if (!renderLoop && !fastMode) { start(); }
	
	if (steps === 0) {
		clearInterval(renderLoop);
		renderLoop = false;
		fastMode = false;
	} else {
		generations += 1;
		steps -= 1;
		updateGrid();
		updateGraphics();
	}
}
function step(){steps = 1; update();}

function slow() {
	steps = $('#numSteps').val();
	start();
}
function fast(){
	fastMode = true;
	steps = parseInt($('#numSteps').val());
	while (fastMode) { update(); }
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
			
			if (renderLoop || fastMode){ cell[1] = cell[2]; }
			
			if (!fastMode) { d3.select("#blocks").select('#b_'+i+'_'+j).attr('fill', rule[cell[1] ? 'alive' : 'dead']); }
		}
	}
	
	$('#generationCounter').text(generations);
}

function changeCell() {
	if (!mouseDown){ return; }
	
	var coords = d3.select(this).attr('id').split('_').map(Number);
	var cell = grid[coords[2]][coords[1]];
	var which = $('input[name="paintKind"]:checked').val();
	
	if (which === "toggle") {
		if (toggleTo+1) {
			cell[1] = toggleTo;
		} else {
			cell[1] = 1 - cell[1];
			toggleTo = cell[1];
		}
	} else if (which === "paint") {
		var num = parseInt($('.picked:first').attr('id').substr(4,100));
		console.log(cell);
		cell[0] = num-1;
		console.log(cell);
	}
	
	var rule = rules[cell[0]];
	d3.select(this).attr('fill', rule[cell[1] ? 'alive' : 'dead']);
}

function resize() {
	var oldGrid = $.extend(true, [], grid);
	var oldW = gridW;
	var oldH = gridH;
	
	gridW = parseInt($('#width').val());
	gridH = parseInt($('#height').val());
	
	// console.log(oldGrid);
	d3.selectAll(".block").remove();
	initGrid();
	// console.log(oldGrid);
	
	for (var j=0; j<Math.min(oldH,gridH); j++) {
		for (var i=0; i<Math.min(oldW,gridW); i++) {
			for (var k=0; k<3; k++) {
				grid[j][i][k] = oldGrid[j][i][k];
			}
		}
	}
	
	updateGraphics();
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
	div.removeClass('picked');
	div.attr('id','rule'+n);
	
	var R = new RegExp('(id=".*?)'+rules.length+'(.*?")', 'g'); //these two lines do a find-and-replace on rules[n-1]whatever -> rules[n]whatever
	div.html( div.html().replace(R, '$1'+n+'$2') );
	
	$('#rules').append(div);
	
	rules.push( $.extend(true, {}, rules[rules.length-1]) ); //http://stackoverflow.com/a/5164215/1473772
}

function removeRule() {
	//
}