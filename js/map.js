var map, infoWindow, marker, html;
var bounds = new google.maps.LatLngBounds();

var initializeMap = function() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 35.6008333, lng: -82.5541667}, // Asheville, NC
    zoom: 12
  });
};

var makeContent = function() {
  html = $.parseHTML(infoText)[0];
  return html;
};

var addMarker = function( locale , viewModel ) {

  infoWindow = new google.maps.InfoWindow();

  marker = new google.maps.Marker({
    position: locale.latlong(),
    map: map,
    title: locale.name(),
    content: makeContent()
  });

  // Opens the infoWindow when marker is clicked on
  google.maps.event.addListener(marker, 'click', function( ) {
    console.log( locale.name() );
    var current = viewModel.getCurrentLocale();

    viewModel.setCurrentLocale( locale );
    console.log( current().name() );
    infoWindow.setContent( this.content );
    infoWindow.open( map, this );
  });

  ko.applyBindings( viewModel, marker.content)

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
