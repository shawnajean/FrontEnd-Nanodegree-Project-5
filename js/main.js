var initialLocales = [
  {
    name: 'Bilmore Estate',
    address: '1 Lodge St',
    city: 'Asheville',
    website: 'http://www.biltmore.com',
    lat: 35.540579,
    long: -82.552318
  },{
    name: "Odd's Cafe",
    address: '800 Haywood Rd',
    city: 'Asheville',
    website: 'http://www.oddscafe.com',
    lat: 35.578931,
    long: -82.595296
  },{
    name: 'Basilica of Saint Lawrence',
    address: '97 Haywood St',
    city: 'Asheville',
    website: 'http://www.saintlawrencebasilica.org',
    lat: 35.597606,
    long: -82.556297
  },{
    name: 'WNC Nature Center',
    address: '75 Gashes Creek Rd',
    city: 'Asheville',
    website: 'http://www.wncnaturecenter.com',
    lat: 35.576324,
    long: -82.496252
  },{
    name: 'Green Man',
    address: '23 Buxton Ave',
    city: 'Asheville',
    website: 'http://www.greenmanbrewery.com',
    lat: 35.588918,
    long: -82.553139
  }
];

var locale = function( data ) {
  this.name = ko.observable(data.name);
  this.address = ko.observable(data.address);
  this.city = ko.observable(data.city);
  this.website = ko.observable(data.website);
  this.lat = ko.observable(data.lat);
  this.long = ko.observable(data.long);

  this.latlong = ko.computed( function() {
    return new google.maps.LatLng( this.lat(), this.long() );
  }, this);

  this.photos = ko.observableArray([]);
  this.review = ko.observable('');
};

var flickrKey = "&api_key=36733d31ced0a6a0512c8c1768e63ec7";
var flickrGetImgsURL = "https://api.flickr.com/services/rest/?format=json&method=flickr.photos.search&content_type=1&sort=date-taken-desc&nojsoncallback=1&text=";
var flickrImgInfoURL = "https://api.flickr.com/services/rest/?format=json&method=flickr.photos.getInfo&nojsoncallback=1&photo_id=";
var flickrImg = "http://www.flickr.com/photos/";

var wikiURL = 'http://en.wikiapedia.org/w/api.php?action=opensearch&format=json&callback=wikiCallback&search=';

var ViewModel = function() {
  var self = this;
  var flickrImgsAPIURL,
      flickrImgInfoAPIURL,
      imageList,
      currentImage,
      newImgURL,
      newAttributionURL,
      newTitle,
      newCaption;

  this.initialize = function() {
    // Creates array of locales
    self.locales = ko.observableArray([]);

    initialLocales.forEach( function( newLoc ) {
      self.locales.push( new locale( newLoc ) );
    });

    // Get API info for each locale
    this.locales().forEach( function( locale ){
      //self.getImages( locale );
    });

      //Creates map
      initializeMap();

      // Adds each locale as a marker on the map
      this.locales().forEach( function( locale ) {
        addMarker( locale );
      });
  }

  // Get Flickr images for specified locale
  this.getImages = function( locale ) {
    flickrImgsAPIURL = flickrGetImgsURL + '"' + locale.name() + '" ' + locale.city() + flickrKey;

    $.getJSON( flickrImgsAPIURL, function( data ) {
      console.log( 'success' );

      imageList = data.photos.photo;

      if( imageList.length > 0 ){
        for( var i = 0; i < 4; i ++){
          currentImage = imageList[i];

          newImgURL = 'http://farm' + currentImage.farm + '.static.flickr.com/' + currentImage.server + '/' + currentImage.id + '_' + currentImage.secret + '_m.jpg';

          newAttributionURL = flickrImg + currentImage.owner + "/" + currentImage.id;

          // get title & caption info for image
          flickrImgInfoAPIURL = flickrImgInfoURL + currentImage.id + flickrKey;

          $.getJSON( flickrImgInfoAPIURL, function( data ){
            newTitle = data.photo.title._content;
            newCaption = data.photo.description._content;
          }).fail( function( data, textStatus, error ) {
            console.log( data );
            console.error("getJSON failed, status: " + textStatus + ", error: "+error)
          });

          // add new image to the
          locale.photos.push({
            title: newTitle,
            caption: newCaption,
            imgURL: newImgURL,
            attributionURL: newAttributionURL
          });
        }
      }
    }).fail( function( data, textStatus, error ) {
      console.log( data );
      console.error("getJSON failed, status: " + textStatus + ", error: "+error)
    });

    //this console.log is running before the JSON calls are finishing. not sure how to fix that. :/ Gonna skip it and move on to loading other API info for the infoWindow.
    console.log( locale.photos() );
  };

  this.initialize();
};

ko.applyBindings( new ViewModel() );
