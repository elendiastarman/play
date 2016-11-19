function OpponentDodger_setup(t){
	b={};
	b["c"]=t;
	b['o']=(t=="red")?"blue":"red";
	return b;
}

function OpponentDodger_getActions(g,b){
	a=[];
	o=b["c"];
	j={r:g[o+"_rot"],x:g[o+"_x"],y:g[o+"_y"]};
	o=b["o"];
	p={r:g[o+"_rot"],x:g[o+"_x"],y:g[o+"_y"]};
	l=Math.degrees(Math.atan2(p.y-j.y,p.x-j.x)),x=(j.r-l+360)%360;
	if(x > 90 && x < 270)a.push("turn right");
	else a.push("turn left");
	a.push("fire engine");
	return a;
}