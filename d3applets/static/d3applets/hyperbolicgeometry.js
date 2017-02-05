"use strict";

var R = 250;
var innerR = R-5;
var gw = 600;
var gh = 600;
var bgcolor = '#FFFFFF';
var fgcolor = '#000000';

var svg = d3.select('svg');
svg.attr('width', gw).attr('height', gh);

svg.select('#background')
  .attr('width', gw)
  .attr('height', gh)
  .style('fill', bgcolor);

svg.select('#field')
  .attr('transform', 'translate('+gw/2+', '+gh/2+')');

svg.select('#bgcircle1')
  .attr('r', R)
  .style('fill', fgcolor);
svg.select('#bgcircle2')
  .attr('r', innerR)
  .style('fill', bgcolor);

var vertices = [];
var boundaries = [];
var cam = {
  'id': 1,
  'x': 0, 'y': 0,
  'orient': 0,
  'turnRate': Math.PI/72,
  'snap': null,
  'yparity': 0,

  // virtual camera that ignores boundaries
  'vx': 0, 'vy': 0,
  'vorient': 0,
};

var N = 3;
var K = 7;

var renderLoop;
$(document).ready(function () {
  init(N, K);
  setRenderLoopInterval();
  draw();
  draw();
  $('#main').focus();
  $('#main').bind("keydown", handleInput);
  $('#main').bind("keyup", handleInput);
  // $('#gravityCheck').on('change', function(){ gravityStrength = this.checked*5000; });
  // $('#showIntersections').on('change', function(){
  //   showIntersections = !showIntersections;
  //   teams.forEach(function(ship){
  //     field.selectAll('.intP'+ship.color).remove();
  //     field.selectAll('.shipVerts'+ship.color).remove();
  //     field.selectAll('.missileHit'+ship.color).remove();
  //   });
  // });
  // $('#accelerated').on('change', function(){
  //   accelerated = !accelerated;
  //   setRenderLoopInterval();
  // });
  // $('#numGames').on('change', function(){
  //   numGames = $(this).val();
  // });
  // loadFromPermalink();
});

function create_point(x, y, links=[], r=255,g=255,b=255, show=0, to_delete=0) {
  var new_vertex = {
    'x': x, 'y': y,
    'links': links,
    'r': r, 'g': g, 'b': b,
    'show': show, 'to_delete': to_delete,
  };
  var tcoords = transform(x,y);
  new_vertex.u = tcoords[0];
  new_vertex.v = tcoords[1];
  if (vertices.length) {
    new_vertex.id = vertices[vertices.length - 1].id + 1;
  } else {
    new_vertex.id = 1;
  }

  vertices.push(new_vertex);
  return new_vertex
}

function translate(px, py, tx, ty) { // (tx,ty) goes to origin
  var pt = Math.sqrt(1 + px*px + py*py);
  var tt = Math.sqrt(1 + tx*tx + ty*ty);

  if (!tx && !ty) {
    return [1, px, py];
  }

  var x1 = tt,
      x2 = tx,
      x3 = ty;
  var a = x1,
      d = -x2,
      g = -x3,
      b = -x2,
      c = -x3;
  var f = (x1*x2*x3 - x2*x3)/(x2*x2 + x3*x3);
  var h = f;
  var e = (x1*x2*x2 + x3*x3)/(x2*x2 + x3*x3);
  var i = (x1*x3*x3 + x2*x2)/(x2*x2 + x3*x3);
  // matrix is done!

  return [
    a*pt + b*px + c*py,
    d*pt + e*px + f*py,
    g*pt + h*px + i*py,
  ];
}

function transform(x,y) {
  var t = Math.sqrt(1 + x*x + y*y);
  return [x/(1+t), y/(1+t)];
}

function inv_transform(u,v) {
  var denom = 1 - u*u - v*v;
  return [2*u/denom, 2*v/denom];
}

