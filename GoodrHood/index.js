var express = require('express');
var bodyParser = require('body-parser');
var db = require('./models');
var request = require('request');
var methodOverride = require('method-override');
var ejsLayouts = require('express-ejs-layouts');
var session = require('express-session');
var flash = require('connect-flash');
var Zillow  = require('node-zillow')
var zwsid = process.env.ZILLOW_KEY
var zillow = new Zillow(zwsid)
var app = express();
var instagram = require('instagram-node').instagram();
var client_id = process.env.CLIENT_ID
var client_secret = process.env.CLIENT_SECRET
var access_token = process.env.ACCESS_TOKEN


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'))
app.use(express.static(__dirname + '/public'));
app.use(ejsLayouts);
app.use(session({
  secret:"o12i3qwreaq3roj4t5haw4",
  resave: false,
  saveUninitialized: true
}));
app.use(flash());
instagram.use({
  access_token: access_token
});
// instagram.use({
//   client_id: client_id,
//   client_secret: client_secret
// });

app.get("/signup", function(req,res){
  // TODO: ENTER CODE HERE
  res.render('main/signup');
});

app.post("/signup", function(req, res){
    // TODO: ENTER CODE HERE
})

app.get("/login", function(req,res){
    // TODO: ENTER CODE HERE
    res.render('main/login');
});

app.get("/favorites", function(req,res){
    // TODO: ENTER CODE HERE
    res.render('main/favorites');
})

app.get("/", function(req, res) {

var params = {
  address: "106 NW 42nd St",
  citystatezip: "Seattle, WA 98107"
  // city: 'Seattle',
  // state: 'WA',
  // zip: '98107'
};

// var zip = req.body.zip_code


var zpid = zillow.callApi('GetSearchResults', params)
  .then(function(result){
    var id = result.response[0].results[0].result[0].zpid[0]

    var parameters = {
      zpid: parseInt(id)
    };
    //var zpid = parseInt(id)
  zillow.callApi('GetUpdatedPropertyDetails', parameters)
      .then(function(data) {
        var results = data.response
        console.log(results)
      })
    });

// zillow.getDemographics({zip: '98107'})
//   .then(function(data) {
//     //LATITUDE
//     //var results = data.response[0].region[0].latitude[0]
//     //LONGITUDE
//     //var results = data.response[0].region[0].longitude[0]


//     console.log(results);
//   })

res.render('main/index')
});






// app.get("/:id/results", function(req, res){
//   // TODO: ENTER CODE HERE
//   res.render('main/results')
// });





var redirect_uri = 'http://localhost';

// exports.authorize_user = function(req, res) {
//   res.redirect(instagram.get_authorization_url(redirect_uri, { scope: ['likes'], state: 'washington' }));
// };

// exports.handleauth = function(req, res) {
//   instagram.authorize_user(req.query.code, redirect_uri, function(err, result) {
//     if (err) {
//       console.log(err.body);
//       res.send("Didn't work");
//     } else {
//       console.log('Yay! Access token is ' + result.access_token);
//       res.send('You made it!!');
//     }
//   });
// };

// This is where you would initially send users to authorize
// app.get('/authorize_user', exports.authorize_user);
// This is your redirect URI
// app.get('/handleauth', exports.handleauth);

// http.createServer(app).listen(app.get('port'), function(){
//   console.log("Express server listening on port " + app.get('port'));
// });


// Instagram api call for /main/results
app.get('/main/results',function(req, res){
//   res.render('main/results');
// });
instagram.location_search({ lat: 48.565464564, lng: 2.34656589 }, function(err, result) {
    if (err) {
      console.log(err);
    } else {
       var id = result[0].id
        instagram.location_media_recent(id, function(err, result){
          if (err) {
            console.log(err);
          } else {
            res.send(result);
            console.log(result);
          }
        // res.send(result);
            console.log(result);
          });
      }
})
})


app.listen(3000)