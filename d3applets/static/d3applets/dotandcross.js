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

d3.select('svg').append("path")
	.data([[d3.select('#red'),d3.select('#blue'),d3.select('#origin')]])
	.attr("d", arc)
	.attr("id", "arc")
	.attr("transform", "translate(200,200)")
	.style("fill", "yellow")
	.style("opacity", 0.6);

var drag = d3.behavior.drag()
	.on('drag', function(d){
		var c = d3.select(this)
		c.attr("cx", d3.event.x).attr("cy", d3.event.y);
		if (c.attr("id") == "origin") {
			d3.selectAll("line").attr("x1", d3.event.x).attr("y1", d3.event.y);
		} else {
			d3.select("[name="+c.attr("id")+"]").attr("x2", d3.event.x).attr("y2", d3.event.y);
		}
		
		var rc = d3.select("#red");
		var bc = d3.select("#blue");
		var oc = d3.select("#origin");
		var dotproduct = (rc.attr("cx")-oc.attr("cx"))*(bc.attr("cx")-oc.attr("cx"))
						+(rc.attr("cy")-oc.attr("cy"))*(bc.attr("cy")-oc.attr("cy"));
		d3.select('#dot').text(Math.round(dotproduct));
		var crossproduct = (rc.attr("cx")-oc.attr("cx"))*(bc.attr("cy")-oc.attr("cy"))
						  -(rc.attr("cy")-oc.attr("cy"))*(bc.attr("cx")-oc.attr("cx"));
		d3.select('#cross').text(Math.round(crossproduct));
		d3.select('#arc').attr("d", arc);
	});
d3.select('svg').selectAll('circle').call(drag);