function offsetStep(px, py, d, theta) {
  var k = Math.cosh(d);

  if (!px && !py) {
    var r = Math.sqrt(k*k - 1);
    return [r*Math.cos(theta), r*Math.sin(theta)];
  }

  var a = 1 + Math.pow(px*Math.sin(theta), 2) + Math.pow(py*Math.cos(theta), 2) - 2*px*py*Math.cos(theta)*Math.sin(theta);
  var b = 2 * (1-k) * (px*Math.cos(theta) + py*Math.sin(theta));
  var c = 1 - k*k + 2 * (1-k) * (px*px + py*py);

  var det = b*b - 4*a*c;
  var rpos = (-b + Math.sqrt(det))/(2*a);
  var rneg = (-b - Math.sqrt(det))/(2*a);

  if (rpos < 0) {
    var temp = rpos;
    rpos = rneg;
    rneg = temp;
  }

  return [px + rpos*Math.cos(theta), py + rpos*Math.sin(theta)];
}

function intersection(x1, y1, x2, y2, u1, v1, u2, v2, strict=1) {
  if ( (x1==u1 && y1==v1 && x2==u2 && y2==v2) || (x1==u2 && y1==v2 && x2==u1 && y2==v1) ) {
    return;
  }

  var tXY1 = translate(x2, y2, x1, y1); // translate all points so that (x1, y1) == (0, 0)
  var tXY2 = translate(u1, v1, x1, y1);
  var tXY3 = translate(u2, v2, x1, y1);

  var ang = Math.atan2(tXY1[2], tXY1[1]); // calculate angle to (x2, y2)

  var s = tXY2[1]*Math.cos(-ang) - tXY2[2]*Math.sin(-ang), // rotate (u1, v1) by -ang
      t = tXY2[1]*Math.sin(-ang) + tXY2[2]*Math.cos(-ang),
      u = tXY3[1]*Math.cos(-ang) - tXY3[2]*Math.sin(-ang), // rotate (u2, v2) by -ang
      v = tXY3[1]*Math.sin(-ang) + tXY3[2]*Math.cos(-ang);

  var tst = Math.sqrt(1 + s*s + t*t);
  var tuv = Math.sqrt(1 + u*u + v*v);

  var p = s*v - u*t;
  var q = t*tuv - v*tst;

  if (q*q - p*p <= 0) {
    return;
  }

  var k = -p*Math.sign(q) / Math.sqrt(q*q - p*p);

  // intersection point is at (k, 0)

  var kXY = [k*Math.cos(ang), k*Math.sin(ang)]; // rotate solution by ang
  var XY = translate(kXY[0], kXY[1], -x1, -y1); // translate (0, 0) to (x1, y1)

  if (strict) {
    if (k >= 0 && k <= Math.sqrt(Math.pow(tXY1[1], 2) + Math.pow(tXY1[2], 2)) && t*v <= 0) {
      return XY;
    }
  } else {
    return XY;
  }

  return;
}

function flip_over_line(px, py, x1, y1, x2, y2) {
  var tXY1 = translate(x2, y2, x1, y1);
  var tXY2 = translate(px, py, x1, y1);

  var angx = Math.atan2(tXY1[2], tXY1[1]);
  var angp = Math.atan2(tXY2[2], tXY2[1]);
  var angDiff = 2*(angx - angp);

  var nx = tXY2[1]*Math.cos(angDiff) - tXY2[2]*Math.sin(angDiff);
  var ny = tXY2[1]*Math.sin(angDiff) + tXY2[2]*Math.cos(angDiff);

  return translate(nx, ny, -x1, -y1);
}

function D(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2));
}

function hyperD(x1, y1, x2, y2) {
  return Math.acosh( Math.sqrt( (1 + x1*x1 + y1*y1)*(1 + x2*x2 + y2*y2) ) - x1*x2 - y1*y2 );
}

function hyperAng(x1, y1, x2, y2) {
  var tXY = translate(x2, y2, x1, y1);
  return Math.atan2(tXY[2], tXY[1]);
}

