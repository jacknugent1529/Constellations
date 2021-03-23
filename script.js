
class Viewer {
  constructor(canvas, constellations, dir_azi = 0, dir_pol = 0, fov = Math.PI/6,
              scroll_speed = 1) {
    this.c = canvas;
    this.constellations = constellations;

    this.dir_azi = dir_azi;
    this.dir_pol = dir_pol;
    this.fov = fov;
    this.ctx = c.getContext("2d");
    this.scroll_speed = scroll_speed;

    this.aspect = c.width/c.height;
    this.distance_to_plane = 1/Math.tan(this.fov);
    this.fov_azi = Math.atan(this.aspect/this.distance_to_plane);

    this.resize();
  }
  
  update() {
    this.ctx.clearRect(0,0, canvas.width, canvas.height);
    this.draw()
  }

  zoom(zoom_in = true) {
    if (zoom_in) {
      this.fov /= 1.1
    } else {
      this.fov *= 1.1;
    }
    this.distance_to_plane = 1/Math.tan(this.fov);
    this.fov_azi = Math.atan(this.aspect/this.distance_to_plane);

    this.update();
  }


  draw() {
    this.constellations.forEach(c => c.draw(this));
  }

  resize() {
    this.c.width = window.innerWidth;
    this.c.height = window.innerHeight;
    this.aspect = c.width/c.height;
    this.fov_azi = Math.atan(this.aspect/this.distance_to_plane);
    this.update();
  }

  shiftDir(dx, dy) {
    let dazi_dx = this.fov_azi/this.c.width;
    let dpolar_dy = this.fov/this.c.height;
    this.dir_azi += dazi_dx*dx*2*this.scroll_speed;
    this.dir_pol += dpolar_dy*dy*2*this.scroll_speed;
    this.dir_azi = positive_angle(this.dir_azi);
    this.dir_pol = positive_angle(this.dir_pol);
    this.update();
  }


  shiftTheta(azi, polar) {
    this.dir_azi += azi;
    this.dir_pol += polar;
    this.dir_azi = positive_angle(this.dir_azi);
    this.dir_pol = positive_angle(this.dir_pol);
    this.update();
  }

  sphereToRect(azi, polar) {
    let in_fov = true;
    if (small_angle(polar - this.dir_pol) > this.fov ||
        small_angle(polar - this.dir_pol) < -this.fov ||
        small_angle(azi - this.dir_azi) > this.fov_azi ||
        small_angle(azi - this.dir_azi) < -this.fov_azi) {
      in_fov = false;
    }

    let y = this.distance_to_plane * Math.tan(this.dir_pol - polar);
    y = (y + 1)/2 * this.c.height;

    let x = this.distance_to_plane * Math.tan(this.dir_azi - azi);
    x /= this.aspect;
    x = (x + 1)/2 * this.c.width;
    return [x,y, in_fov];
  }

  drawPoint(azi, polar, point_radius=4) {
    let [x,y, in_fov] = this.sphereToRect(azi, polar);
    if (in_fov) {
      this.ctx.beginPath();
      this.ctx.arc(x,y,point_radius,0,2*Math.PI);
      this.ctx.fillStyle = "white";
      this.ctx.fill();
    }
  }

  thetaWithinRange(theta1, theta2, dir, fov) {
    theta1 -= dir;
    theta2 -= dir;
    theta1 = positive_angle(theta1);
    theta2 = positive_angle(theta2);
    if (theta1 > theta2) {
      let tmp = theta1;
      theta1 = theta2;
      theta2 = tmp;
    }

    theta1 = small_angle(theta1);
    theta2 = small_angle(theta2);

    if (theta1 > 0 && theta2 > 0) {
      return theta1 < fov;
    } else if (theta1 < 0 && theta2 < 0) {
      return theta2 > -fov;
    } else {
      return theta1 < Math.PI/2 && theta2 > -Math.PI/2
    }

  }

  lineVisible(azi1, pol1, azi2, pol2) {
    return this.thetaWithinRange(azi1, azi2, this.dir_azi, this.fov_azi)
        && this.thetaWithinRange(pol1, pol2, this.dir_pol, this.fov);
  }

  drawLine(azi1, polar1, azi2, polar2, width=2.5) {
    //width = Math.random() * (4 - 2) + 2
    let [x1,y1] = this.sphereToRect(azi1, polar1);
    let [x2,y2] = this.sphereToRect(azi2, polar2);
    if (!this.lineVisible(azi1, polar1, azi2, polar2)) {
      return;
    }

    this.ctx.lineWidth=width;
    this.ctx.beginPath();
    this.ctx.moveTo(x1,y1);
    this.ctx.lineTo(x2,y2);
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.stroke();
  }

  label_spherical(azi, polar, label) {
    let [x,y,in_fov] = this.sphereToRect(azi, polar);
    if (in_fov) {
      this.ctx.font = '16px monospace'
      this.ctx.fillText(label, x+20, y+20);
    }
  }

  
}

