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

var flickrKey = "&api_key=36733d31ced0a6a0512c8c1768e63ec7";
var flickrGetImgsURL = "https://api.flickr.com/services/rest/?format=json&method=flickr.photos.search&content_type=1&sort=date-taken-desc&nojsoncallback=1&text=";
var flickrImgInfoURL = "https://api.flickr.com/services/rest/?format=json&method=flickr.photos.getInfo&nojsoncallback=1&photo_id=";
var flickrImg = "http://www.flickr.com/photos/";

var wikiURL = 'http://en.wikipedia.org/w/api.php?action=opensearch&format=json&callback=wikiCallback&search=';

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

    self.callFlickrAPI( self.parseImages, locale );
  };

  this.callFlickrAPI = function( callback, locale ) {
    $.getJSON( APIURL, function( data ) {
      callback(data, locale);
    }).fail( function( data, textStatus, error ) {
      console.log( data );
      console.error("getJSON failed, status: " + textStatus + ", error: "+error)
    });
  };

  this.callFlickrImgAPI = function( callback, locale ) {
    $.getJSON( flickrImgInfoAPIURL, function( data ){
        callback( data, locale );
    }).fail( function( data, textStatus, error ) {
      console.log( data );
      console.error("getJSON failed, status: " + textStatus + ", error: "+error)
    }).done( function() {
      console.log( 'Loaded image data: ' + locale.name() );
    });
  };

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

        self.callFlickrImgAPI( self.addImage, locale );
      }
    }
  };

  this.addImage = function( data, locale ) {
    if( data.photo !== null ) {
      newTitle = data.photo.title._content;
      newCaption = data.photo.description._content;

      // add new image to the locale
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
    }).done( function() {
      // console.log( 'Loaded articles: ' + locale.name() );
    });
  };

  this.getFourSquare = function( locale ) {
    APIURL = fsURL + locale.name() + '&ll=' + locale.lat() + ',' + locale.long();

    $.getJSON( APIURL, function( data ){
      currentList = data.response.venues;

      if( currentList.length > 0 ){
        currentItem = currentList[0];

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
    }).done(function() {
      // console.log( 'Loaded FS: ' + locale.name() );
    });

  };

  this.initialize();
};

ko.applyBindings( new ViewModel() );