function init(n, k) {
  var theta = 2*Math.PI/n;
  var phi = 2*Math.PI/k;

  var numer = (1+Math.cos(phi))*Math.cos(theta/2);
  var denom = Math.sin(phi)*Math.sin(theta/2);

  var dis = Math.sqrt(Math.pow(numer/denom, 2) - 1);
  var rad = dis*( Math.sqrt(1+dis*dis)*(1 - Math.cos(phi))*Math.cos(theta/2) + Math.sin(phi)*Math.sin(theta/2) );

  var distance_limit = Math.pow(100, 2);
  var limit = 100000;
  var tolerance = 0.1;

  var queue = [];
  var ao = []; // angle offsets
  var center, p2, np;

  var q = 1;
  queue.push(create_point(0, 0));
  queue.push(create_point(0, -rad, [queue[0]]));
  ao.push(-Math.PI/2);
  ao.push(Math.PI/2);

  cam.snap = queue[0];
  cam.x = cam.y = 0.01;

  var i = -1;

  while (i < q) {
    i += 1;

    center = queue[i];
    var angoff = ao[i];

    for (var j=1; j<n; j++) {
      var ang = (j*theta + angoff) % (2*Math.PI);
      var x2 = rad*Math.cos(ang);
      var y2 = rad*Math.sin(ang);

      var nXY = translate(x2,y2, -center.x, -center.y);

      var coincide = 0;
      for (var k=0; k<i; k++) {
        var p2 = queue[k];

        if (Math.abs(p2.x - nXY[1]) < tolerance && Math.abs(p2.y - nXY[2]) < tolerance) {
          var linked = 0
          p2.links.forEach(function(v) {
            if (v.id == center.id) { linked = 1; }
          });

          if (!linked) {
            center.links.push(p2);
          }
          coincide = 1;
          break;
        }
      }

      if (!coincide && q < limit && (Math.pow(nXY[1], 2) + Math.pow(nXY[2], 2)) < distance_limit) {
        np = create_point(nXY[1], nXY[2], [center]);

        var offXY = translate(center.x, center.y, np.x, np.y);

        q += 1;
        queue.push(np);
        ao.push(Math.atan2(offXY[2], offXY[1]));
      }

    }
  }

  var bounds = [];
  var off = 0.5 * (1 - (n%2));

  for (var i=0; i<n; i++) {
    boundaries.push({
      'id': i,
      'x1': dis * Math.cos(Math.PI/2 + (i+off)*theta),
      'y1': dis * Math.sin(Math.PI/2 + (i+off)*theta),
      'x2': dis * Math.cos(Math.PI/2 + (i+1+off)*theta),
      'y2': dis * Math.sin(Math.PI/2 + (i+1+off)*theta),
    });
  }
}

function move() {
  var active = 0;

  var scroll_speed = 0.10;
  var k = Math.cosh(scroll_speed);

  var mult = 1 - 2*cam.yparity;
  var tx = scroll_speed * ((keystates[65] || keystates[37] || 0) - (keystates[68] || keystates[39] || 0)); // right - left
  var ty = scroll_speed * ((keystates[83] || keystates[40] || 0) - (keystates[87] || keystates[38] || 0)) * mult; // down - up

  if (keystates[81]) {
    cam.orient = (cam.orient + cam.turnRate*mult + 2*Math.PI) % (2*Math.PI);
    cam.vorient = (cam.vorient + cam.turnRate + 2*Math.PI) % (2*Math.PI);
    active = 1;
  } else if (keystates[69]) {
    cam.orient = (cam.orient - cam.turnRate*mult + 2*Math.PI) % (2*Math.PI);
    cam.vorient = (cam.vorient - cam.turnRate + 2*Math.PI) % (2*Math.PI);
    active = 1;
  }

  if (tx || ty) {
    var d = Math.sqrt(tx*tx + ty*ty);
    var ang = Math.atan2(ty, tx);

    var voffStep = offsetStep(cam.vx, cam.vy, d, ang+cam.vorient);
    cam.vx = voffStep[0];
    cam.vy = voffStep[1];

    var offStep = offsetStep(cam.x, cam.y, d, ang+cam.orient);
    var nx = offStep[0];
    var ny = offStep[1];

    var done = 0;
    var crossed = null,
        pick = null;

    while (!done) {
      done = 1;
      var max = 10000;
      pick = null;

      boundaries.forEach(function(b) {
        if (!crossed || b.id != crossed.id) {
          var intXY = intersection(b.x1, b.y1, b.x2, b.y2, cam.x, cam.y, nx, ny);

          if (intXY) { // there was an intersection
            done = 0;
            d = hyperD(intXY[1], intXY[2], cam.x, cam.y);

            if (!pick || d < max) {
              max = d;
              pick = b;
            }
          }
        }
      });

      if (!done) {
        var intXY = intersection(pick.x1, pick.y1, pick.x2, pick.y2, cam.x, cam.y, nx, ny);

        cam.x = intXY[1];
        cam.y = intXY[2];

        var flipXY = flip_over_line(nx, ny, intXY[1], intXY[2], pick.x2, pick.y2);

        nx = flipXY[1];
        ny = flipXY[2];

        var ang3 = hyperAng(cam.x, cam.y, pick.x1, pick.y1);

        cam.orient = (2*ang3 - cam.orient + 4*Math.PI) % (2*Math.PI);
        cam.yparity = !cam.yparity;

        crossed = pick;
      }
    }

    cam.x = nx;
    cam.y = ny;

    active = 1;
  }

  return active;
}

