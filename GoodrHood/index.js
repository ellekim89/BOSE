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


    res.render("main/index")

// ELLE'S ZILLOW NOTES!
//   var params = {
//   address: "106 NW 42nd St",
//   city: 'Seattle',
//   state: 'WA',
//   zip: '98107'
// }


//  var parameters = {
//     zpid: 48998252
//   };
//   //getting images ect.
//   zillow.callApi('GetUpdatedPropertyDetails', parameters)
//     .then(function(data) {
//       //var results = data.response[0].results[0].result[0]
//      console.log(data.response[0])
//      });

// app.get("/", function(req, res) {
//   var parameters = {
//     zpid: 48998252
//   };
//   //getting images ect.
//   zillow.callApi('GetUpdatedPropertyDetails', parameters)
//     .then(function(data) {
//       //var results = data.response[0].results[0].result[0]
//      console.log(data.response[0])
//     })
// });


// getting zpid
// getDeepSearchResults() returns zpid, which is passed into getUpdatedPropertyDetails()
// zillow.getDeepSearchResults(params)
//     .then(function(result) {
//       var zpid = result.response[0].results[0].result[0].zpid[0]
//       //console.log(result.response[0].results[0].result[0].zestimate[0])
//       console.log(zillow.getUpdatedPropertyDetails(zpid))
//     })
//     .then(function(result) {
//       if (result.message[0].code === '502') return {}
//       console.log(result.response[0])
//     })

});


app.get("/:id/results", function(req, res){
  // TODO: ENTER CODE HERE
  res.render('main/results')
});



app.listen(3000)