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

window.start = () => {
  let focus_abb = window.location.href.slice(-3);
  let viewer = focusedViewer(constellations_json, focus_abb, c);
}

