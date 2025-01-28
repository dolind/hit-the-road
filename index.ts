import { start } from "repl";

declare var google: any; // Assuming google maps API is included in your HTML
// Access your API key
const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;


class PanoramaController {
  private panoramas: google.maps.StreetViewPanorama[] = [];
  private pov: google.maps.StreetViewPov = { heading: 0, pitch: 0 };
  private speed: number = 0.00005; // Default speed
  private speed_increment = 0.00001;
  private autoMove: boolean = false; // Auto move toggle
  private autoMoveInterval?: number; // Store interval ID for auto move functionality
  private autoMoveFirstRun = true;
  private autoRotate: boolean = false; // Auto rotate toggle
  private autoRotateInterval?: number; // Store interval ID for auto rotate functionality

  private mapView: google.maps.Map
  private updateRate: number = 1500;

  
  private sv = new google.maps.StreetViewService();

  constructor(panoramaConfigs: { elementId: string, initialPosition: google.maps.LatLngLiteral, initialPov: google.maps.StreetViewPov }[], map: google.maps.Map) {

    panoramaConfigs.forEach(config => {
      const panorama = new google.maps.StreetViewPanorama(
        document.getElementById(config.elementId) as HTMLElement,
        {
          position: config.initialPosition,
          pov: config.initialPov,
          disableDefaultUI: true,
          clickToGo: false,
          showRoadLabels: false
        }
      );
      this.panoramas.push(panorama);
    });
    this.mapView = map;
    this.mapView.setStreetView(this.panoramas[0]);
    this.initializeEventListeners();
    this.updateStatus();
  }


  updateStatus(): void {
    const statusBox: HTMLElement | null = document.getElementById('statusBox');
    if (statusBox) {
      let meter = this.speed * 111.1 * 1000;
      // Example status message. Customize it based on what you want to display.
      let statusMessage: string = `Jump Distance (m): ${Math.trunc(meter)}, Switch Interval (s): ${(this.updateRate / 1000)}, Heading: ${this.panoramas[0].getPov().heading.toFixed(2)}, Pitch: ${this.panoramas[0].getPov().pitch.toFixed(2)}, AutoMove: ${this.autoMove ? 'On' : 'Off'}, AutoRotate: ${this.autoRotate ? 'On' : 'Off'}`;

      if (this.autoMove) {
        statusMessage += `,Speed (km/h): ${Math.trunc(meter / this.updateRate * 1000 * 3.6)};`
      }
      // Update the status box. Use `value` for input elements, `textContent` for others.
      if (statusBox instanceof HTMLInputElement) {
        statusBox.value = statusMessage;
      } else {
        statusBox.textContent = statusMessage;
      }
    }
  }
  private movePanoramas(moveDistance: number): void {
    this.panoramas.forEach(panorama => {
      const currentPov = panorama.getPov();
      const currentPos = panorama.getPosition();
      const newPos = {
        lat: currentPos.lat() + moveDistance * Math.cos(currentPov.heading * Math.PI / 180),
        lng: currentPos.lng() + moveDistance * Math.sin(currentPov.heading * Math.PI / 180),
      };

      panorama.setPosition(newPos);
    });
  }

  private movePanoramaId(moveDistance: number, id: number): void {


    const currentPov = this.panoramas[0].getPov();
    const currentPos = this.panoramas[0].getPosition();
    const newPos = {
      lat: currentPos.lat() + moveDistance * Math.cos(currentPov.heading * Math.PI / 180),
      lng: currentPos.lng() + moveDistance * Math.sin(currentPov.heading * Math.PI / 180),
    };




    let setPositionCallback = (function (response) {
      const { data } = response;

      // this avoids custom panoramas,
      // it does not avoid the pano from going grey, when the jump is too large
      if (data && data.location && data.copyright.includes("Google")) {
        // using the  returned position or the pano id directly, lead to choppy results
        this.panoramas[id].setPosition(data.location.latLng);
      }
      else {
        if (data.copyright.includes("Google")) {
          showToast("Not a Google Panorama, despite only using outdoor panoramas");
        }
        else {
          showToast("Something went wrong with the panorama");
        }
        this.toggleAutoMove();
      }
    }).bind(this);
    // here we only use the service to lookup, if a panorama exists at this position
    this.sv.getPanorama({ location: newPos, radius: 100, source: google.maps.StreetViewSource.OUTDOOR }).then(setPositionCallback);




  }

