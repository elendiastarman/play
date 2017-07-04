"use strict";

var renderLoop;
var fps = 60;
var factor = 0.05;
var scale = 1; //screen size / physical size
var spacing = 10; //between text and spinner edge
var angvel_graph_size = 300; //pixels; angvel_graph will be scaled to fit
var angvel_limit, angvel_scale;

var leftAng, rightAng;
var leftAV, rightAV;
var leftTorque, rightTorque;

var leftMagnets = []; //list of 1 (north) and/or -1 (south)
var rightMagnets = [];
var left, right;
var ang_graph, old_dots, current_dot;
var angvel_graph, old_av_dots, current_av_dot;

function init() {
	var svg = d3.select('svg');
  svg.selectAll('*').remove();

  var frame = svg.append('g').attr('id', 'frame');
  left = frame.append('g').attr('id', 'left');
  right = frame.append('g').attr('id', 'right');
  ang_graph = svg.append('g').attr('id', 'ang-graph');
  angvel_graph = svg.append('g').attr('id', 'angvel-graph');
  
  var properties = [
  	'leftN', 'rightN', //number of lobes
    'leftR', 'rightR', //radius of spinners
    'leftK', 'rightK', //strength of magnets
    'leftAngInitial', 'rightAngInitial', //initial angular position in radians
    'leftAVInitial', 'rightAVInitial', //initial angular velocity in rad/sec
    'D', //distance between spinner centers
  ]
  
  properties.forEach(function(p){
  	window[p] = parseFloat(d3.select('#'+p).property('value'));
  })

  leftMagnets = []; //list of 1 (north) and/or -1 (south)
  rightMagnets = [];

  var frameY = Math.max(leftR, rightR) + spacing;
  var frameWidth = Math.max(leftR + D + rightR + 2*spacing, 2*leftR + 2*spacing);
  angvel_limit = Math.abs(leftAVInitial) + Math.abs(rightAVInitial) + 3;
  angvel_scale = angvel_graph_size / angvel_limit;

  d3.select('svg')
    .attr("width", frameWidth + 360 + angvel_graph_size)
    .attr("height", Math.max(Math.max(2 * frameY, 360), angvel_graph_size));

  var offsetX = leftR + D/2 + spacing;
  var frame = d3.select('#frame');
  frame.attr("transform", "translate("+offsetX+","+frameY+")");
  frame.append("rect")
    .attr("x", -offsetX)
    .attr("y", -frameY)
    .attr("width", frameWidth)
    .attr("height", 2 * frameY)
    .attr("fill", "transparent")
    .attr("stroke", "black")
    .attr("stroke-width", "1pt");

  var left = d3.select('#left');
  left.attr("transform", "translate("+(-D/2)+",0)");
  left.append('circle')
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", leftR + spacing)
    .attr("fill", "red");
  left.append('circle')
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", leftR)
    .attr("fill", "transparent")
    .attr("stroke", "white");

  right = d3.select('#right')
  right.attr("transform", "translate("+(D/2)+",0)");
  right.append('circle')
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", rightR + spacing)
    .attr("fill", "blue");
  right.append('circle')
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", rightR)
    .attr("fill", "transparent")
    .attr("stroke", "white");
  
  ang_graph.attr("transform", "translate("+frameWidth+", 0)");
  ang_graph.append("rect")
    .attr("width", 360)
    .attr("height", 360)
    .attr("fill", "transparent")
    .attr("stroke", "black")
    .attr("stroke-width", "1pt");
  old_dots = ang_graph.append("g")
    .attr("id", "old-dots")
    .attr("class", "old-dots");
  current_dot = ang_graph.append("circle")
    .attr("cx", 180)
    .attr("cy", 180)
    .attr("r", 3)
    .attr("fill", "red")
    .attr("id", "ang-graph-current");

  angvel_graph.attr("transform", "translate("+(frameWidth+360)+", 0)");
  angvel_graph.append("rect")
    .attr("width", angvel_graph_size)
    .attr("height", angvel_graph_size)
    .attr("fill", "transparent")
    .attr("stroke", "black")
    .attr("stroke-width", "1pt");
  var all_av_dots = angvel_graph.append("g")
    .attr("transform", "translate("+(angvel_graph_size/2)+", "+(angvel_graph_size/2)+")");
  old_av_dots = all_av_dots.append("g")
    .attr("id", "old-av-dots")
    .attr("class", "old-dots");
  current_av_dot = all_av_dots.append("circle")
    .attr("cx", leftAVInitial * angvel_scale)
    .attr("cy", rightAVInitial * angvel_scale)
    .attr("r", 3)
    .attr("fill", "red")
    .attr("id", "angvel-graph-current");
  
  var pole;
	for (var i=0; i<leftN; i++) {
  	pole = 1 - (i % 2) * 2;
  	leftMagnets.push(pole);
    left.append("text")
    	.attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("id", "left-"+i)
      .text(pole == 1 ? "N" : "S");
  }
	for (var i=0; i<rightN; i++) {
  	pole = (i % 2) * 2 - 1;
  	rightMagnets.push(pole);
    right.append("text")
    	.attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("id", "right-"+i)
      .text(pole == 1 ? "N" : "S");
  }
	reset();
  startLoop();
}

