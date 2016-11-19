"use strict";

var renderLoop;
var accelerated = 0;
(function($){
	$(document).ready(function (){
		console.log("main.js");
		init();
		setRenderLoopInterval();
		$('#playfield').focus();
		$('#playfield').bind("keydown",handleInput);
		$('#playfield').bind("keyup",handleInput);
		$('#gravityCheck').on('change', function(){ gravityStrength = this.checked*5000; });
		$('#showIntersections').on('change', function(){
			showIntersections = !showIntersections;
			teams.forEach(function(ship){
				field.selectAll('.intP'+ship.color).remove();
				field.selectAll('.shipVerts'+ship.color).remove();
				field.selectAll('.missileHit'+ship.color).remove();
			});
		});
		$('#accelerated').on('change', function(){
			accelerated = !accelerated;
			setRenderLoopInterval();
		});
		$('#numGames').on('change', function(){
			numGames = $(this).val();
		});
		loadFromPermalink();
	});
})(jQuery);

function setRenderLoopInterval() {
	clearInterval(renderLoop);
	if (!accelerated) {
		renderLoop = setInterval(update, 30);
	} else {
		renderLoop = setInterval(updateFast, 0);
	}
}

var players = [];

var redPlayer = "human";
var bluePlayer = "userbot";
var redVars = {};
var blueVars = {};
var uniqueRedActions;
var uniqueBlueActions;
var redWins = 0;
var blueWins = 0;
var ties = 0;
var winRecord = {};

var theGame;
var numGames = 20;
var inProgress = 0;
var isDone = 0;
var multiRun = 0;

var redIdx = 0;
var redIdxMin;
var redIdxMax;
var blueIdx = 1;
var blueIdxMin;
var blueIdxMax;

var vs = 20;
var hs = 25;
var charw = 8;
var charh = 12;
var maxlen = 20;
var q = charw*maxlen;

function horizLineCoords(k) {
	var y = k*vs;
	var coords = "0,"+(q+y)+" "+(q+players.length*hs)+","+(q+y);
	return coords;
}
function vertLineCoords(k) {
	var x = k*hs;
	var coords = ""+(1.5*q+x)+",0 "+(q+x)+","+(q)+" "+(q+x)+","+(q+players.length*vs);
	return coords;
}
function redSelectCoords(k) {
	var y = k*vs;
	return ""+0+","+(q+y)+" "+(q)+","+(q+y)+" "+(q)+","+(q+y+vs)+" "+0+","+(q+y+vs);
}
function blueSelectCoords(k) {
	var x = k*hs;
	return ""+(1.5*q+x)+","+0+" "+(1.5*q+x+hs)+","+0+" "+(q+x+hs)+","+(q)+" "+(q+x)+","+(q);
}
function bothSelectCoords(k,k2) {
	var x = k2*hs;
	var y = k*vs;
	return ""+(q+x)+","+(q+y)+" "+(q+x+hs)+","+(q+y)+" "+(q+x+hs)+","+(q+y+vs)+" "+(q+x)+","+(q+y+vs);
}

function playerSet(a,b) {
	return function() {
		if (a+1){ redPlayer = players[a]; }
		if (b+1){ bluePlayer = players[b]; }
		updateHighlights();
		
		redVars = window[redPlayer+"_setup"]("red");
		blueVars = window[bluePlayer+"_setup"]("blue");
		redIdx = players.indexOf(redPlayer);
		blueIdx = players.indexOf(bluePlayer);
		
		redWins = 0;
		blueWins = 0;
		ties = 0;
		updateWinText();
		
		setRenderLoopInterval();
		setupGame(1);
	}
}

function updateHighlights() {
	console.log("Players: "+redPlayer+", "+bluePlayer)
	d3.select('#selectGridBoxes').selectAll('polygon').attr("fill","white");
	d3.select('#selectGridTexts').selectAll('.playerName').attr("fill","black");
	
	d3.select('#redName-'+redPlayer).attr("fill","white");
	d3.select('#blueName-'+bluePlayer).attr("fill","white");
	d3.select('#redBox-'+redPlayer).attr("fill","red");
	d3.select('#blueBox-'+bluePlayer).attr("fill","blue");
	d3.select('#bothBox-'+redPlayer+'-'+bluePlayer).attr("fill","yellow");
}