  private initializeEventListeners(): void {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      switch (event.key) {
        case 'w':
          this.accelerate();
          break;
        case 'r':
          this.brake();
          break;
        case 'W':
          this.stepForward();
          break;
        case 'R':
          this.stepBackward();
          break;
        case ' ':
          this.toggleAutoMove();
          break;
        case 'q':
          this.reset();
          break;
        case 'p':
          this.toggleAutoRotate();
          break;
        case 'g':
          this.increaseUpdateRate();
          break;
        case 'd':
          this.decreaseUpdateRate();
          break;
      }
      this.updateStatus();
    });


    document.addEventListener('mousemove', (e: MouseEvent) => {
      if (!isMobileDevice()) {
        
      
        const width = window.innerWidth;
        const height = window.innerHeight;
        const x = e.clientX;
        const y = e.clientY;

        const heading = 360 * (x / width) - 180;
        let pitch = 90 - 180 * (y / height);
        if (pitch > 45) {
          pitch = 45;
        }
        if (pitch < -45) {
          pitch = -45;
        }

        this.pov = { heading, pitch };

        this.panoramas.forEach(panorama => {
          panorama.setPov(this.pov);
        });
    }
    });

    document.querySelectorAll('.action-btn').forEach((button) => {
      
      button.addEventListener('click', (event) => {
        
          const action = (event.target as HTMLElement).getAttribute('data-action').toLowerCase();
          // Call the respective method based on the action
          
          switch (action) {
              case 'w':
                  this.accelerate();
                  break;
              case 'r':
                  this.brake();
                  break;
              case 'space':
                  this.toggleAutoMove();
                  break;
              case 'q':
                  this.reset();
                  break;
              case 'p':
                  this.toggleAutoRotate();
                  break;
              case 'g':
                  this.increaseUpdateRate();
                  break;
              case 'd':
                  this.decreaseUpdateRate();
                  break;
              default:
                  console.log(`Action ${action} is not recognized.`);
          }
          this.updateStatus();
      });
  });


  window.addEventListener('beforeunload', () => {
    setCookie('lastPosition', this.panoramas[0].getPosition(), 7); // Expires in 7 days
});