function draw() {
  // vertices
  var points = [];

  vertices.forEach(function(v) {
    var tXY = translate(v.x, v.y, cam.x, cam.y);
    var mult = 1 - 2*cam.yparity;

    var tUV = transform(tXY[1], tXY[2]);
    var tu = -tUV[0];
    var tv = mult * tUV[1];

    v.tu = tu*Math.cos(cam.orient * mult) - tv*Math.sin(cam.orient * mult);
    v.tv = tu*Math.sin(cam.orient * mult) + tv*Math.cos(cam.orient * mult);

    if (R*Math.sqrt(tu*tu + tv*tv) < innerR) {
      points.push(v);
    }
  });

  var verts = svg.select('#vertices').selectAll('circle').data(points);
  verts.enter().append('circle')
    .attr('r', 2)
    .style('fill', fgcolor);
  verts.exit().remove();
  verts.attr('cx', function(v){ return R * v.tu; })
    .attr('cy', function(v){ return R * v.tv; });

  // edges
  var edges = [];

  vertices.forEach(function(p1) {
    p1.links.forEach(function(p2) {
      if (R*Math.sqrt(p1.tu*p1.tu + p1.tv*p1.tv) >= innerR && R*Math.sqrt(p2.tu*p2.tu + p2.tv*p2.tv) >= innerR) {
        return;
      }

      var u1 = p1.tu;
      var v1 = p1.tv;
      var u2 = p2.tu;
      var v2 = p2.tv;

      var denom = u1*v2 - u2*v1;

      if (Math.abs(denom) < 0.001) {
        var line = "M "+R*u1+" "+R*v1;
        line += "L "+R*u2+" "+R*v2;
        edges.push(line);
      } else {
        var f = (1 + u1*u1 + v1*v1)/2,
            g = (1 + u2*u2 + v2*v2)/2,
            h = (v2*f - v1*g)/denom,
            k;

        if (Math.abs(v2) > 0.0001) {
          k = (g - u2*h)/v2;
        } else if (Math.abs(v1) > 0.0001) {
          k = (f - u1*h)/v1;
        }

        var rad = Math.sqrt(h*h + k*k - 1);

        if (denom < 0) {
          var tempu = u1;
          u1 = u2;
          u2 = tempu;
          var tempv = v1;
          v1 = v2;
          v2 = tempv;
        }

        var arc = "M "+R*u1+" "+R*v1;
        arc += " A "+R*rad+" "+R*rad+" 0, 0, 0, ";
        arc += R*u2+" "+R*v2;
        edges.push(arc);
      }
    });
  });

  var lines = svg.select('#edges').selectAll('path').data(edges);
  lines.enter().append('path')
    .style('stroke', fgcolor)
    .style('fill', "none");
  lines.exit().remove();
  lines.attr('d', function(d){ return d; });
}

var keyd = false;
var moved_keys = [87, 65, 83, 68, 81, 69, 38, 37, 40, 39, 32];
function update() {
  keyd = false;
  moved_keys.forEach(function(k) {
    keyd = keyd || keystates[k];
  });

  if (keyd) {
    keyd = false;
    if (move()) {
      draw();
    }
  }
}

function setRenderLoopInterval() {
  clearInterval(renderLoop);
  renderLoop = setInterval(update, 30);
}

var keystates = {};
function handleInput(event) {
  if (event.target.id !== 'main') { return; }
  
  if (event.which == 32 && event.type == 'keyup'){ //SPACEBAR key, resets field
    cam.x = cam.y = 0.01;
    cam.orient = 0;
    cam.vx = cam.vy = 0.01;
    cam.vorient = 0;
    draw();
  }
  
  if (event.which == 191 || event.which == 32 || event.which == 38 || event.which == 40){ event.preventDefault(); };
  
  if (event.type == 'keydown'){ keystates[event.which] = true;  }
  if (event.type == 'keyup')  { keystates[event.which] = false; }
}