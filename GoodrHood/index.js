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
<<<<<<< HEAD
instagram.use({
  access_token: '190598825.2abce53.77ed7791dab7429880a63c2ec08218f8'
});
// instagram.use({
//   client_id: '2abce53e983e40ab88c6cc465ae221cf',
//   client_secret: 'd67c163621454349a4449625b745af33'
// });
=======
>>>>>>> 71adc35c65938c9b1dddc8d9cc9dee3f92f105cb

app.get("/signup", function(req,res){
  // TODO: ENTER CODE HERE
  res.render('main/signup');
});

app.post("/signup", function(req, res){
    // TODO: ENTER CODE HERE
})
<<<<<<< HEAD

=======
>>>>>>> 71adc35c65938c9b1dddc8d9cc9dee3f92f105cb
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
  address: req.body.address,
  citystatezip: "Seattle, WA " + req.body.zip_code
  // city: 'Seattle',
  // state: 'WA',
  // zip: '98107'
};


var zpid = zillow.callApi('GetSearchResults', params)
  .then(function(result){
    var id = result.response[0].results[0].result[0].zpid[0]

    var parameters = {
<<<<<<< HEAD
      zpid: parseInt(id)
    };
    //var zpid = parseInt(id)
  zillow.callApi('GetUpdatedPropertyDetails', parameters)
      .then(function(data) {
        var results = data.response

        //var zpid = data.response.zpid[0]
        //var latitude = data.response.address[0].latitude[0]
        //var longitude = data.response.address[0].longitude[0]
        // console.log(results)
        res.render("main/index", {results: results})
=======
  zpid: parseInt(id)
};
    var zpid = parseInt(id)
      zillow.callApi('GetUpdatedPropertyDetails', parameters)
        .then(function(data) {
          var results = data.response
        console.log(results)
>>>>>>> 71adc35c65938c9b1dddc8d9cc9dee3f92f105cb
      })
    });

<<<<<<< HEAD

});





=======
    console.log(id)
    })

  zillow.callApi('GetUpdatedPropertyDetails', zpid)
    .then(function(data) {
      //var results = data.response[0].results[0].result[0]
     console.log(data.response[0])
    })



zillow.GetSearchResults(params)
    .then(function(result) {
      var zpid = result
      //return zillow.getUpdatedPropertyDetails(zpid)

      console.log(zpid)
    })

console.log(deepResults)
>>>>>>> 71adc35c65938c9b1dddc8d9cc9dee3f92f105cb

// app.get("/:id/results", function(req, res){
//   // TODO: ENTER CODE HERE
//   res.render('main/results')
// });


<<<<<<< HEAD
=======
res.render("main/index")
>>>>>>> 71adc35c65938c9b1dddc8d9cc9dee3f92f105cb



<<<<<<< HEAD
var redirect_uri = 'http://localhost';

// exports.authorize_user = function(req, res) {
//   res.redirect(instagram.get_authorization_url(redirect_uri, { scope: ['likes'], state: 'washington' }));
// };
=======
 var parameters = {
    zpid: 48998252
  };
  //getting images ect.
  zillow.callApi('GetUpdatedPropertyDetails', parameters)
    .then(function(data) {
      //var results = data.response[0].results[0].result[0]
     console.log(data.response[0])
     });

app.get("/", function(req, res) {
  var parameters = {
    zpid: 48998252
  };
  //getting images ect.
  zillow.callApi('GetUpdatedPropertyDetails', parameters)
    .then(function(data) {
      //var results = data.response[0].results[0].result[0]
     console.log(data.response[0])
    })
});
>>>>>>> 71adc35c65938c9b1dddc8d9cc9dee3f92f105cb

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

<<<<<<< HEAD
// http.createServer(app).listen(app.get('port'), function(){
//   console.log("Express server listening on port " + app.get('port'));
// });
=======
app.get("/:id/results", function(req, res){
  // TODO: ENTER CODE HERE
  res.render('shared/results')
});
>>>>>>> 71adc35c65938c9b1dddc8d9cc9dee3f92f105cb


// Instagram api call for /main/results
app.get('/main/results',function(req, res){
  res.render('main/results');
});
// instagram.location_search({ lat: 48.565464564, lng: 2.34656589 }, function(err, result) {
//     if (err) {
//       console.log(err);
//     } else {
//        var id = result[0].id
//         instagram.location_media_recent(id, function(err, result){
//           if (err) {
//             console.log(err);
//           } else {
//             res.send(result);
//             console.log(result);
//           }
//         // res.send(result);
//             console.log(result);
//           });
//       }
// })
// })


app.listen(3000)