document.getElementById('uiToggleBtn').addEventListener('click', function() {
  const container = document.getElementById('actionButtonsContainer');
  // Toggle the display style directly
  if (container.style.display === "none" || container.style.display === "") {
    container.style.display = "block";
  } else {
    container.style.display = "none";
  }
});

  }


  private accelerate(): void {
    this.speed += this.speed_increment;
  }

  private brake(): void {
    this.speed = Math.max(0, this.speed - this.speed_increment); // Decrement speed but don't go below 0
  }

  private increaseUpdateRate(): void {
    this.updateRate += 100;
  }

  private decreaseUpdateRate(): void {
    this.updateRate -= 100;
  }

  private stepForward(): void {
    // only move the main panorama
    this.movePanoramaId(this.speed, 0);
    this.mapView.setCenter(this.panoramas[0].getPosition());
  }

  private stepBackward(): void {
    // only move the main panorama
    this.movePanoramaId(-this.speed, 0);
    this.mapView.setCenter(this.panoramas[0].getPosition());
  }

  private reset(): void {
    this.speed = 0;
    if (this.autoMove) {
      this.toggleAutoMove();
    }
    if (this.autoRotate) {
      this.toggleAutoRotate();
    }
  }

  private toggleAutoMove(): void {
    const pano0 = document.getElementById('pano0');
    const pano1 = document.getElementById('pano1');
    const pano2 = document.getElementById('pano2');
    if (this.autoMove) {
      clearInterval(this.autoMoveInterval);
      this.autoMove = false;
      this.autoMoveFirstRun = true;
      // Move all passive panoramas back in sync
      this.panoramas[1].setPosition(this.panoramas[0].getPosition());
      this.panoramas[2].setPosition(this.panoramas[0].getPosition());

      pano0.style.zIndex = "2";
      pano1.style.zIndex = "1";
      pano2.style.zIndex = "1";
      this.updateStatus();
    }
    else {
      this.autoMove = true;
      let activeIndex = 0; // Start with the first panorama

      this.autoMoveInterval = window.setInterval(() => {
        if (this.autoMoveFirstRun) {
          // set up panos at their position
          this.movePanoramaId(this.speed, 1);
          this.movePanoramaId(this.speed * 2, 2);
          this.autoMoveFirstRun = false;
        }
        else {

          const nextIndex = (activeIndex + 1) % this.panoramas.length;

          // Update z-index for all panoramas
          pano0.style.zIndex = "1";
          pano1.style.zIndex = "1";
          pano2.style.zIndex = "1";


          switch (nextIndex) {
            case 0:
              pano0.style.zIndex = "2";
              this.panoramas[0].setZoom(this.panoramas[2].getZoom());
              this.panoramas[1].setZoom(this.panoramas[2].getZoom());
              if (isMobileDevice()) {
                this.panoramas[0].setPov(this.panoramas[2].getPov());
                this.panoramas[1].setPov(this.panoramas[2].getPov());
              }
              break;
            case 1:
              pano1.style.zIndex = "2";
              this.panoramas[1].setZoom(this.panoramas[0].getZoom());
              this.panoramas[2].setZoom(this.panoramas[0].getZoom());
              if (isMobileDevice()) {
                this.panoramas[1].setPov(this.panoramas[0].getPov());
                this.panoramas[2].setPov(this.panoramas[0].getPov());
              }
              break;
            case 2:
              pano2.style.zIndex = "2";
              this.panoramas[2].setZoom(this.panoramas[1].getZoom());
              this.panoramas[0].setZoom(this.panoramas[1].getZoom());
              if (!isMobileDevice()) {
                this.panoramas[2].setPov(this.panoramas[1].getPov());
                this.panoramas[2].setPov(this.panoramas[1].getPov());
              }
              break;
              break;
          }
          ;
          // Move the last panorama ahead
          if (activeIndex == 0) {
            this.movePanoramaId(this.speed * (this.panoramas.length), activeIndex);
          }
          else {
            this.movePanoramaId(this.speed * (activeIndex), activeIndex);
          }
          // Optionally, adjust the view or perform other actions
          this.mapView.setCenter(this.panoramas[0].getPosition());

          activeIndex = nextIndex; // Update the active panorama index for the next cycle

        }

      }, this.updateRate);

    }
  }


   reInitPosition(newPos){
         this.reset();
          // only reset main panorama
          this.panoramas[0].setPosition(newPos);
      
          // Optionally, update the map's center if you have a mini-map showing the current panorama's location
          if (this.mapView) {
              this.mapView.setCenter(newPos);
          }
  }
  private toggleAutoRotate(): void {

    if (this.autoRotate) {
      clearInterval(this.autoRotateInterval);
      this.autoRotate = false;
    } else {
      this.autoRotate = true;
      let heading = 0;
      let direction = 1;
      this.autoRotateInterval = window.setInterval(() => {
        heading += 0.25 * direction;
        if (heading >= 90 || heading <= -90) {
          direction *= -1;
        }
        this.panoramas.forEach(panorama => {
          panorama.setPov({ heading: heading, pitch: 0 });
        })
      }, 10);
    }
  }

  


}


