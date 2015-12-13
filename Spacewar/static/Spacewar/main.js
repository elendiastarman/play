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

window["red"] = {};
window["blue"] = {};
var field = d3.select('#field');
var missileTimeout = 2250;
var fireRateLimit = 100;
var fieldWidth = 800;
var fieldHeight = 600;
Math.radians = function(degrees) {
	return degrees * Math.PI / 180;
};
Math.degrees = function(radians) {
	return radians * 180 / Math.PI;
};

function setup() {
	red.x = 50;
	red.y = Math.floor((fieldHeight-100)*Math.random())+50;
	red.rot = 90;
	red.xv = 0.0;
	red.yv = 0.0;
	red.fireTime = new Date() - 1000;
	red.missileReady = true;
	updateGraphics("red");
	//red.attr("transform","translate("+red.x+","+red.y+"),rotate("+red.rot+")");
	
	blue.x = fieldWidth-50;
	blue.y = Math.floor((fieldHeight-100)*Math.random())+50;
	blue.rot = -90;
	blue.xv = 0.0;
	blue.yv = 0.0;
	blue.fireTime = new Date() - 1000;
	blue.missileReady = true;
	updateGraphics("blue");
	//blue.attr("transform","translate("+blue.x+","+blue.y+"),rotate("+blue.rot+")");
}

function updatePosition(team){
	var teamObj = window[team];
	if (teamObj.xv*teamObj.xv + teamObj.yv*teamObj.yv > 225){
		teamObj.xv = 15.*teamObj.xv/Math.sqrt(teamObj.xv*teamObj.xv + teamObj.yv*teamObj.yv);
		teamObj.yv = 15.*teamObj.yv/Math.sqrt(teamObj.xv*teamObj.xv + teamObj.yv*teamObj.yv);
	}
	teamObj.x += teamObj.xv;
	teamObj.x = (teamObj.x+fieldWidth)%fieldWidth;
	teamObj.y += teamObj.yv;
	teamObj.y = (teamObj.y+fieldHeight)%fieldHeight;
}

function updateGraphics(team){
	var teamObj = window[team];
	d3.select("#"+team).attr("transform","translate("+teamObj.x+","+teamObj.y+"),rotate("+teamObj.rot+")");
}

function update() {
	checkKeys();
	
	if (missiles.length){
		var filteredMissiles = [];
		for (var i=0; i<missiles.length; i++) {
			var m = missiles[i];
			if (new Date() - m.time < missileTimeout){
				m.x += m.xv;
				m.x = (m.x+fieldWidth)%fieldWidth;
				m.y += m.yv;
				m.y = (m.y+fieldHeight)%fieldHeight;
				filteredMissiles.push(m);
			}
		}
		missiles = filteredMissiles;
		
		var dots = d3.select("#field").selectAll('.missile').data(missiles);
		dots.attr("cx", function(d){ return d.x; })
			.attr("cy", function(d){ return d.y; });
		dots.exit().remove();
	}
	
	updatePosition("red");
	updateGraphics("red");
	
	updatePosition("blue");
	updateGraphics("blue");
}

function teamMove(team,action) {
	var teamObj = window[team];
	switch (action){
		case "thrust":
			teamObj.xv += 0.5*Math.cos(Math.radians(teamObj.rot-90));
			teamObj.yv += 0.5*Math.sin(Math.radians(teamObj.rot-90));
			break;
		case "fire":
			fireMissile(team);
			break;
		case "turn right":
			teamObj.rot = teamObj.rot + 5;
			break;
		case "turn left":
			teamObj.rot = teamObj.rot - 5;
			break;
		case "hyperspace":
			break;
	}
}

var missiles = [];
/* class Missile {
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
} */

function fireMissile(team) {
	var mx,my,mxv,myv;
	var p = window[team];
	mx = p.x;
	my = p.y;
	mxv = p.xv + 10*Math.cos(Math.radians(p.rot-90));
	myv = p.yv + 10*Math.sin(Math.radians(p.rot-90));
	
	// missiles.push(new Missile(mx,my,mxv,myv));
	missiles.push({'x':mx, 'y':my, 'xv':mxv, 'yv':myv, 'time':new Date()});
	missiles[missiles.length-1]['id'] = missiles.length;
	
	d3.select("#field").selectAll(".missile")
		.data(missiles)
	  .enter().append("circle")
		.attr("cx", function(d){ return d.x; })
		.attr("cy", function(d){ return d.y; })
		.attr("r", 1.5)
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
	
	if (event.which == 191){ event.preventDefault(); };
	
	if (event.type == 'keydown'){ keystates[event.which] = true;  }
	if (event.type == 'keyup')  {
		keystates[event.which] = false;
		
		if (event.which == 66) {
			window["red"].missileReady = true;
		} else if (event.which == 191) {
			window["blue"].missileReady = true;
		}
	}
}

var keysOfInterest = [
			90,88,67,86,66,
			78,77,188,190,191
		     ];
function checkKeys() {
	keysOfInterest.forEach(function(k){
		if (keystates[k]){
			switch (k){
				// RED
				case 90:
					teamMove("red","turn left");
					break;
				case 88:
					teamMove("red","turn right");
					break;
				case 67:
					teamMove("red","hyperspace");
					break;
				case 86:
					teamMove("red","thrust");
					break;
				case 66:
					if (new Date() - window["red"].fireTime > fireRateLimit && window["red"].missileReady) {
						teamMove("red","fire");
						window["red"].fireTime = new Date();
						window["red"].missileReady = false;
					}
					break;
				
				// BLUE
				case 78:
					teamMove("blue","turn left");
					break;
				case 77:
					teamMove("blue","turn right");
					break;
				case 188:
					teamMove("blue","hyperspace");
					break;
				case 190:
					teamMove("blue","thrust");
					break;
				case 191:
					if (new Date() - window["blue"].fireTime > fireRateLimit && window["blue"].missileReady) {
						teamMove("blue","fire");
						window["blue"].fireTime = new Date();
						window["blue"].missileReady = false;
					}
					break;
			}
		}
	});
}
