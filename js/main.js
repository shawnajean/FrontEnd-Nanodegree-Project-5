var initialLocales = [
  {
    name: 'Biltmore Estate',
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
    name: 'Western North Carolina Nature Center',
    address: '75 Gashes Creek Rd',
    city: 'Asheville',
    website: 'http://www.wncnaturecenter.com',
    lat: 35.576324,
    long: -82.496252
  },{
    name: 'Green Man Brewery',
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
  this.articles = ko.observableArray([]);
};

var flickrKey = "&api_key=36733d31ced0a6a0512c8c1768e63ec7";
var flickrGetImgsURL = "https://api.flickr.com/services/rest/?format=json&method=flickr.photos.search&content_type=1&sort=date-taken-desc&nojsoncallback=1&text=";
var flickrImgInfoURL = "https://api.flickr.com/services/rest/?format=json&method=flickr.photos.getInfo&nojsoncallback=1&photo_id=";
var flickrImg = "http://www.flickr.com/photos/";

var wikiURL = 'http://en.wikipedia.org/w/api.php?action=opensearch&format=json&callback=wikiCallback&search=';

var ViewModel = function() {
  var self = this;
  var flickrImgsAPIURL,
      flickrImgInfoAPIURL,
      wikiAPIURL,
      currentList,
      currentItem,
      newImgURL,
      newAttributionURL,
      newTitle,
      newCaption,
      headlines,
      links;

  this.initialize = function() {
    // Creates array of locales
    self.locales = ko.observableArray([]);

    initialLocales.forEach( function( newLoc ) {
      self.locales.push( new locale( newLoc ) );
    });

    // Get API info for each locale
    this.locales().forEach( function( locale ){
      //self.getImages( locale );
      self.getWikiArticles( locale );
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

      currentList = data.photos.photo;

      if( imageList.length > 0 ){
        // need to modify this - what if there are 2 images?
        for( var i = 0; i < 4; i ++){
          currentImage = currentList[i];

          newImgURL = 'http://farm' + currentItem.farm + '.static.flickr.com/' + currentItem.server + '/' + currentItem.id + '_' + currentItem.secret + '_m.jpg';

          newAttributionURL = flickrImg + currentItem.owner + "/" + currentItem.id;

          // get title & caption info for image
          flickrImgInfoAPIURL = flickrImgInfoURL + currentItem.id + flickrKey;

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
  };

  // Gets related Wikipedia articles based on locale name
  this.getWikiArticles = function( locale ) {
    wikiAPIURL = wikiURL + locale.name();

    var wikiError = function() {
      console.log( 'wiki error' );
    }

    var wikiRequestTimeout = setTimeout( wikiError, 8000 );

    $.ajax({
      url: wikiAPIURL,
      dataType: "jsonp"
    }).done(function( response ) {
      currentList = response[1];

      headlines = response[1];
      links = response[3];

      currentList.forEach( function( article, index ) {
        locale.articles.push({
          title: headlines[index],
          link: links[index]
        });
      });

      clearTimeout(wikiRequestTimeout);
    }).fail(function( e ) {
      console.log( 'fail' );
      console.log( e );
    });
  };

  this.initialize();
};

ko.applyBindings( new ViewModel() );
