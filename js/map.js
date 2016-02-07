var map, contentString, infoWindow;
var bounds = new google.maps.LatLngBounds();

var initializeMap = function() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 35.6008333, lng: -82.5541667}, // Asheville, NC
    zoom: 12
  });
}

var addMarker = function( locale ) {
  // String of content to appear in the infoWindow
  contentString = "testing" + locale.name();

  infoWindow = new google.maps.InfoWindow({
    content: contentString
  });

  marker = new google.maps.Marker({
    position: locale.latlong(),
    map: map,
    title: locale.name()
  });

  // Opens the infoWindow when marker is clicked on
  marker.addListener('click', (function( infoWindow, marker ) {
    return function() {
      infoWindow.open(map, marker);
    }
  })( infoWindow, marker ));

  // this is where the pin actually gets added to the map.
  // bounds.extend() takes in a map location object
  bounds.extend( locale.latlong() );

  // fit the map to the new marker
  map.fitBounds(bounds);
  // center the map
  map.setCenter(bounds.getCenter());
};

// Vanilla JS way to listen for resizing of the window
// and adjust map bounds
window.addEventListener('resize', function(e) {
  // Make sure the map bounds get updated on page resize
  map.fitBounds(bounds);
});
