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
    name: 'Mt Mitchell',
    address: '2388 State Highway 128',
    city: 'Burnsville',
    website: 'http://www.ncparks.gov/mount-mitchell-state-park',
    lat: 35.761977,
    long: -82.271888
  }
];

var locale = function( data ) {
  this.name = ko.observable(data.name);
  this.address = ko.observable(data.address);
  this.city = ko.observable(data.city);
  this.website = ko.observable(data.website);
  this.lat = ko.observable(data.lat);
  this.long = ko.observable(data.long);
};

var ViewModel = function() {
  var self = this;

  this.locales = ko.observableArray([]);

  initialLocales.forEach( function( newLoc ) {
    self.locales.push( new locale( newLoc ) );
  });

  console.log( this.locales() );
};

ko.applyBindings( new ViewModel() );
