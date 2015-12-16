"use strict";

var renderLoop;
(function($){
	$(document).ready(function (){
		console.log("main.js");
		init();
		setup();
		renderLoop = setInterval(update, 30);
		$(document).keydown(handleInput);
		$(document).keyup(handleInput);
	});
})(jQuery);

var SCALE = 1.0;

window["red"] = {"color":"red"};
window["blue"] = {"color":"blue"};
var teams = [window["red"], window["blue"]];

var shipShapes = {
	'full ship': [[-8,16],[0,-8],[8,16]],
	'left wing': [[-8,16],[0,-8],[4,4],[0,8],[0,16]],
	'right wing':[[-4,4],[0,-8],[8,16],[0,16],[0,8]],
	'nose only': [[-4,4],[0,-8],[4,4],[0,8]]}

var field;
var fieldWidth = 800;
var fieldHeight = 600;

window["sun"] = {"cx":fieldWidth/2, "cy":fieldHeight/2, "r":5, "points":[]}
for (var i=0; i<8; i++) {
	var px = sun.cx+sun.r*Math.cos(i*Math.PI/4);
	var py = sun.cy+sun.r*Math.sin(i*Math.PI/4);
	sun.points.push([px,py]);
}

var missileTimeout = 2250;
var fireRateLimit = 100;
var gravityStrength = 1*6000;
var speedLimit = 15; //engine propulsion
var maxSpeed = 40; //gravity-boosted
var engineThrust = 0.35;

Math.radians = function(degrees) { return degrees * Math.PI / 180; };
Math.degrees = function(radians) { return radians * 180 / Math.PI; };

function init() {
	var svg = d3.select('#playfield').append("svg")
		.attr("width",fieldWidth)
		.attr("height",fieldHeight)
		.attr("id","field");
	field = d3.select('#field');
	svg.append("rect")
		.attr("width",fieldWidth)
		.attr("height",fieldHeight)
		.attr("fill","black");
	
	svg.append("circle") //sun
		.attr("cx",sun.cx)
		.attr("cy",sun.cy)
		.attr("r", sun.r*SCALE)
		.style("fill","white")
		.attr("id","sun");
	
	d3.select('svg').selectAll(".ship").data(teams).enter().append("polygon")
		.attr("id", function(d){console.log(d.color); return d.color;})
		.attr("fill", function(d){return d.color;})
		.attr("class", "ship");
}

function setup() {
	red.x = 50;
	red.y = Math.floor((fieldHeight-100)*Math.random())+50;
	red.rot = 90;
	red.xv = 0.0;
	red.yv = 0.0;
	red.fireTime = new Date() - 1000;
	red.missileReady = true;
	red.updateShape = true;
	red.shape = "full ship";
	red.thrust = engineThrust;
	red.turnRate = 5;
	red.alive = true;
	
	blue.x = fieldWidth-50;
	blue.y = Math.floor((fieldHeight-100)*Math.random())+50;
	blue.rot = -90;
	blue.xv = 0.0;
	blue.yv = 0.0;
	blue.fireTime = new Date() - 1000;
	blue.missileReady = true;
	blue.updateShape = true;
	blue.shape = "full ship";
	blue.thrust = engineThrust;
	blue.turnRate = 5;
	blue.alive = true;
	
	updateGraphics();
}

function update() {
	checkKeys();
	
	if (missiles.length){
		var filteredMissiles = [];
		for (var i=0; i<missiles.length; i++) {
			var m = missiles[i];
			if (new Date() - m.time > missileTimeout){ m.live = false; }
				
			if (m.live) {
				filteredMissiles.push(m);
			}
		}
		missiles = filteredMissiles;
		
		var dots = d3.select("#field").selectAll('.missile').data(missiles);
		dots.attr("cx", function(d){ return d.x; })
			.attr("cy", function(d){ return d.y; });
		dots.exit().remove();
	}
	
	updatePositions();
	updateGraphics();
}