function init() {
	theGame = initGame();
	
	setUserBotCode();
	
	redVars = window[redPlayer+"_setup"]("red");
	blueVars = window[bluePlayer+"_setup"]("blue");
	
	var scriptNames = eval(jQuery("#script-names").text());
	for (var i=0; i<scriptNames.length; i++) {
		var sn = scriptNames[i].substring(15); //takes out "Spacewar2/bots/"
		if (sn.substr(0,4) === "bot_") {
			players.push(sn.substring(4,sn.length-3));
			if (sn.length-6 > maxlen) {
				maxlen = sn.length-6;
				q = charw * maxlen;
			}
		}
	}
	players.sort();
	players = ["human","userbot"].concat(players);
	
	d3.select('#playfield').append('br');
	var selectGrid = d3.select('#playfield').append('svg')
		.attr("id","selectGrid")
		.attr("width",q+(players.length+4)*hs)
		.attr("height",q+(players.length+1)*vs);
	var selectGridBoxes = selectGrid.append("g")
		.attr("id","selectGridBoxes")
		.attr("fill","white");
	var selectGridLines = selectGrid.append("g")
		.attr("id","selectGridLines")
		.attr("fill","none")
		.attr("stroke","black")
		.attr("stroke-width","2px");
	var selectGridTexts = selectGrid.append("g")
		.attr("id","selectGridTexts")
		.attr("fill","black")
		.attr("font-family","sans-serif")
		.attr("font-size","15px");
	
	selectGridLines.append("polyline")
		.attr("points", horizLineCoords(0));
	selectGridLines.append("polyline")
		.attr("points", vertLineCoords(0));
		
	for (var j=0; j<players.length; j++) {
		
		selectGridLines.append("polyline")
			.attr("points", horizLineCoords(j+1));
		selectGridLines.append("polyline")
			.attr("points", vertLineCoords(j+1));
		
		selectGridTexts.append("text")
			.attr("text-anchor","end")
			.attr("x",charw*maxlen - charw/2)
			.attr("y",charw*maxlen + (j+1)*vs - charh/2+1)
			.attr("id","redName-"+players[j])
			.attr("class","playerName")
			.on("click", playerSet(j,-1))
			.text(players[j]);
		selectGridTexts.append("text")
			.attr("text-anchor","start")
			.attr("x",charw*maxlen + (j+1)*hs - hs/2)
			.attr("y",charw*maxlen)
			.attr("id","blueName-"+players[j])
			.attr("class","playerName")
			.attr("transform","rotate(-63.435 "+(charw*maxlen+(j+1)*hs-hs/2)+","+(charw*maxlen-vs/2)+")")
			.on("click", playerSet(-1,j))
			.text(players[j]);

		selectGridBoxes.append("polygon")
			.attr("points", redSelectCoords(j))
			// .attr("fill","red")
			.attr("id","redBox-"+players[j])
			.on("click", playerSet(j,-1));
		selectGridBoxes.append("polygon")
			.attr("points", blueSelectCoords(j))
			// .attr("fill","blue")
			.attr("id","blueBox-"+players[j])
			.on("click", playerSet(-1,j));
		
		for (var j2=0; j2<players.length; j2++) {
			selectGridBoxes.append("polygon")
				.attr("points", bothSelectCoords(j,j2))
				// .attr("fill","yellow")
				.attr("id","bothBox-"+players[j]+"-"+players[j2])
				.on("click", playerSet(j,j2));
		}
	}
	
	selectGridTexts.append("text")
		.attr("x",0)
		.attr("y",20)
		.attr("fill","red")
		.attr("font-size","20px")
		.attr("id","redWins")
		.text("Red wins: 0");
	selectGridTexts.append("text")
		.attr("x",0)
		.attr("y",40)
		.attr("fill","blue")
		.attr("font-size","20px")
		.attr("id","blueWins")
		.text("Blue wins: 0");
	selectGridTexts.append("text")
		.attr("x",0)
		.attr("y",60)
		.attr("font-size","20px")
		.attr("id","ties")
		.text("Ties: 0");
	
	updateHighlights();
}

