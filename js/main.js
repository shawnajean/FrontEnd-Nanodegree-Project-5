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

/******************************************************************************************/
/*      CONSTANTS
/******************************************************************************************/

// Variable definitions for API calls
// Flickr
var FLICKR_KEY = "&api_key=36733d31ced0a6a0512c8c1768e63ec7";
var FLICKR_IMGS_URL = "https://api.flickr.com/services/rest/?format=json&method=flickr.photos.search&content_type=1&sort=date-taken-desc&nojsoncallback=1&text=";
var FLICKR_IMG_INFO_URL = "https://api.flickr.com/services/rest/?format=json&method=flickr.photos.getInfo&nojsoncallback=1&photo_id=";
var FLICKR_IMG = "http://www.flickr.com/photos/";

// Wikipedia
var WIKI_URL = 'http://en.wikipedia.org/w/api.php?action=opensearch&format=json&callback=wikiCallback&search=';

// Foursquare
var FS_URL = 'https://api.foursquare.com/v2/venues/search?client_id=2IH1WTOFRXTI4TKYONASQSZO4AZVZBD5VSA0YG0R1GA0M4Z1&client_secret=PJGTUYGXQCZEJKGISLVAQWRTEJBGGIBNW5IUIFGFMQB2ZA1S&limit=1&intent=match&v=20140806&m=foursquare&query=';
var FS_VENUE = 'https://foursquare.com/v/';
var FS_IMAGE = 'https://playfoursquare.s3.amazonaws.com/press/2014/foursquare-icon-16x16.png';

// HTML for the infoWindow that pops up when a locale is clicked on
var INFO_TEXT =  '<div data-bind="with: currentLocale" id="info-window">'+
                  '<h1 data-bind="text: name" id="iw-title"></h1>'+
                  '<div id="bodyContent">'+
                    '<p><span data-bind="text: address"></span><br><span data-bind="text: city"></span>, NC</p>' +
                    '<a data-bind="text: website, attr: {href: website}" href=""></a>' +
                    '<div data-bind="visible: images().length > 0, foreach: images" id="iw-images">' +
                      '<a data-bind="attr: {href: attributionURL}" href=""><img data-bind="attr: {src: imgURL, title: title}" src="" title=""></a>' +
                    '</div>' +
                    '<div data-bind="if: foursquare() " id="foursquare">' +
                      '<h3>Foursquare Stats</h3>' +
                      '<a data-bind="attr: {href: foursquare().fsURL}" href=""><img alt="Check in on Foursquare!" src="' + FS_IMAGE + '"></a>' +
                    '</div>' +
                    '<h3 data-bind="visible: articles().length > 0">Related Articles</h3>' +
                    '<ul data-bind="foreach: articles">' +
                      '<li><a data-bind="text: title, attr: {href: link}" href=""></a></li>' +
                    '</ul>' +
                  '</div>'+
                '</div>';


/******************************************************************************************/
/*      VIEW MODEL
/******************************************************************************************/

