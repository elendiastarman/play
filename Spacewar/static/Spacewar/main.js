"use strict";

var renderLoop;
(function($){
	$(document).ready(function (){
		console.log("main.js");
		setup();
		renderLoop = setInterval(update, 30);
		$(document).keydown(handleInput);
		$(document).keyup(handleInput);
	});
})(jQuery);

var red = d3.select("#red");
var blue = d3.select("#blue");
var field = d3.select('#field');

function setup() {
	red.x = 50.;
	red.y = Math.floor(500*Math.random())+50;
	red.rot = 90;
	red.xv = 0.0;
	red.yv = 0.0;
	red.attr("transform","translate("+red.x+","+red.y+"),rotate("+red.rot+")");
	
	blue.x = 800-50.;
	blue.y = Math.floor(500*Math.random())+50;
	blue.rot = -90;
	blue.xv = 0.0;
	blue.yv = 0.0;
	blue.attr("transform","translate("+blue.x+","+blue.y+"),rotate("+blue.rot+")");
}

function update() {
	checkKeys();
	
	if (missiles.length){
		var filteredMissiles = [];
		for (var i=0; i<missiles.length; i++) {
			var m = missiles[i];
			m.x += m.xv;
			m.x = (m.x+800)%800;
			m.y += m.yv;
			m.y = (m.y+600)%600;
			// if (m.time
			filteredMissiles.push(m);
		}
		missiles = filteredMissiles;
		
		var dots = d3.select("#field").selectAll('.missile').data(missiles);
		dots.attr("cx", function(d){ return d.x; })
			.attr("cy", function(d){ return d.y; });
		dots.exit().remove();
	}
	
	if (red.xv*red.xv + red.yv*red.yv > 400){
		red.xv = 15.*red.xv/Math.sqrt(red.xv*red.xv + red.yv*red.yv);
		red.yv = 15.*red.yv/Math.sqrt(red.xv*red.xv + red.yv*red.yv);
	}
	red.x += red.xv;
	red.x = (red.x+800)%800;
	red.y += red.yv;
	red.y = (red.y+600)%600;
	d3.select('#red').attr("transform","translate("+red.x+","+red.y+"),rotate("+red.rot+")");
	
	if (blue.xv*blue.xv + blue.yv*blue.yv > 400){
		blue.xv = 15.*blue.xv/Math.sqrt(blue.xv*blue.xv + blue.yv*blue.yv);
		blue.yv = 15.*blue.yv/Math.sqrt(blue.xv*blue.xv + blue.yv*blue.yv);
	}
	blue.x += blue.xv;
	blue.x = (blue.x+800)%800;
	blue.y += blue.yv;
	blue.y = (blue.y+600)%600;
	d3.select('#blue').attr("transform","translate("+blue.x+","+blue.y+"),rotate("+blue.rot+")");
}

function redMove(action) {
	switch (action){
		case "thrust":
		red.xv += 0.5*Math.cos(Math.radians(red.rot-90));
		red.yv += 0.5*Math.sin(Math.radians(red.rot-90));
		break;
		case "fire":
		fireMissile("red");
		break;
		case "turn right":
		red.rot = red.rot + 5;
		break;
		case "turn left":
		red.rot = red.rot - 5;
		break;
		case "hyperspace":
		break;
	}
}

function blueMove(action) {
	switch (action){
		case "thrust":
		blue.xv += 0.5*Math.cos(Math.radians(blue.rot-90));
		blue.yv += 0.5*Math.sin(Math.radians(blue.rot-90));
		break;
		case "fire":
		fireMissile("blue");
		break;
		case "turn right":
		blue.rot = blue.rot + 5;
		break;
		case "turn left":
		blue.rot = blue.rot - 5;
		break;
		case "hyperspace":
		break;
	}
}

var missiles = [];
class Missile {
	constructor(x,y,xv,yv) {
		this.x = x;
		this.y = y;
		this.xv = xv;
		this.yv = yv;
		if (missiles.length > 0){
			this.id = missiles[missiles.length-1].id + 1;
		} else {
			this.id = 1;
		}
		this.name = "missile"+this.id;
	}
}

function fireMissile(color) {
	var mx,my,mxv,myv;
	var p;
	
	switch (color) {
		case "red":
		p = red;
		break;
		case "blue":
		p = blue;
		break;
	}
	mx = p.x;
	my = p.y;
	mxv = p.xv + 10*Math.cos(Math.radians(p.rot-90));
	myv = p.yv + 10*Math.sin(Math.radians(p.rot-90));
	
	missiles.push(new Missile(mx,my,mxv,myv));
	
	d3.select("#field").selectAll(".missile")
		.data(missiles)
	  .enter().append("circle")
		.attr("cx", function(d){ return d.x; })
		.attr("cy", function(d){ return d.y; })
		.attr("r", 2)
		.style("fill","white")
		.attr("class", "missile");
}

var keystates = {};
function handleInput(event) {
	if (event.which == 27){
		clearInterval(renderLoop);
		renderLoop = false;
		return;
	} else if (event.which == 13){
		event.preventDefault();
		if (!renderLoop){ renderLoop = setInterval(update, 30); }
		return;
	}
	
	if (event.type == 'keydown'){ keystates[event.which] = true;  }
	if (event.type == 'keyup')  { keystates[event.which] = false; }
}

var keysOfInterest = [90,88,67,86,66, 78,77,188,190,191];
function checkKeys() {
	keysOfInterest.forEach(function(k){
		if (keystates[k]){
			switch (k){
				// RED
				case 90:
				redMove("turn left");
				break;
				case 88:
				redMove("turn right");
				break;
				case 67:
				redMove("hyperspace");
				break;
				case 86:
				redMove("thrust");
				break;
				case 66:
				redMove("fire");
				break;
				
				// BLUE
				case 78:
				blueMove("turn left");
				break;
				case 77:
				blueMove("turn right");
				break;
				case 188:
				blueMove("hyperspace");
				break;
				case 190:
				blueMove("thrust");
				break;
				case 191:
				blueMove("fire");
				break;
			}
		}
	});
}

Math.radians = function(degrees) {
	return degrees * Math.PI / 180;
};
Math.degrees = function(radians) {
	return radians * 180 / Math.PI;
};