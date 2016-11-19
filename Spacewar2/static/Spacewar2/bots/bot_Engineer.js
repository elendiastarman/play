function Engineer_setup(t){
    return{c:t,C:"red0blue".split(0)[+(t=="red")]};
}

function Engineer_getActions(gameInfo,botVars){
    var actions = [];

    function d(x1,y1,x2,y2){return Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2))}
    function hS(g){return d(g.sun_x,g.sun_y,g[botVars.c+"_x"],g[botVars.c+"_y"])<50}
    function enemyDist(g){return d(g[botVars.c+"_x"],g[botVars.c+"_y"],g[botVars.C+"_x"],g[botVars.C+"_y"]);}

    function hSm(g){
        // get closest missile
        var r = (g.missiles||[{x:10000,y:10000}]).reduce(function(p,c){return Math.min(d(c.x,c.y,g[botVars.c+"_x"],g[botVars.c+"_y"]),p)},Infinity);
        return r<18;
    }
    function dF(g){
        var a = Math.degrees(Math.atan2(g[botVars.C+"_y"]-g[botVars.c+"_y"],g[botVars.C+"_x"]-g[botVars.c+"_x"]));
        var tP = (g[botVars.c+"_rot"]+360-a)%360;
        return [a,tP];
    }
    function lOr(g){
        var tP = dF(g)[1];
        return 90<tP&&tP<270?"turn left":"turn right";
    }
    function thrust(g){
        return Math.abs(dF(g)-g[botVars.c+"_rot"]);
    }

    // are we too close to the sun or a missile?
    if(hS(gameInfo)||hSm(gameInfo))actions.push("hyperspace");

    // should we fire?
    if(enemyDist(gameInfo)<200)actions.push("fire missile");

    // direction function
    actions.push(lOr(gameInfo,botVars));

    if(Math.random()<.7)actions.push("fire engine");
    return actions;
}