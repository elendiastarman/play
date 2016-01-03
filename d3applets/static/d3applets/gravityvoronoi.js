var linesList = [];
var spacing = 20;
for (var i=spacing; i<600; i+=spacing) {
	for (var j=spacing; j<600; j+=spacing) {
		linesList.push([i,j]);
	}
}

var linesData = d3.select("#lines").selectAll("line").data(linesList);
linesData.enter().append("line")
	.attr("x1", function(d){ return d[0]; })
	.attr("y1", function(d){ return d[1]; })
	.attr("x2", function(d){ return d[0]; })
	.attr("y2", function(d){ return d[1]+10; })
	.attr("stroke","white")
	.attr("stroke-width","2px");

function realign(line){
	var L = d3.select(this);
	var g = 300;
	
	var x = parseInt(L.attr("x1"));
	var y = parseInt(L.attr("y1"));
	var dx = d3.select("#sun").attr("cx") - x;
	var dy = d3.select("#sun").attr("cy") - y;
	
	var r = Math.sqrt(dx*dx+dy*dy);
	if (r < 15) {
		var f = 1;
	} else {
		var f = g/(r*r) + 1/r;
	}
	
	L.attr("x2", x + f*dx);
	L.attr("y2", y + f*dy);
	
}

d3.select("#lines").selectAll("line").each(realign);

var drag = d3.behavior.drag()
  .on("drag", function(){
	//stuff
	d3.select(this).attr("cx",d3.event.x).attr("cy",d3.event.y);
	d3.select("#lines").selectAll("line").each(realign);
  });
d3.select('svg').selectAll('circle').call(drag);