class Viewer {
  constructor(canvas, constellations, dir_azi = 0, dir_pol = 0, fov = Math.PI/12, fov_azi, scroll_speed = 1, static_display = false) {
    this.c = canvas;
    this.constellations = constellations;

    this.dir_azi = -dir_azi;
    this.dir_pol = dir_pol;
    this.ctx = this.c.getContext("2d");
    this.scroll_speed = scroll_speed;

    this.fov = fov;
    this.distance_to_plane = 1/Math.tan(this.fov);

    this.parent = canvas.parentElement;
    this.height = this.parent.clientHeight;
    this.width = this.parent.clientWidth;

    if (!static_display) {
      this.controls();
    }
    window.addEventListener('resize', () => this.resize(), false);

    this.resize(fov_azi);
  }

  controls() {

    let drag = false;
    let pinch = false;
    let pinch_dist = 0;
    let drag_x = 0;
    let drag_y = 0;
    this.c.addEventListener('mousedown', e => {
      drag = true; 
      drag_x = e.offsetX;
      drag_y = e.offsetY;
    });
    this.c.addEventListener('mouseup', () => {
      drag = false;
    });
    this.c.addEventListener('mousemove', e => {
      if(drag) {
        this.shiftDir(e.offsetX-drag_x, e.offsetY - drag_y);
        drag_x = e.offsetX;
        drag_y = e.offsetY;
      };
    });
    this.c.addEventListener('wheel', e => {
      e.preventDefault();
      this.zoom(e.deltaY > 0, 0.3)
    });

    this.c.addEventListener('touchstart', e => {
      if (e.touches.length == 2) {
        drag = false;
        pinch = true;
        pinch_dist = Math.sqrt((e.touches[0].clientX - e.touches[1].clientX)**2 
                             + (e.touches[0].clientY-e.touches[1].clientY)**2);
      }
      drag = true;
      drag_x = e.touches[0].clientX;
      drag_y = e.touches[0].clientY;
    });

    this.c.addEventListener("touchmove", e => {
      if (drag) {
        e.preventDefault();
        let dx = e.touches[0].clientX - drag_x;
        let dy = e.touches[0].clientY - drag_y;
        this.shiftDir(2*dx, 2*dy);
        drag_x = e.touches[0].clientX;
        drag_y = e.touches[0].clientY;
      }
      if (pinch) {
        drag=false;
        if (e.touches.length > 1) {
          let dist = Math.sqrt((e.touches[0].clientX - e.touches[1].clientX)**2 
                             + (e.touches[0].clientY-e.touches[1].clientY)**2);
          this.pinch_zoom(dist,pinch_dist);
          pinch_dist = dist;
        } else {
          pinch = false;
        }
      }
    });

    this.c.addEventListener('touchend', () => {
      drag = false;
      pinch = false;
    });

    this.c.addEventListener('keydown', event => {
      if (event.code == "Equal") {
        // zoom in
        this.zoom();
      }
      if (event.code == "Minus") {
        // zoom out
        this.zoom(false);
      }
      if (event.code == "ArrowRight") {
        this.shiftTheta(10*Math.PI/180, 0);
      }
      if (event.code == "ArrowLeft") {
        this.shiftTheta(-10*Math.PI/180, 0);
      }
      if (event.code == "ArrowUp") {
        this.shiftTheta(0, 10*Math.PI/180);
      }
      if (event.code == "ArrowDown") {
        this.shiftTheta(0, -10*Math.PI/180);
      }
    });
  }
  
  update() {
    this.ctx.clearRect(0,0, this.c.width, this.c.height);
    this.draw()
  }

  pinch_zoom(dist1, dist2) {
    this.fov *= dist2/dist1;
    this.fov_limits();
    this.distance_to_plane = 1/Math.tan(this.fov);
    this.fov_azi = Math.atan(this.aspect/this.distance_to_plane);

    this.update();

  }

  fov_limits() {
    if (this.fov < Math.PI/20) {
      this.fov = Math.PI/20;
    } else if (this.fov > 50*Math.PI/180) {
      this.fov = 50*Math.PI/180;
    }
  }

