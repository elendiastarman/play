var svg = d3.select('svg');

var arc = d3.svg.arc()
	.startAngle(function(d){
		return Math.atan2(d[0].attr("cy")-d[2].attr("cy"),
			d[0].attr("cx")-d[2].attr("cx")) + Math.PI/2;
	})
	.endAngle(function(d){
		return Math.atan2(d[1].attr("cy")-d[2].attr("cy"),
			d[1].attr("cx")-d[2].attr("cx")) + Math.PI/2;
	})
	.innerRadius(0)
	.outerRadius(30);
svg.append("path")
	.data([[d3.select('#red'),d3.select('#blue'),d3.select('#origin')]])
	.attr("d", arc)
	.attr("id", "arc")
	.attr("transform", "translate(200,200)")
	.style("fill", "yellow")
	.style("opacity", 0.6);

function dotproduct() {
	var oc = d3.select("#origin");
	return Math.round(
	 (d3.select("#red").attr("cx")-oc.attr("cx"))*(d3.select("#blue").attr("cx")-oc.attr("cx"))
	+(d3.select("#red").attr("cy")-oc.attr("cy"))*(d3.select("#blue").attr("cy")-oc.attr("cy"))
	);
};
function crossproduct() {
	var oc = d3.select("#origin");
	return Math.round(
	 (d3.select("#red").attr("cx")-oc.attr("cx"))*(d3.select("#blue").attr("cy")-oc.attr("cy"))
	-(d3.select("#red").attr("cy")-oc.attr("cy"))*(d3.select("#blue").attr("cx")-oc.attr("cx"))
	);
};

var dptext = svg.append("text")
	.attr("x", 50)
	.attr("y", 15)
	.attr("id", "dptext")
	.attr("class", "ptext")
	.text( dotproduct() );
svg.append("text")
	.attr("x", 50)
	.attr("y", 30)
	.attr("id", "cptext")
	.attr("class", "ptext")
	.text( crossproduct() );
	
var drag = d3.behavior.drag()
	.on('drag', function(d){
		var c = d3.select(this)
		c.attr("cx", d3.event.x).attr("cy", d3.event.y);
		if (c.attr("id") == "origin") {
			d3.selectAll("line").attr("x1", d3.event.x).attr("y1", d3.event.y);
			d3.select("#arc").attr("transform", "translate("+c.attr("cx")+","+c.attr("cy")+")");
		} else {
			d3.select("[name="+c.attr("id")+"]").attr("x2", d3.event.x).attr("y2", d3.event.y);
		}
		
		d3.select('#dptext').text(dotproduct());
		d3.select('#cptext').text(crossproduct());
		d3.select('#arc').attr("d", arc);
	});
d3.select('svg').selectAll('circle').call(drag);