function showToast(message: string, duration = 2000) {
  // Create the toast container if it doesn't exist
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  // Create the toast message
  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.textContent = message;

  // Add the toast message to the container
  container.appendChild(toast);

  // Make the toast visible
  setTimeout(() => {
    toast.style.opacity = '1';
  }, 100);

  // Remove the toast after a specified duration
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.addEventListener('transitionend', () => toast.remove());
  }, duration);
}

window.initialize = function () {
  adjustForMobile();
  // Retrieve the last position when the page loads
 
  let startPosition = { lat: 63.0001441, lng: 7.2871579 };
  const savedPosition = getCookie('lastPosition');
  if (savedPosition) {

      const regex = /-?\d+(\.\d+)?/g;
      const matches = savedPosition.match(regex);

      if (matches) {
        // Convert matched strings to numbers
        const numbers = matches.map(Number);

        // If you need them as separate variables
        const [x, y] = numbers;
        startPosition.lat = x;
        startPosition.lng = y;
    }
   
  }


  const map = new google.maps.Map(
    document.getElementById("map") as HTMLElement,
    {
      center: startPosition,
      zoom: 14,
      disableDefaultUI: true,
      streetViewControl: true,
      clickableIcons: false,
      keyboardShortcuts: false,
    }
  );


  
  const panoramaConfigs = [
    { elementId: 'pano0', initialPosition: startPosition, initialPov: { heading: 0, pitch: 0 } },
    { elementId: 'pano1', initialPosition: startPosition, initialPov: { heading: 0, pitch: 0 } },
    { elementId: 'pano2', initialPosition: startPosition, initialPov: { heading: 0, pitch: 0 } }
  ];

  const myPanoramaController = new PanoramaController(panoramaConfigs, map);


  function findPanorama(): void {
    const place = (document.getElementById("placeInput") as HTMLInputElement).value;
    const geocoder = new google.maps.Geocoder();
  
    geocoder.geocode({ address: place }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results[0]) {
            const newPos = results[0].geometry.location;
            
           myPanoramaController.reInitPosition(newPos); 
        } else {
            console.error("Geocode was not successful for the following reason: " + status);
            // Show toast message if geocoding fails
            showToast("Geocode was not successful. Please try a different location.");
        }
    });
  }
  document.getElementById("findPanoramaBtn").addEventListener("click", findPanorama);
  
}

function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function adjustForMobile(): void {
  // Regex to test for mobile user agents
  if (isMobileDevice()) {
    const buttons = document.querySelectorAll('.action-btn');
    buttons.forEach(button => {
      // TypeScript knows `button` is an Element, which doesn't directly have `style` property,
      // so we assert it's an HTMLElement, which does have `style`.
      (button as HTMLElement).style.padding = '15px 15px';
      (button as HTMLElement).style.fontSize = '40px';
      (button as HTMLElement).style.marginBottom = '10px';
    });

    // Use querySelector for single element selection and cast correctly
    const uiButton = document.querySelector('#uiToggleBtn') as HTMLElement;
    uiButton.style.fontSize = '40px';

    const placeInput = document.querySelector('#placeInput') as HTMLElement;
    const findPanoramaBtn = document.querySelector('#findPanoramaBtn') as HTMLElement;

    // Adjust styles for the text input
    placeInput.style.padding = '12px';
    placeInput.style.fontSize = '20px'; // Adjusted for visibility on mobile
    placeInput.style.marginBottom = '10px';

    // Adjust styles for the button
    findPanoramaBtn.style.padding = '15px 0'; // Padding top and bottom, 0 left and right
    findPanoramaBtn.style.fontSize = '20px'; // Adjusted for visibility on mobile
    findPanoramaBtn.style.marginBottom = '10px';
  }
}

function setCookie(name, value, days) {
  let expires = "";
  if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days*24*60*60*1000));
      expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i=0;i < ca.length;i++) {
      let c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1,c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
}


function loadGoogleMapsScript() {
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&callback=initialize`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

document.addEventListener('DOMContentLoaded', loadGoogleMapsScript);
declare global {
  interface Window {
    initialize: () => void;
  }
}

export { };