class Constellation {
  constructor(stars, lines, name, abbreviation) {
    // lines are the indices of the stars i.e. [0,1] line from star 0 to star 1
    this.stars = stars;
    this.lines = lines;
    this.name = name;
    this.abbreviation = abbreviation;
    this.middle_star = null;
    this.fov = null;
    this.calc();
    this.dir_azi = this.middle_star.azi;
    this.dir_pol = this.middle_star.polar;
  }

  calc(label_middle_star = true) {
    this.middle_star = this.stars[0];
    this.fov = Math.PI/6;
    if (label_middle_star) {
      this.middle_star.label = this.name;
      this.middle_star.hasLabel = true;
    }
  }

  draw(viewer) {
    this.stars.forEach(s => s.draw(viewer));
    this.lines.forEach(line => {
      let star1 = this.stars[line[0]];
      let star2 = this.stars[line[1]];
      viewer.drawLine(star1.azi, star1.polar, star2.azi, star2.polar);
    });
  }
}

class Star {
  constructor(azimuth, polar, label = "") {
    this.azi = azimuth;
    this.polar = polar;
    this.hasLabel = label != "";
    this.label = label;
  }
  
  draw(viewer) {
    viewer.drawPoint(this.azi, this.polar, 4);
    if (this.hasLabel) {
      viewer.label_spherical(this.azi, this.polar, this.label);
    }
  }
}

// returns an angle between 0 and 2pi
function positive_angle(theta) {
  while (theta < 0) {
    theta += 2 * Math.PI;
  }
  return theta % (2 * Math.PI);
}

function small_angle(theta) {
  theta = positive_angle(theta);
  if (theta > Math.PI) {
    theta -= 2*Math.PI;
  }
  return theta;
}

function json_to_constellation(obj) {
  stars = obj.stars.map(point => new Star(point[0], point[1]));
  return new Constellation(stars, obj.lines, obj.name, obj.abb);
}

function parseJSON(json) {
  jsonData = JSON.parse(json);
  return jsonData.map(json_to_constellation);
}


let c = document.getElementById("canvas");
c.setAttribute("tabindex", 0);
c.focus();


cas_deg = [[ 2.29,59.15],
           [10.13,56.54],
           [14.17,60.72],
           [21.45,60.23],
           [28.59,63.67]];

cas = cas_deg.map(row => row.map(x => x*Math.PI/180));

cas_stars = cas.map(coord => new Star(coord[0], coord[1]));

cas_lines = [[0,1],
             [1,2],
             [2,3],
             [3,4]];

cas_constellation = new Constellation(cas_stars, cas_lines, 'Cassiopeia', 'Cas');

test = new Constellation([new Star(0,0), new Star(Math.PI/6, 0)], [[0,1]], "test", "tst");

constellations = parseJSON(constellations_json);
//viewer = new Viewer(c, [cas_constellation], 0.1745, 1.0472, Math.PI/6, 1);
viewer = new Viewer(c, constellations, 0.1745, 1.0472, Math.PI/6, 1);
//viewer = new Viewer(c, [test], -2*Math.PI/180, 0, Math.PI/6, 1);







//controls

window.addEventListener('resize', () => resizeCanvas(viewer), false);

function resizeCanvas(viewer) {
  //console.log(`width: ${c.width}`);
  c.width = window.innerWidth;
  c.height = window.innerHeight;
  viewer.resize()
}

drag = false;
let drag_x = 0;
let drag_y = 0;
c.addEventListener('mousedown', e => {
  drag = true; 
  drag_x = e.offsetX;
  drag_y = e.offsetY;
});
c.addEventListener('mouseup', () => {
  drag = false;
});
c.addEventListener('mousemove', e => {
  if(drag) {
    viewer.shiftDir(e.offsetX-drag_x, e.offsetY - drag_y);
    drag_x = e.offsetX;
    drag_y = e.offsetY;
  };
});

c.addEventListener('touchstart', e => {
  drag = true;
  drag_x = e.touches[0].clientX;
  drag_y = e.touches[0].clientY;
});

c.addEventListener("touchmove", e => {
  if (drag) {
    e.preventDefault();
    let dx = e.touches[0].clientX - drag_x;
    let dy = e.touches[0].clientY - drag_y;
    viewer.shiftDir(dx, dy);
    drag_x = e.touches[0].clientX;
    drag_y = e.touches[0].clientY;
  }
});

c.addEventListener('touchend', () => {
  drag = false;
});

c.addEventListener('keydown', event => {
  if (event.code == "Equal") {
    // zoom in
    viewer.zoom();
  }
  if (event.code == "Minus") {
    // zoom out
    viewer.zoom(false);
  }
  if (event.code == "ArrowRight") {
    viewer.shiftTheta(10*Math.PI/180, 0);
  }
  if (event.code == "ArrowLeft") {
    viewer.shiftTheta(-10*Math.PI/180, 0);
  }
  if (event.code == "ArrowUp") {
    viewer.shiftTheta(0, -10*Math.PI/180);
  }
  if (event.code == "ArrowDown") {
    viewer.shiftTheta(0, 10*Math.PI/180);
  }
});