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

  this.images = ko.observableArray([]);
  this.articles = ko.observableArray([]);
  this.foursquare = ko.observable({});
};

// Variable definitions for API calls
// Flickr
var flickrKey = "&api_key=36733d31ced0a6a0512c8c1768e63ec7";
var flickrGetImgsURL = "https://api.flickr.com/services/rest/?format=json&method=flickr.photos.search&content_type=1&sort=date-taken-desc&nojsoncallback=1&text=";
var flickrImgInfoURL = "https://api.flickr.com/services/rest/?format=json&method=flickr.photos.getInfo&nojsoncallback=1&photo_id=";
var flickrImg = "http://www.flickr.com/photos/";

// Wikipedia
var wikiURL = 'http://en.wikipedia.org/w/api.php?action=opensearch&format=json&callback=wikiCallback&search=';

// Foursquare
var fsURL = 'https://api.foursquare.com/v2/venues/search?client_id=2IH1WTOFRXTI4TKYONASQSZO4AZVZBD5VSA0YG0R1GA0M4Z1&client_secret=PJGTUYGXQCZEJKGISLVAQWRTEJBGGIBNW5IUIFGFMQB2ZA1S&limit=1&intent=match&v=20140806&m=foursquare&query=';

var ViewModel = function() {
  var self = this;
  var APIURL,
      flickrImgInfoAPIURL,
      currentList,
      currentItem,
      newImgURL,
      newAttributionURL,
      newTitle,
      newCaption,
      headlines,
      links,
      i;

  // Initializes the app
  this.initialize = function() {
    // Creates array of locales
    self.locales = ko.observableArray([]);

    initialLocales.forEach( function( newLoc ) {
      self.locales.push( new locale( newLoc ) );
    });

    // Get API info for each locale
    this.locales().forEach( function( locale ){
      self.getImages( locale );
      self.getWikiArticles( locale );
      self.getFourSquare( locale );
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
    APIURL = flickrGetImgsURL + '"' + locale.name() + '" ' + locale.city() + flickrKey;

    self.callFlickrAPI( locale );
  };

  // Calls the Flickr flickr.photos.search API for the array of images
  // Hands the array off to the parseImages function
  this.callFlickrAPI = function( locale ) {
    $.getJSON( APIURL, function( data ) {
      self.parseImages( data, locale );
    }).fail( function( data, textStatus, error ) {
      console.log( data );
      console.error("getJSON failed, status: " + textStatus + ", error: "+error)
    });
  };

  // Calls the Flickr flickr.photos.getInfo API for image title & caption
  // Hands the new data off to addImage
  this.callFlickrImgAPI = function( locale ) {
    $.getJSON( flickrImgInfoAPIURL, function( data ){
        self.addImage( data, locale );
    }).fail( function( data, textStatus, error ) {
      console.log( data );
      console.error("getJSON failed, status: " + textStatus + ", error: "+error)
    });
  };

  // Filters through array of images to find 4 for the infoWindow
  // Sets the newImgURL & newAttributionURL for the image
  // Calls the Flickr flickr.photos.getInfo API for title & caption info
  this.parseImages = function( data, locale ) {
    if( data.photos !== null ) {
      currentList = data.photos.photo;

      // Once the list has been retrieved go through the first 4 images and add to locale
      for( i = 0; i < 4 && i < currentList.length; i ++){
        // reset all imageItem variables
        currentItem, newImgURL, newAttributionURL, newTitle, newCaption = '';

        currentItem = currentList[i];

        newImgURL = 'http://farm' + currentItem.farm + '.static.flickr.com/' + currentItem.server + '/' + currentItem.id + '_' + currentItem.secret + '_m.jpg';

        newAttributionURL = flickrImg + currentItem.owner + "/" + currentItem.id;

        // get title & caption info for image
        flickrImgInfoAPIURL = flickrImgInfoURL + currentItem.id + flickrKey;

        self.callFlickrImgAPI( locale );
      }
    }
  };

  // Sets the newTitle & newCaption from data passed in
  // Adds the image to the specified locale
  this.addImage = function( data, locale ) {
    if( data.photo !== null ) {
      newTitle = data.photo.title._content;
      newCaption = data.photo.description._content;

      // Saves the image to the locale for later use
      locale.images.push({
        title: newTitle,
        caption: newCaption,
        imgURL: newImgURL,
        attributionURL: newAttributionURL
      });
    }
  }

  // Gets related Wikipedia articles based on locale name
  this.getWikiArticles = function( locale ) {
    APIURL = wikiURL + locale.name();

    var wikiError = function() {
      console.log( 'wiki error' );
    }

    var wikiRequestTimeout = setTimeout( wikiError, 8000 );

    $.ajax({
      url: APIURL,
      dataType: "jsonp"
    }).done(function( response ) {

      headlines = response[1];
      links = response[3];

      // Saves the articles to the locale for later use
      headlines.forEach( function( article, index ) {
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

  // Gets Foursquare data associated with locale
  this.getFourSquare = function( locale ) {
    APIURL = fsURL + locale.name() + '&ll=' + locale.lat() + ',' + locale.long();

    $.getJSON( APIURL, function( data ){
      currentList = data.response.venues;

      if( currentList.length > 0 ){
        currentItem = currentList[0];

        // Saves the data to the locale for later use
        locale.foursquare({
          name: currentItem.name,
          id: currentItem.id,
          verified: currentItem.verified,
          stats: currentItem.stats,
          categories: currentItem.categories
        });
      }
    }).fail( function( data, textStatus, error ) {
      console.log( data.responseText );
      console.error("getJSON failed, status: " + textStatus + ", error: "+error)
    });
  };

  this.initialize();
};

ko.applyBindings( new ViewModel() );
