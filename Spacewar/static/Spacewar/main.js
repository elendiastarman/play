var renderLoop;
(function($){
	$(document).ready(function (){
		console.log("main.js");
		setup();
		renderLoop = setInterval(update, 30);
	});
})(jQuery);

var red = d3.select("#red");
var blue = d3.select("#blue");

function setup() {
	red.x = 50;
	red.y = Math.floor(500*Math.random())+50;
	red.rot = 90;
	red.xv = 10;
	red.yv = 0;
	red.attr("transform","translate("+red.x+","+red.y+"),rotate("+red.rot+")");
	
	blue.x = 800-50;
	blue.y = Math.floor(500*Math.random())+50;
	blue.rot = -90;
	blue.xv = 0;
	blue.yv = 0;
	blue.attr("transform","translate("+blue.x+","+blue.y+"),rotate("+blue.rot+")");
}

function update() {
	red.x = red.x + red.xv;
	if (red.x > 800) { red.x -= 800 } else if (red.x < 0) { red.x += 800 }
	red.y = red.y + red.yv;
	red.rot = red.rot + 5;
	d3.select('#red').attr("transform","translate("+red.x+","+red.y+"),rotate("+red.rot+")");
}

function redMove(action) {
	switch (action){
		case "thrust":
		break;
		case "fire":
		break;
		case "turn right":
		break;
		case "turn left":
		break;
		case "hyperspace":
		break;
	}
}

// var svg = d3.select('svg');