var ViewModel = function() {
/******************************************************************************************/
/*      VARIABLES
/******************************************************************************************/

  var self = this;
  var APIURL,
      map,
      infoWindow,
      marker,
      flickrImgInfoAPIURL,
      currentList,
      currentItem,
      tempString,
      newImgURL,
      newAttributionURL,
      newTitle,
      newCaption,
      headlines,
      links,
      defer,
      i;

  var bounds = new google.maps.LatLngBounds();

  this.currentLocale = ko.observable('');

/******************************************************************************************/
/*      FUNCTIONS
/******************************************************************************************/

  // Initializes the app
  this.initialize = function() {
    // Creates array of locales
    this.locales = ko.observableArray([]);

    initialLocales.forEach( function( newLoc ) {
      self.locales.push( new locale( newLoc ) );
    });

    self.setCurrentLocale( self.locales()[0] );

    // Get API info for each locale
    self.locales().forEach( function( locale ){
      self.getImages( locale );
      self.getWikiArticles( locale );
      self.getFourSquare( locale );
    });

      //Creates map
      initializeMap();

      // Adds each locale as a marker on the map
      this.locales().forEach( function( locale ) {
        addMarker( locale, self );
      });
  }

  this.setCurrentLocale = function( locale ) {
    var defer = $.Deferred();

    self.currentLocale( locale );

    defer.resolve();

    return defer;
  };

  this.getCurrentLocale = function( locale ) {
    return self.currentLocale;
  }

/******************************************************************************************/
/*      API HANDLERS
/******************************************************************************************/

  // Get Flickr images for specified locale
  this.getImages = function( locale ) {
    APIURL = FLICKR_IMGS_URL + '"' + locale.name() + '" ' + locale.city() + FLICKR_KEY;

    self.callFlickrAPI( locale );
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
        // currentItem, newImgURL, newAttributionURL, newTitle, newCaption = '';

        currentItem = currentList[i];

        var newImgURL = 'http://farm' + currentItem.farm + '.static.flickr.com/' + currentItem.server + '/' + currentItem.id + '_' + currentItem.secret + '_m.jpg';

        var newAttributionURL = FLICKR_IMG + currentItem.owner + "/" + currentItem.id;

        // get title & caption info for image
        flickrImgInfoAPIURL = FLICKR_IMG_INFO_URL + currentItem.id + FLICKR_KEY;

        self.callFlickrImgAPI( locale, newImgURL, newAttributionURL );
      }
    }
  };

  // Sets the newTitle & newCaption from data passed in
  // Adds the image to the specified locale
  this.addImage = function( data, locale, newImgURL, newAttributionURL ) {
    if( data.photo !== null ) {
      var newTitle = data.photo.title._content;
      var newCaption = data.photo.description._content;

      // Saves the image to the locale for later use
      locale.images.push({
        title: newTitle,
        caption: newCaption,
        imgURL: newImgURL,
        attributionURL: newAttributionURL
      });
    }
  }

/******************************************************************************************/
/*      API CALLS
/******************************************************************************************/

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
  this.callFlickrImgAPI = function( locale, newImgURL, newAttributionURL ) {
    $.getJSON( flickrImgInfoAPIURL, function( data ){
        self.addImage( data, locale, newImgURL, newAttributionURL );
    }).fail( function( data, textStatus, error ) {
      console.log( data );
      console.error("getJSON failed, status: " + textStatus + ", error: "+error)
    });
  };

  // Gets related Wikipedia articles based on locale name
  this.getWikiArticles = function( locale ) {
    APIURL = WIKI_URL + locale.name();

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
    APIURL = FS_URL + locale.name() + '&ll=' + locale.lat() + ',' + locale.long();

    $.getJSON( APIURL, function( data ){
      currentList = data.response.venues;

      if( currentList.length > 0 ){
        currentItem = currentList[0];

        // Saves the data to the locale for later use
        locale.foursquare({
          name: currentItem.name,
          id: currentItem.id,
          verified: currentItem.verified,
          rating: currentItem.rating,
          fsURL: FS_VENUE + currentItem.name.replace(/ /g,"-") + "/" + currentItem.id
        });
      } else {
        locale.foursquare(null);
      }
    }).fail( function( data, textStatus, error ) {
      console.log( data.responseText );
      console.error("getJSON failed, status: " + textStatus + ", error: "+error)
    });
  };

/******************************************************************************************/
/*      MAP
/******************************************************************************************/

  var initializeMap = function() {
    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 35.6008333, lng: -82.5541667}, // Asheville, NC
      zoom: 12
    });
  };

  var addMarker = function( locale ) {

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
      var current = self.getCurrentLocale();

      self.setCurrentLocale( locale ).done( (function() {
        infoWindow.setContent( marker.content );
      })(marker));

      infoWindow.open( map, this );
    });

    ko.applyBindings( self, marker.content );

    // this is where the pin actually gets added to the map.
    // bounds.extend() takes in a map location object
    bounds.extend( locale.latlong() );

    // fit the map to the new marker
    map.fitBounds(bounds);
    // center the map
    map.setCenter(bounds.getCenter());
  };

  var makeContent = function() {
    tempString = $.parseHTML(INFO_TEXT)[0];
    return tempString;
  };
/******************************************************************************************/
/*
/******************************************************************************************/

  this.initialize();

  // Vanilla JS way to listen for resizing of the window
  // and adjust map bounds
  window.addEventListener('resize', function(e) {
    // Make sure the map bounds get updated on page resize
    map.fitBounds(bounds);
  });
};

ko.applyBindings( new ViewModel() );
