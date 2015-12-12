(function($){
	$(document).ready(function (){ console.log("main.js"); setup(); });
})(jQuery);

function setup() {
	var red = d3.select("#red");
	red.x = 50;
	red.y = Math.floor(500*Math.random())+50;
	red.rot = 90;
	red.attr("transform","translate("+red.x+","+red.y+"),rotate("+red.rot+")");
	
	var blue = d3.select("#blue");
	blue.x = 800-50;
	blue.y = Math.floor(500*Math.random())+50;
	blue.rot = -90;
	blue.attr("transform","translate("+blue.x+","+blue.y+"),rotate("+blue.rot+")");
	
	// var sun = d3.select("sun");
}

// var svg = d3.select('svg');