function update() {
	if (gameOver) { return; }
	
	moveShips();
	
	jQuery('#action-table').find("td").each(function(i,elem){ jQuery(elem).removeClass("redAction blueAction") });
	
	uniqueRedActions.forEach(function(action){
		jQuery("#red-"+action.replace(" ","-")).addClass("redAction");
	});
	uniqueBlueActions.forEach(function(action){
		jQuery("#blue-"+action.replace(" ","-")).addClass("blueAction");
	});
	
	isDone = updateGame();
	
	if (isDone) {
		// do whatever is done upon finishing a game
		updateWinText();
		isDone = 0;
	}
}

function updateFast() {
	if (inProgress) { return; }
	
	inProgress = 1;
	while (!updateGame()) { moveShips(); }
	inProgress = 0;
	
	updateWinText();
	isDone = 0;
	
	if (redWins + blueWins >= numGames) {
		if (!winRecord[redIdx+','+blueIdx]) {
			winRecord[redIdx+','+blueIdx] = {'rbi':redIdx+','+blueIdx, 'red':{'c':"red", 'i':redIdx, 'w':0}, 'blue':{'c':"blue", 'i':blueIdx, 'w':0}};
		}
		winRecord[redIdx+','+blueIdx].red.w += redWins;
		winRecord[redIdx+','+blueIdx].blue.w += blueWins;
		updateWinRecordTexts();
		
		if (multiRun) {
			//continue to the next pairing
			blueIdx += 1;
			if (blueIdx > blueIdxMax) {
				redIdx += 1;
				blueIdx = blueIdxMin;
			}
			if (redIdx > redIdxMax) {
				multiRun = false;
				clearInterval(renderLoop);
				renderLoop = false;
				return;
			}
			
			playerSet(redIdx,blueIdx)();
		} else {
			clearInterval(renderLoop);
			renderLoop = false;
		}
	} else {
		setupGame(1);
	}
}

function updateWinText() {
	if (red.score > blue.score) {
		redWins += 1;
		d3.select("#redWins").text("Red wins: "+redWins);
	} else if (red.score < blue.score) {
		blueWins += 1;
		d3.select("#blueWins").text("Blue wins: "+blueWins);
	} else {
		ties += 1;
		d3.select("#ties").text("Ties: "+ties);
	}
}

function updateWinRecordTexts() {
	var WRlist = [];
	jQuery.each(winRecord, function(x,y){ WRlist.push(y); });
	
	["red","blue"].forEach(function(color) {
		var data = d3.select("#selectGridTexts").selectAll("."+color+"WinRecord").data(WRlist, function(d){ return d.rbi; });
		data.enter().append("text")
			.attr("class", color+"WinRecord")
			.attr("fill", color)
			.attr("x", function(d){ return q + d["blue"].i*hs + (color === "red" ? 2 : hs-2); })
			.attr("y", function(d){ return q + d["red"].i*vs + (color === "red" ? 1 : vs-1); })
			.attr("text-anchor", function(){ return (color === "red" ? "start" : "end"); })
			.attr("alignment-baseline", function(){ return (color === "red" ? "before-edge" : "after-edge"); })
			.attr("font-size", "10px");
		data.text(function(d,i){ return d[color].w; });
		data.exit().remove();
	});
}

function moveShips() {
	uniqueRedActions = [""];
	var redActions = window[redPlayer+"_getActions"](theGame,redVars);
	if (redActions.indexOf("hyperspace") > -1) {
		uniqueRedActions.push("hyperspace");
	} else {
		for (var i=0; i<redActions.length; i++) {
			if (redActions.indexOf(redActions[i]) == i) { uniqueRedActions.push(redActions[i]) }
		}
	}
	teamMove("red",uniqueRedActions);
	
	uniqueBlueActions = [""];
	var blueActions = window[bluePlayer+"_getActions"](theGame,blueVars);
	if (blueActions.indexOf("hyperspace") > -1) {
		uniqueBlueActions.push("hyperspace");
	} else {
		for (var i=0; i<blueActions.length; i++) {
			if (blueActions.indexOf(blueActions[i]) == i) { uniqueBlueActions.push(blueActions[i]) }
		}
	}
	teamMove("blue",uniqueBlueActions);
}

