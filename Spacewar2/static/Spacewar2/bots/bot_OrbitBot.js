function OrbitBot_setup(team) {
  var botVars = {};

  botVars.color = team;
  return botVars;
}


function OrbitBot_getActions(gameInfo, botVars) {
  var actions = [];

  function getVar(name) {
    return gameInfo[botVars.color + "_" + name];
  }

  function getEnemyVar(name) {
    var eColor;
    if (botVars.color == 'blue') {
        eColor = 'red';
    } else {
        eColor = 'blue';
    }
    return gameInfo[eColor + "_" + name];
  }

  function distance(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
  }

  function toroidDistance(x1, y1, x2, y2) {
    dx = Math.abs(x1 - x2);
        while (dx > gameInfo.fieldWidth) {
        dx -= gameInfo.fieldWidth;
    }
    dx = Math.min(dx, gameInfo.fieldWidth - dx);
    dy = Math.abs(y1 - y2);
        while (dx > gameInfo.fieldHeight) {
        dx -= gameInfo.fieldHeight;
    }
    dy = Math.min(dy, gameInfo.fieldHeight - dy);
    return Math.sqrt(dx*dx+dy*dy);
  }

  function angleDistance(theta1, theta2) {
    var d = theta1 - theta2;
    while (d < 0 || d > Math.PI) {
      if (d < 0) {
        d += Math.PI * 2;
      }
      if (d > Math.PI * 2) {
        d -= Math.PI * 2;
      } else if (d > Math.PI) {
        d = Math.PI * 2 - d;
      }
    }
    return d;
  }

  function toRad(degrees) {
    return degrees / 180 * Math.PI;
  }

  function cap(x, y, limit) {
    var r = x*x+y*y;
    if (r < limit * limit) {
        r = Math.sqrt(r);
        x = x * r / limit;
      y = y * r / limit;
    }
    return [x,y];
  }

  var shape = getVar('shape');

  if (shape != 'nose only') {
    var broken = shape != 'full ship';
    var sunX = gameInfo.sun_x,
      sunY = gameInfo.sun_y,
      sunG = gameInfo.gravityStrength;

    function desirability(x, y, vx, vy) {     //Borrowed from a useless bot.
      var lowest = distance(x, y, sunX, sunY) - 5;
      var missiles = gameInfo.missiles;
      for (var i = 0; i < missiles.length; i++) {
        var mx = missiles[i].x + missiles[i].xv / 2;
        var my = missiles[i].y + missiles[i].yv / 2;
        lowest = Math.min(lowest, toroidDistance(x, y, mx, my) - distance(0, 0, missiles[i].xv, missiles[i].yv));
      }
      return lowest - 16;
    }

    var x = getVar("x"),
      y = getVar("y"),
      vx = getVar("xv"),
      vy = getVar("yv");

    function desirabilityByAcceleration(ax, ay) {//Borrowed from a useless bot.
        var x1 = x,
            y1 = y,
          vx1 = vx,
          vy1 = vy;
      var speed = distance(0,0,vx1,vy1);
      var limit = Math.max(gameInfo.speedLimit, speed);

      vx1 += ax;
      vy1 += ay;
      var temp = cap(vx1, vy1, limit);
      vx1 = temp[0];
      vy1 = temp[1];


      var dx = x1 - sunX;
      var dy = y1 - sunY;
      var dis = Math.sqrt(dx*dx+dy*dy);
      if (dis > 5){
        var force = sunG / (dis * dis);
      } else {
        var force = sunG /5;
      }
      vx1 -= force*dx/dis;
      vy1 -= force*dy/dis;

      var temp = cap(vx1, vy1, 40);
      vx1 = temp[0];
      vy1 = temp[1];

      x1 += vx1;
      y1 += vy1;

      return desirability(x1, y1, vx1, vy1);
    }

    var r = distance(sunX, sunY, x, y);
    var theta = Math.atan((y - sunY) / (x - sunX));

    var sunA = sunG/r/r,
            sunAx = -Math.cos(theta) * sunA,
        sunAy = -Math.sin(theta) * sunA;

    var dv = Math.sqrt(sunG / r);
    var dvx = -dv * Math.sin(theta);
    var dvy = dv * Math.cos(theta);
    if (distance(-dvx, -dvy, vx, vy) < distance(dvx, dvy, vx, vy)) {
      dvx = -dvx;
      dvy = -dvy;
    }

    var dax = dvx - vx;
    var day = dvy - vy;

    var dAngle = Math.atan(day / dax);
    if (dax < 0) {
        dAngle += Math.PI;
    }
    var cAngle = toRad(getVar('rot') - 90);
    var dLeft = angleDistance(cAngle - toRad(broken ? 2.5 : 5), dAngle);
    var dRight = angleDistance(cAngle + toRad(broken ? 2.5 : 5), dAngle);
    var dNeither = angleDistance(cAngle, dAngle);
    if (dLeft < dRight && dLeft < dNeither) {
      actions.push('turn left');
    } else if (dRight < dLeft && dRight < dNeither) {
      actions.push('turn right');
    }

    var cax = Math.cos(cAngle) * (broken ? .15 : .3);
    var cay = Math.sin(cAngle) * (broken ? .15 : .3);

    var ax = 0;
    var ay = 0;

    if (distance(cax, cay, dax, day) < distance(0, 0, dax, day)) {
      actions.push('fire engine');
      ax = cax;
      ay = cay;
    }

    if (desirabilityByAcceleration(ax, ay) <= 16) {
        actions.push('hyperspace');
    }

  }

  return actions;
}