function Arrow_setup(team) {
    var botVars = {};
    botVars['mpref'] = team + '_';
    botVars['epref'] = team == 'red' ? 'blue_' : 'red_';
    return botVars;
}

function Arrow_getActions(gameInfo, botVars) {
    var actions = [];
    var x = gameInfo[botVars['mpref'] + 'x'],
        y = gameInfo[botVars['mpref'] + 'y'],
        rot = gameInfo[botVars['mpref'] + 'rot']; // My position and rotation
    var ex = gameInfo[botVars['epref'] + 'x'],
        ey = gameInfo[botVars['epref'] + 'y']; // Enemy position
    var Dsunx = Math.abs(x - gameInfo.sun_x);
    var Dsuny = Math.abs(y - gameInfo.sun_y);
    if (Dsunx < 30 && Dsuny < 30) // If Arrow is too close from sun, hyperspace !
        return ['hyperspace'];
    var missiles = gameInfo.missiles;
    for (var i = 0; i < missiles.length; i++) {
        var dx = Math.abs(x - missiles[i].x);
        var dy = Math.abs(y - missiles[i].y);
        if (dx < 10 && dy < 10)
            return ['hyperspace'];
    }
    if (gameInfo[botVars['epref'] + 'alive']) {
        var angle = Math.degrees(Math.atan2(ey - y, ex - x)),
            nrot = (rot - angle + 360) % 360;
        if (nrot > 90 && nrot < 270)
            actions.push('turn left');
        else
            actions.push('turn right');
        if (Math.random() > 0.5) actions.push('fire missile');
    }
    if (Math.random() > 0.5) actions.push('fire engine');
    return actions;
}