//assumes that (x1, y1) and (x2, y2) are offset from the pivot
function calculateTorque(x1, y1, x2, y2) {
	var dis = Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2));
  var force = leftK * rightK / Math.pow(dis, 3);
  
  var magB = Math.sqrt(Math.pow(x2, 2) + Math.pow(y2, 2));
  var normB = [x2 / magB, y2 / magB];
  var dot = x1 * normB[0] + y1 * normB[1];
  
  //(a dot normB) * normB
  var projection = [dot * normB[0], dot * normB[1]];
  var rejection = [x1 - projection[0], y1 - projection[1]];
  var magR = Math.sqrt(Math.pow(rejection[0], 2) + Math.pow(rejection[1], 2));
  
  var cross = x1 * y2 - x2 * y1;
  
  //console.log("torque:", force * magR)
  return force * magR * (cross > 0 ? 1 : -1);
}

function iterate() {
	leftTorque = 0;
  for (var i=0; i<leftN; i++) {
  	var x1 = leftR * Math.cos((i / leftN) * 2*Math.PI + leftAng);
  	var y1 = leftR * Math.sin((i / leftN) * 2*Math.PI + leftAng);
  	for (var j=0; j<rightN; j++) {
      var x2 = rightR * Math.cos((j / rightN) * 2*Math.PI + rightAng) + D;
      var y2 = rightR * Math.sin((j / rightN) * 2*Math.PI + rightAng);
      leftTorque += calculateTorque(x1, y1, x2, y2) * (-leftMagnets[i] * rightMagnets[j]);
    }
  }
  leftAV += leftTorque * factor;
  
	rightTorque = 0;
  for (var i=0; i<rightN; i++) {
  	var x1 = rightR * Math.cos((i / rightN) * 2*Math.PI + rightAng);
  	var y1 = rightR * Math.sin((i / rightN) * 2*Math.PI + rightAng);
  	for (var j=0; j<leftN; j++) {
      var x2 = leftR * Math.cos((j / leftN) * 2*Math.PI + leftAng) - D;
      var y2 = leftR * Math.sin((j / leftN) * 2*Math.PI + leftAng);
      rightTorque += calculateTorque(x1, y1, x2, y2) * (-rightMagnets[i] * leftMagnets[j]);
    }
  }
  rightAV += rightTorque * factor;

  leftAng += leftAV * factor;
  rightAng += rightAV * factor;
  
  draw();
}

function toHex(x) {
	var s = "00" + Math.min(Math.max(Math.round(x), 0), 255).toString(16);
  return s.substr(s.length-2);
}

function draw() {
  for (var i=0; i<leftN; i++) {
  	d3.select("#left-"+i)
    	.attr("x", leftR * Math.cos((i / leftN) * 2*Math.PI + leftAng))
    	.attr("y", leftR * Math.sin((i / leftN) * 2*Math.PI + leftAng))
  }
  for (var i=0; i<rightN; i++) {
  	d3.select("#right-"+i)
    	.attr("x", rightR * Math.cos((i / rightN) * 2*Math.PI + rightAng))
    	.attr("y", rightR * Math.sin((i / rightN) * 2*Math.PI + rightAng))
  }
  
  var old_cx = current_dot.attr("cx");
  var old_cy = current_dot.attr("cy");
  var vel = Math.sqrt(leftAV*leftAV + rightAV*rightAV);
  var r = 255 / (1 + Math.abs(leftAV));
  var g = 255 / (1 + vel);
  var b = 255 / (1 + Math.abs(rightAV));
  var col = "#" + toHex(r) + toHex(g) + toHex(b);
  old_dots.append("circle")
    .attr("cx", old_cx)
    .attr("cy", old_cy)
    .attr("r", 3)
    .attr("fill", col);
    
  var cdcx = ((leftAng * 180 / Math.PI) % 360 + 360) % 360;
  var cdcy = ((rightAng * 180 / Math.PI) % 360 + 360) % 360;
  current_dot
    .attr("cx", cdcx)
    .attr("cy", cdcy);
  
  var old_av_cx = current_av_dot.attr("cx");// - angvel_limit/2 * angvel_scale;
  var old_av_cy = current_av_dot.attr("cy");// - angvel_limit/2 * angvel_scale;
  var tor = Math.sqrt(leftTorque*leftTorque + rightTorque*rightTorque);
  var r = 255 / (1 + Math.abs(leftTorque));
  var g = 255 / (1 + tor);
  var b = 255 / (1 + Math.abs(rightTorque));
  var col = "#" + toHex(r) + toHex(g) + toHex(b);
  old_av_dots.append("circle")
    .attr("cx", old_av_cx)
    .attr("cy", old_av_cy)
    .attr("r", 3)
    .attr("fill", col);

  current_av_dot
    .attr("cx", leftAV * angvel_scale)
    .attr("cy", rightAV * angvel_scale);
}

function startLoop() {
	if (!renderLoop) {
		console.log("Started.");
		renderLoop = setInterval(iterate, 1000/fps);
    iterate();
  }
}

function reset() {
	console.log("Reset.");
  leftAng = leftAngInitial;
  rightAng = rightAngInitial;
  leftAV = leftAVInitial;
  rightAV = rightAVInitial;
  d3.select(".old-dots").selectAll("*").remove();
  draw();
}

function stopLoop() {
	if (renderLoop) {
    console.log("Stopped.");
    clearInterval(renderLoop);
    renderLoop = null;
  }
}

d3.select("#start").on("click", startLoop);
d3.select("#stop").on("click", stopLoop);
d3.select("#reset").on("click", reset);
d3.select("#initialize").on("click", init);

//init();