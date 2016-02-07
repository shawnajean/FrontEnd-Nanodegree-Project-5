var map;

var initMap = function() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 35.6008333, lng: -82.5541667}, // Asheville, NC
    zoom: 12
  });
}

window.addEventListener('load', function() {
  google.load("maps", "3", {
    callback: initMap
  });
});