function runAll(kind) {
	if (kind === "all") {
		redIdxMin = 2;
		redIdxMax = players.length-1;
		blueIdxMin = 2;
		blueIdxMax = players.length-1;
	} else if (kind === "red") {
		if (redPlayer === "human") { return; }
		
		redIdxMin = players.indexOf(redPlayer);
		redIdxMax = redIdxMin;
		blueIdxMin = 2;
		blueIdxMax = players.length-1;
	} else if (kind === "blue") {
		if (bluePlayer === "human") { return; }
		
		redIdxMin = 2;
		redIdxMax = players.length-1;
		blueIdxMin = players.indexOf(bluePlayer);
		blueIdxMax = blueIdxMin;
	}
	
	console.log(redIdx,redIdxMin,redIdxMax);
	console.log(blueIdx,blueIdxMin,blueIdxMax);
	multiRun = true;
	redIdx = redIdxMin;
	blueIdx = blueIdxMin;
	playerSet(redIdx,blueIdx)();
}

var keystates = {};
function handleInput(event) {
	if (event.target.id !== 'playfield') { return; }
	
	// console.log(event.which);
	if (event.which == 27){ //ESC key, stops animation
		clearInterval(renderLoop);
		renderLoop = false;
		return;
	} else if (event.which == 13){ //ENTER key, resumes animation
		event.preventDefault();
		setRenderLoopInterval();
		return;
	} else if (event.which == 32 && event.type == 'keyup'){ //SPACEBAR key, resets field
		setupGame(0);
	} else if (event.which == 83 && event.type == 'keyup'){ //S key, restarts game
		setupGame(1);
	}
	
	if (event.which == 191 || event.which == 32){ event.preventDefault(); };
	
	if (event.type == 'keydown'){ keystates[event.which] = true;  }
	if (event.type == 'keyup')  {
		keystates[event.which] = false;
		
		if (event.which == 66 && redPlayer === "human") {
			window["red"].missileReady = true;
		} else if (event.which == 191 && bluePlayer === "human") {
			window["blue"].missileReady = true;
		}
	}
}


function human_setup(team) {
	var keysOfInterest = {"red":[90,88,67,86,66], "blue":[78,77,188,190,191]};
	var choices = ["turn left","turn right","hyperspace","fire engine","fire missile"];
	return {'keys':keysOfInterest[team], 'choices':choices};
}

function human_getActions(gameInfo,botVars) {
	var actions = [];
	
	for (var i=0; i<5; i++) {
		var key = botVars.keys[i];
		if (keystates[key]) { actions.push(botVars.choices[i]) }
	}
	
	return actions;
}


function setUserBotCode() {
	window["userbot_setup"] = new Function("team", "var botVars = {};\n"+jQuery("#userbot-setup").val()+"\n\nreturn botVars;");
	window["userbot_getActions"] = new Function("gameInfo", "botVars", "var actions = [];\n"+jQuery("#userbot-getactions").val()+"\nreturn actions;");
}


//permalink stuff
function loadFromPermalink(){
	if(location.hash){
		location.hash.slice(1).split("&").map(function(e){
			e=e.split("="),
			"setup"==e[0]&&(document.getElementById("userbot-setup").value=dec(e[1])),
			"action"==e[0]&&(document.getElementById("userbot-getactions").value=dec(e[1]))
		})
	}
}

function savePermalink(){
	var e=document.getElementById("userbot-setup").value;
	var t=document.getElementById("userbot-getactions").value;
	location.hash="#"+[e?"setup="+enc(e):"",t?"action="+enc(t):""].filter(function(e){return e}).join("&");
}

function enc(e){
	return btoa(unescape(encodeURIComponent(e))).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
}

function dec(e){
	return decodeURIComponent(escape(atob(unescape(e).replace(/-/g,"+").replace(/_/g,"/"))));
}