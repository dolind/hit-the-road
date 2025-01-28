var u=Object.defineProperty;var g=(s,t,a)=>t in s?u(s,t,{enumerable:!0,configurable:!0,writable:!0,value:a}):s[t]=a;var i=(s,t,a)=>(g(s,typeof t!="symbol"?t+"":t,a),a);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))o(e);new MutationObserver(e=>{for(const n of e)if(n.type==="childList")for(const c of n.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&o(c)}).observe(document,{childList:!0,subtree:!0});function a(e){const n={};return e.integrity&&(n.integrity=e.integrity),e.referrerPolicy&&(n.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?n.credentials="include":e.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function o(e){if(e.ep)return;e.ep=!0;const n=a(e);fetch(e.href,n)}})();const f="AIzaSyD4ITPb6kkkzNu41FLdplOuS_psFJnyrKw";class v{constructor(t,a){i(this,"panoramas",[]);i(this,"pov",{heading:0,pitch:0});i(this,"speed",5e-5);i(this,"speed_increment",1e-5);i(this,"autoMove",!1);i(this,"autoMoveInterval");i(this,"autoMoveFirstRun",!0);i(this,"autoRotate",!1);i(this,"autoRotateInterval");i(this,"mapView");i(this,"updateRate",1500);i(this,"sv",new google.maps.StreetViewService);t.forEach(o=>{const e=new google.maps.StreetViewPanorama(document.getElementById(o.elementId),{position:o.initialPosition,pov:o.initialPov,disableDefaultUI:!0,clickToGo:!1,showRoadLabels:!1});this.panoramas.push(e)}),this.mapView=a,this.mapView.setStreetView(this.panoramas[0]),this.initializeEventListeners(),this.updateStatus()}updateStatus(){const t=document.getElementById("statusBox");if(t){let a=this.speed*111.1*1e3,o=`Jump Distance (m): ${Math.trunc(a)}, Switch Interval (s): ${this.updateRate/1e3}, Heading: ${this.panoramas[0].getPov().heading.toFixed(2)}, Pitch: ${this.panoramas[0].getPov().pitch.toFixed(2)}, AutoMove: ${this.autoMove?"On":"Off"}, AutoRotate: ${this.autoRotate?"On":"Off"}`;this.autoMove&&(o+=`,Speed (km/h): ${Math.trunc(a/this.updateRate*1e3*3.6)};`),t instanceof HTMLInputElement?t.value=o:t.textContent=o}}movePanoramas(t){this.panoramas.forEach(a=>{const o=a.getPov(),e=a.getPosition(),n={lat:e.lat()+t*Math.cos(o.heading*Math.PI/180),lng:e.lng()+t*Math.sin(o.heading*Math.PI/180)};a.setPosition(n)})}movePanoramaId(t,a){const o=this.panoramas[0].getPov(),e=this.panoramas[0].getPosition(),n={lat:e.lat()+t*Math.cos(o.heading*Math.PI/180),lng:e.lng()+t*Math.sin(o.heading*Math.PI/180)};let c=(function(l){const{data:r}=l;r&&r.location&&r.copyright.includes("Google")?this.panoramas[a].setPosition(r.location.latLng):(r.copyright.includes("Google")?m("Not a Google Panorama, despite only using outdoor panoramas"):m("Something went wrong with the panorama"),this.toggleAutoMove())}).bind(this);this.sv.getPanorama({location:n,radius:100,source:google.maps.StreetViewSource.OUTDOOR}).then(c)}initializeEventListeners(){document.addEventListener("keydown",t=>{switch(t.key){case"w":this.accelerate();break;case"r":this.brake();break;case"W":this.stepForward();break;case"R":this.stepBackward();break;case" ":this.toggleAutoMove();break;case"q":this.reset();break;case"p":this.toggleAutoRotate();break;case"g":this.increaseUpdateRate();break;case"d":this.decreaseUpdateRate();break}this.updateStatus()}),document.addEventListener("mousemove",t=>{if(!d()){const a=window.innerWidth,o=window.innerHeight,e=t.clientX,n=t.clientY,c=360*(e/a)-180;let l=90-180*(n/o);l>45&&(l=45),l<-45&&(l=-45),this.pov={heading:c,pitch:l},this.panoramas.forEach(r=>{r.setPov(this.pov)})}}),document.querySelectorAll(".action-btn").forEach(t=>{t.addEventListener("click",a=>{const o=a.target.getAttribute("data-action").toLowerCase();switch(o){case"w":this.accelerate();break;case"r":this.brake();break;case"space":this.toggleAutoMove();break;case"q":this.reset();break;case"p":this.toggleAutoRotate();break;case"g":this.increaseUpdateRate();break;case"d":this.decreaseUpdateRate();break;default:console.log(`Action ${o} is not recognized.`)}this.updateStatus()})}),window.addEventListener("beforeunload",()=>{y("lastPosition",this.panoramas[0].getPosition(),7)}),document.getElementById("uiToggleBtn").addEventListener("click",function(){const t=document.getElementById("actionButtonsContainer");t.style.display==="none"||t.style.display===""?t.style.display="block":t.style.display="none"})}accelerate(){this.speed+=this.speed_increment}brake(){this.speed=Math.max(0,this.speed-this.speed_increment)}increaseUpdateRate(){this.updateRate+=100}decreaseUpdateRate(){this.updateRate-=100}stepForward(){this.movePanoramaId(this.speed,0),this.mapView.setCenter(this.panoramas[0].getPosition())}stepBackward(){this.movePanoramaId(-this.speed,0),this.mapView.setCenter(this.panoramas[0].getPosition())}reset(){this.speed=0,this.autoMove&&this.toggleAutoMove(),this.autoRotate&&this.toggleAutoRotate()}toggleAutoMove(){const t=document.getElementById("pano0"),a=document.getElementById("pano1"),o=document.getElementById("pano2");if(this.autoMove)clearInterval(this.autoMoveInterval),this.autoMove=!1,this.autoMoveFirstRun=!0,this.panoramas[1].setPosition(this.panoramas[0].getPosition()),this.panoramas[2].setPosition(this.panoramas[0].getPosition()),t.style.zIndex="2",a.style.zIndex="1",o.style.zIndex="1",this.updateStatus();else{this.autoMove=!0;let e=0;this.autoMoveInterval=window.setInterval(()=>{if(this.autoMoveFirstRun)this.movePanoramaId(this.speed,1),this.movePanoramaId(this.speed*2,2),this.autoMoveFirstRun=!1;else{const n=(e+1)%this.panoramas.length;switch(t.style.zIndex="1",a.style.zIndex="1",o.style.zIndex="1",n){case 0:t.style.zIndex="2",this.panoramas[0].setZoom(this.panoramas[2].getZoom()),this.panoramas[1].setZoom(this.panoramas[2].getZoom()),d()&&(this.panoramas[0].setPov(this.panoramas[2].getPov()),this.panoramas[1].setPov(this.panoramas[2].getPov()));break;case 1:a.style.zIndex="2",this.panoramas[1].setZoom(this.panoramas[0].getZoom()),this.panoramas[2].setZoom(this.panoramas[0].getZoom()),d()&&(this.panoramas[1].setPov(this.panoramas[0].getPov()),this.panoramas[2].setPov(this.panoramas[0].getPov()));break;case 2:o.style.zIndex="2",this.panoramas[2].setZoom(this.panoramas[1].getZoom()),this.panoramas[0].setZoom(this.panoramas[1].getZoom()),d()||(this.panoramas[2].setPov(this.panoramas[1].getPov()),this.panoramas[2].setPov(this.panoramas[1].getPov()));break}e==0?this.movePanoramaId(this.speed*this.panoramas.length,e):this.movePanoramaId(this.speed*e,e),this.mapView.setCenter(this.panoramas[0].getPosition()),e=n}},this.updateRate)}}reInitPosition(t){this.reset(),this.panoramas[0].setPosition(t),this.mapView&&this.mapView.setCenter(t)}toggleAutoRotate(){if(this.autoRotate)clearInterval(this.autoRotateInterval),this.autoRotate=!1;else{this.autoRotate=!0;let t=0,a=1;this.autoRotateInterval=window.setInterval(()=>{t+=.25*a,(t>=90||t<=-90)&&(a*=-1),this.panoramas.forEach(o=>{o.setPov({heading:t,pitch:0})})},10)}}}function m(s,t=2e3){let a=document.getElementById("toast-container");a||(a=document.createElement("div"),a.id="toast-container",document.body.appendChild(a));const o=document.createElement("div");o.className="toast-message",o.textContent=s,a.appendChild(o),setTimeout(()=>{o.style.opacity="1"},100),setTimeout(()=>{o.style.opacity="0",o.addEventListener("transitionend",()=>o.remove())},t)}window.initialize=function(){P();let s={lat:63.0001441,lng:7.2871579};const t=I("lastPosition");if(t){const c=/-?\d+(\.\d+)?/g,l=t.match(c);if(l){const r=l.map(Number),[h,p]=r;s.lat=h,s.lng=p}}const a=new google.maps.Map(document.getElementById("map"),{center:s,zoom:14,disableDefaultUI:!0,streetViewControl:!0,clickableIcons:!1,keyboardShortcuts:!1}),o=[{elementId:"pano0",initialPosition:s,initialPov:{heading:0,pitch:0}},{elementId:"pano1",initialPosition:s,initialPov:{heading:0,pitch:0}},{elementId:"pano2",initialPosition:s,initialPov:{heading:0,pitch:0}}],e=new v(o,a);function n(){const c=document.getElementById("placeInput").value;new google.maps.Geocoder().geocode({address:c},(r,h)=>{if(h===google.maps.GeocoderStatus.OK&&r[0]){const p=r[0].geometry.location;e.reInitPosition(p)}else console.error("Geocode was not successful for the following reason: "+h),m("Geocode was not successful. Please try a different location.")})}document.getElementById("findPanoramaBtn").addEventListener("click",n)};function d(){return/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)}function P(){if(d()){document.querySelectorAll(".action-btn").forEach(e=>{e.style.padding="15px 15px",e.style.fontSize="40px",e.style.marginBottom="10px"});const t=document.querySelector("#uiToggleBtn");t.style.fontSize="40px";const a=document.querySelector("#placeInput"),o=document.querySelector("#findPanoramaBtn");a.style.padding="12px",a.style.fontSize="20px",a.style.marginBottom="10px",o.style.padding="15px 0",o.style.fontSize="20px",o.style.marginBottom="10px"}}function y(s,t,a){let o="";if(a){const e=new Date;e.setTime(e.getTime()+a*24*60*60*1e3),o="; expires="+e.toUTCString()}document.cookie=s+"="+(t||"")+o+"; path=/"}function I(s){const t=s+"=",a=document.cookie.split(";");for(let o=0;o<a.length;o++){let e=a[o];for(;e.charAt(0)==" ";)e=e.substring(1,e.length);if(e.indexOf(t)==0)return e.substring(t.length,e.length)}return null}function w(){const s=document.createElement("script");s.src=`https://maps.googleapis.com/maps/api/js?key=${f}&callback=initialize`,s.async=!0,s.defer=!0,document.head.appendChild(s)}document.addEventListener("DOMContentLoaded",w);