  zoom(zoom_in = true, speed = 1) {
    if (zoom_in) {
      this.fov /= 1 + (.1 * speed)
      if (this.fov < Math.PI/20) {
        this.fov = Math.PI/20;
      }
    } else {
      this.fov *= 1 + (.1 * speed);
      if (this.fov > 50*Math.PI/180) {
        this.fov = 50*Math.PI/180;
      }
    }
    this.distance_to_plane = 1/Math.tan(this.fov);
    this.fov_azi = Math.atan(this.aspect/this.distance_to_plane);

    this.update();
  }


  draw() {
    this.constellations.forEach(c => c.draw(this));
  }

  resize(fov_azi=0) {
    this.width = this.parent.clientWidth;
    this.height = this.parent.clientHeight;
    this.c.width = this.width * devicePixelRatio;
    this.c.height = this.height * devicePixelRatio;

    this.ctx.scale(devicePixelRatio, devicePixelRatio);
    this.c.style.width = this.parent.clientWidth + 'px';
    this.c.style.height = this.parent.clientHeight + 'px';

    this.aspect = this.c.width/this.c.height;
    this.fov_azi = Math.atan(this.aspect/this.distance_to_plane);
    if (fov_azi != 0 && this.fov_azi < fov_azi) {
      this.fov = Math.atan(Math.tan(fov_azi)/this.aspect);
      this.distance_to_plane = 1/Math.tan(this.fov);
      this.fov_azi = Math.atan(this.aspect/this.distance_to_plane);
      this.fov_limits();
    }

    this.update();
  }

  shiftDir(dx, dy) {
    let dazi_dx = this.fov_azi/this.width;
    let dpolar_dy = this.fov/this.height;
    this.dir_azi -= dazi_dx*dx*2*this.scroll_speed;
    this.dir_pol += dpolar_dy*dy*2*this.scroll_speed;
    this.dir_azi = positive_angle(this.dir_azi);
    this.dir_pol = small_angle(this.dir_pol);
    if (this.dir_pol < -Math.PI/2) {
      this.dir_pol = -Math.PI/2;
    } else if (this.dir_pol > Math.PI/2) {
      this.dir_pol = Math.PI/2;
    }
    this.update();
  }


  shiftTheta(azi, polar) {
    this.dir_azi += azi;
    this.dir_pol += polar;
    this.dir_azi = positive_angle(this.dir_azi);
    this.dir_pol = small_angle(this.dir_pol);
    if (this.dir_pol < -Math.PI/2) {
      this.dir_pol = -Math.PI/2;
    } else if (this.dir_pol > Math.PI/2) {
      this.dir_pol = Math.PI/2;
    }
    this.update();
  }


  sphereToRect(azi, polar) {
    let c = Math.cos(this.dir_azi);
    let s = Math.sin(this.dir_azi);
    let rot_z = [[c, s, 0],
                 [-s,  c, 0],
                 [0,  0, 1]];
    c = Math.cos(this.dir_pol);
    s = Math.sin(this.dir_pol);
    let rot_x = [[1, 0,  0],
                 [0, c, s],
                 [0, -s,  c]];
    let [x_c,y_c,z_c] = sphereToCartesian([1, azi, polar]);
    let [x2_arr,y2_arr,z2_arr] = matmul(rot_x, matmul(rot_z, [[x_c],[y_c],[z_c]]));
    let [_, azi2, polar2] = cartesianToSphere([x2_arr[0], y2_arr[0], z2_arr[0]]);

    let in_fov = true;
    if (small_angle(azi2) > this.fov_azi || small_angle(azi2) < -this.fov_azi ||
        small_angle(polar2) > this.fov   || small_angle(polar2) < -this.fov ||
        y2_arr[0] < 0) {
      in_fov = false;
    }

    let y = this.distance_to_plane * Math.tan(polar2);
    y = (-y + 1)/2 * this.height;

    let x = this.distance_to_plane * Math.tan(azi2);
    x /= this.aspect;
    x = (-x + 1)/2 * this.width;
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


  drawLine(azi1, polar1, azi2, polar2, width=2.5) {
    let [x1,y1,in_fov1] = this.sphereToRect(azi1, polar1);
    let [x2,y2,in_fov2] = this.sphereToRect(azi2, polar2);
    if (!(in_fov1 || in_fov2)) {
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
      this.ctx.font = '18px Montserrat';
      this.ctx.fillText(label, x+20, y+20);
    }
  }

  
}

class Constellation {
  constructor(stars, lines, name, abbreviation, middle_star, bounds) {
    // lines are the indices of the stars i.e. [0,1] line from star 0 to star 1
    this.stars = stars;
    this.lines = lines;
    this.name = name;
    this.abbreviation = abbreviation;
    this.middle_star = this.stars[middle_star];
    this.middle_star.label = this.name;
    this.middle_star.hasLabel = true;
    this.fov = bounds[1];
  }