function updatePositions(){
	var sun = d3.select('#sun');
	
	teams.forEach(function(teamObj){
		if (teamObj.alive) {
			var dx = teamObj.x - sun.attr('cx');
			var dy = teamObj.y - sun.attr('cy');
			var dis = Math.sqrt(dx*dx+dy*dy);
			if (dx*dx+dy*dy > 10){
				var force = gravityStrength / (dx*dx+dy*dy);
			} else {
				var force = gravityStrength;
			}
			teamObj.xv += -force*dx/dis;
			teamObj.yv += -force*dy/dis;
			
			var speed = teamObj.xv*teamObj.xv + teamObj.yv*teamObj.yv;
			if (speed > maxSpeed*maxSpeed) {
				teamObj.xv = maxSpeed*teamObj.xv/Math.sqrt(speed);
				teamObj.yv = maxSpeed*teamObj.yv/Math.sqrt(speed);
			}
		
			checkShipCollision(teamObj, "sun");
			
			teamObj.x += teamObj.xv;
			teamObj.x = (teamObj.x+fieldWidth)%fieldWidth;
			teamObj.y += teamObj.yv;
			teamObj.y = (teamObj.y+fieldHeight)%fieldHeight;
		}
	});
	
	missiles.forEach(function(m){
		var dx = m.x - sun.attr('cx');
		var dy = m.y - sun.attr('cy');
		var dis = Math.sqrt(dx*dx+dy*dy);
		if (dx*dx+dy*dy > 100){
			var force = gravityStrength / (dx*dx+dy*dy);
		} else {
			var force = gravityStrength/100;
		}
		m.xv += -force*dx/dis;
		m.yv += -force*dy/dis;
		
		var speed = m.xv*m.xv + m.yv*m.yv;
		if (speed > maxSpeed*maxSpeed*2) {
			m.xv = 1.414*maxSpeed*m.xv/Math.sqrt(speed);
			m.yv = 1.414*maxSpeed*m.yv/Math.sqrt(speed);
		}
		
		m.nx = m.x + m.xv;
		m.ny = m.y + m.yv;
		checkMissileCollision(m, "sun");
		//checkMissileCollision(m, "red");
		//checkMissileCollision(m, "blue");
		
		if (m.live) {
			m.x = (m.nx+fieldWidth)%fieldWidth;
			m.y = (m.ny+fieldHeight)%fieldHeight;
		}
	});
}

function updateGraphics(team){
	teams.forEach(function(teamObj){
		d3.select("#"+teamObj.color).attr("transform","translate("+teamObj.x+","+teamObj.y+"),rotate("+teamObj.rot+")");
		
		if (teamObj.updateShape) {
			var pointsStr = "";
			shipShapes[teamObj.shape].forEach(function(point){
				pointsStr += point[0]*SCALE+","+point[1]*SCALE+" ";
			});
			d3.select("#"+teamObj.color).attr("points",pointsStr);
		}
	});
}

function teamMove(team,action) {
	var teamObj = window[team];
	if (teamObj.alive) {
		switch (action){
			case "thrust":
				fireEngine(team);
				break;
			case "fire":
				fireMissile(team);
				break;
			case "turn right":
				teamObj.rot = teamObj.rot + teamObj.turnRate;
				break;
			case "turn left":
				teamObj.rot = teamObj.rot - teamObj.turnRate;
				break;
			case "hyperspace":
				break;
		}
	}
}

function fireEngine(team) {
	var teamObj = window[team];
	var speed = teamObj.xv*teamObj.xv + teamObj.yv*teamObj.yv;
	
	var nxv = teamObj.xv + teamObj.thrust*Math.cos(Math.radians(teamObj.rot-90));
	var nyv = teamObj.yv + teamObj.thrust*Math.sin(Math.radians(teamObj.rot-90));
	var speed2 = nxv*nxv + nyv*nyv;
	
	if (speed < speedLimit*speedLimit || speed2 < speed) { //either slow enough or slowing down
		teamObj.xv = nxv;
		teamObj.yv = nyv;
		
		if (speed2 > speed && speed2 > speedLimit*speedLimit) {
			teamObj.xv = speedLimit*teamObj.xv/Math.sqrt(speed2);
			teamObj.yv = speedLimit*teamObj.yv/Math.sqrt(speed2);
		}
	} else {
		teamObj.xv = Math.sqrt(speed)*nxv/Math.sqrt(speed2);
		teamObj.yv = Math.sqrt(speed)*nyv/Math.sqrt(speed2);
	}
}

