import {focusedViewer} from './viewer.js'


window.WebFontConfig = {
    google:{ families: ['Montserrat', 'Orbitron'] },
    active: function(){start();},
  };
(function(){
  var wf = document.createElement("script");
  wf.src = 'https://ajax.googleapis.com/ajax/libs/webfont/1.5.10/webfont.js';
  wf.async = 'true';
  document.head.appendChild(wf);
})();



let c = document.getElementById("canvas");
c.setAttribute("tabindex", 0);
c.focus();


window.viewers = [];
window.start = () => {
  let const_canvases = document.getElementsByClassName('constellation-container')
  for (const container of const_canvases) {
    let abb = container.parentElement.parentElement.id;
    //console.log(container.offsetWidth);
    container.style.height = 1/2*container.offsetWidth + 'px';

    let canvas = container.children[0];
    //console.log(`container: ${container}`);

    viewers.push(focusedViewer(constellations_json, abb, canvas, 1, true));
  }
  //let focus_abb = window.location.href.slice(-3);
  //let viewer = focusedViewer(constellations_json, focus_abb, c);
}

const scrollToTopBtn = document.getElementById("back-to-top");

function scrollFunc() {
  if (window.scrollY > window.innerHeight) {
    //scrollToTopBtn.style.display='hidden';
    scrollToTopBtn.classList.add('show-btn');
  } else {
    scrollToTopBtn.classList.remove('show-btn');
  }
}
window.addEventListener("scroll", scrollFunc);

window.addEventListener("resize", e => {
  for (const container of document.getElementsByClassName('constellation-container')) {
    container.style.height = 1/2*container.offsetWidth + 'px';
  }
})

window.toggleArrow = (obj) => {
  if (obj.classList.contains('rot90')) {
    obj.classList.remove('rot90');
  } else {
    obj.classList.add('rot90');
  }
}


