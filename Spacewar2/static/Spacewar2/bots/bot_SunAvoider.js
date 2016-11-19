function SunAvoider_setup(team) {
	var botVars = {};
	
	botVars["color"] = team;
	
	return botVars;
}

function SunAvoider_getActions(gameInfo, botVars) {
	var actions = [];
	
	if (gameInfo[botVars["color"]+"_alive"]) {
		var shipx = gameInfo[botVars["color"]+"_x"];
		var shipy = gameInfo[botVars["color"]+"_y"];
		var sunx = gameInfo["sun_x"];
		var suny = gameInfo["sun_y"];
		var dx = shipx - sunx;
		var dy = shipy - suny;
		var dis = Math.sqrt(dx*dx+dy*dy);
		var fireEngineChance = (dis-100)/(gameInfo["fieldHeight"]/2);
		
		if (Math.random() > fireEngineChance){ actions.push("fire engine") }
		
		var ang1 = gameInfo[botVars["color"]+"_rot"]+90;
		var ang2 = Math.degrees( Math.atan2(dy, dx) );
		var angDiff = ang2 - ang1;
		if (angDiff < -180) { //http://stackoverflow.com/a/7869457/1473772
			angDiff += 360;
		} else if (angDiff > 180) {
			angDiff -= 360;
		}
		
		if (angDiff >= 0) {
			actions.push("turn left");
		} else if (angDiff < 0) {
			actions.push("turn right");
		}
	}
	
	return actions;
}