  draw(viewer) {
    this.stars.forEach(s => s.draw(viewer));
    this.lines.forEach(line => {
      let star1 = this.stars[line[0]];
      let star2 = this.stars[line[1]];
      let width = (star1.magnitudeToRadius() + star2.magnitudeToRadius()) * 2.0/(4*2)
      viewer.drawLine(star1.azi, star1.polar, star2.azi, star2.polar, width);
    });
  }
}

class Star {
  constructor(azimuth, polar, magnitude, label = "") {
    this.azi = azimuth;
    this.polar = polar;
    this.hasLabel = label != "";
    this.label = label;
    this.magnitude = magnitude
  }

  magnitudeToRadius() {
    let default_radius = 4;
    return Math.pow(2.512**(3.63-this.magnitude), 0.125)*default_radius;
  }
  
  draw(viewer) {
    viewer.drawPoint(this.azi, this.polar, this.magnitudeToRadius());
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

// format: [[1,2,3],
//          [4,5,6],
//          [7,8,9]]
function matmul(a,b) {
  if (a[0].length != b.length) {
    throw 'Dimension error';
  }

  let out = []
  for(let i = 0; i < a.length; i++) {
    let row = []
    for(let j = 0; j < b[0].length; j++) {
      let sum = 0;
      for(let k = 0; k < a[0].length; k++) {
        sum += a[i][k]*b[k][j];
      }
      row.push(sum);
    }
    out.push(row);
  }
  return out;
}


function sphereToCartesian([r, azi, pol]) {
  return [r*Math.cos(pol)*Math.sin(azi),
          r*Math.cos(pol)*Math.cos(azi),
          r*Math.sin(pol)];
}

function cartesianToSphere([x,y,z]) {
  let r = Math.sqrt(x**2+y**2+z**2);
  let azi = Math.atan(x/y);
  let pol = Math.asin(z/r);
  return [r, azi, pol];
}

function json_to_constellation(obj) {
  let stars = obj.stars.map(s => new Star(s[0], s[1], s[2]));
  return new Constellation(stars, obj.lines, obj.name, obj.abb, obj.middle, obj.bounds);
}

function parseJSONdict(dict) {
  return Object.entries(dict).map(entry => json_to_constellation(entry[1]));
}

function focusedViewer(json, focus_abb, canvas, scroll_speed=1, static_display=false) {
  let const_dict = JSON.parse(json);
  let const_list = parseJSONdict(const_dict);
  let focus = const_dict[focus_abb];
  if (focus == undefined) {
    focus = const_dict['Ori']
  }
  let dir_azi = focus.stars[focus.middle][0];
  let dir_pol = focus.stars[focus.middle][1];
  let fov = focus.bounds[1]+2*Math.PI/180;
  let fov_azi = focus.bounds[0]+2*Math.PI/180;
  return new Viewer(canvas, const_list, dir_azi, dir_pol, fov, fov_azi, scroll_speed, static_display);
}

export {focusedViewer, Viewer};