function checkShipCollision(ship, obj) {
	var sPoints = shipShapes[ship.shape];
	var tPoints;
	var speed = Math.sqrt(ship.xv*ship.xv+ship.yv*ship.yv);
	var num = Math.ceil(speed/5);
	
	if (obj === "sun") {
		obj = sun;
		var dx = obj.cx - ship.x;
		var dy = obj.cy - ship.y;
		var dis = Math.sqrt(dx*dx+dy*dy);
		if (dis > 40) { return; } //pointless to check for a collision if they're far apart
		
		// console.log("Continuing...");
		
		var tPoints = sun.points;
		
		for (var i=0; i<num; i++) {
			var f = i/num;
			
			for (var j=0; j<sPoints.length; j++) {
				var j2 = (j+1)%sPoints.length;
				var sx1 = sPoints[j][0]*Math.cos(ship.rot) + ship.x + f*ship.xv;
				var sy1 = sPoints[j][1]*Math.sin(ship.rot) + ship.y + f*ship.yv;
				var sx2 = sPoints[j2][0]*Math.cos(ship.rot) + ship.x + f*ship.xv;
				var sy2 = sPoints[j2][1]*Math.sin(ship.rot) + ship.y + f*ship.yv;
				var L1 = [[sx1,sy1],[sx2,sy2]];
				
				for (var k=0; k<tPoints.length; k++) {
					var k2 = (k+1)%tPoints.length;
					var tx1 = tPoints[k][0];
					var ty1 = tPoints[k][1];
					var tx2 = tPoints[k2][0];
					var ty2 = tPoints[k2][1];
					var L2 = [[tx1,ty1],[tx2,ty2]];
					
					var intersection = lineIntersection(L1,L2);
					if (intersection.length) {
						// console.log(ship.color+" just died!");
						ship.xv *= (i+1)/num;
						ship.yv *= (i+1)/num;
						ship.alive = false;
						return;
					}
				}
			}
		}
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
	mxv = p.xv + 10*Math.cos(Math.radians(p.rot-90));
	myv = p.yv + 10*Math.sin(Math.radians(p.rot-90));
	mx = p.x + mxv;
	my = p.y + myv;
	
	// missiles.push(new Missile(mx,my,mxv,myv));
	missiles.push({'x':mx, 'y':my, 'xv':mxv, 'yv':myv, 'time':new Date(), 'live':true});
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

function checkMissileCollision(m, obj) {
	if (obj === "sun") {
		var points = sun.points;
	}
	
	var L1 = [[m.x,m.y],[m.nx,m.ny]];
	var len = points.length;
	
	//if (Math.abs(m.nx - cx) <= 5 && Math.abs(m.ny - cy) <= 5) { debugger; }
	
	for (var i=0; i<len; i++) {
		var L2 = [[points[i][0],points[i][1]], [points[(i+1)%len][0],points[(i+1)%len][1]]];
		var intersection = lineIntersection(L1, L2);
		
		if (intersection.length) {
			m.live = false;
			if (obj === "red") {
			} else if (obj === "blue") {
			}
		}
	}
}

function lineIntersection(L1, L2) {
	// from http://stackoverflow.com/a/565282/1473772
	var p = L1[0];
	var r = [L1[1][0]-L1[0][0], L1[1][1]-L1[0][1]];
	var q = L2[0];
	var s = [L2[1][0]-L2[0][0], L2[1][1]-L2[0][1]];
	
	var rcs = r[0]*s[1] - s[0]*r[1]; //r cross s
	var qmp = [q[0]-p[0],q[1]-p[1]]; //q minus p
	var qmpcr = qmp[0]*r[1] - r[0]*qmp[1]; //(q minus p) cross r
	var qmpcs = qmp[0]*s[1] - s[0]*qmp[1]; //(q minus p) cross s
	
	if (rcs === 0) { //they're parallel/colinear
		return []; //I'm just going to assume that overlapping colinear lines don't happen
	} else { //not parallel
		var t = qmpcs/rcs;
		var u = qmpcr/rcs;
		
		if (0 <= t && t <= 1 && 0 <= u && u <= 1) { //intersection exists
			var intx = p[0] + t*r[0];
			var inty = p[1] + t*r[1];
			return [[intx,inty],[t,u]];
		} else { //no intersection
			return [];
		}
	}
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
