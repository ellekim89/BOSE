var express = require('express');
var db = require('./models');
var async = require('async');
var yelp = require("yelp").createClient({
  consumer_key: process.env.YELP_CONSUMER_KEY,
  consumer_secret: process.env.YELP_CONSUMER_SECRET,
  token: process.env.YELP_TOKEN,
  token_secret: process.env.YELP_TOKEN_SECRET
});
var bodyParser = require('body-parser');
var request = require('request');
var methodOverride = require('method-override');
var ejsLayouts = require('express-ejs-layouts');
var session = require('express-session');
var flash = require('connect-flash');
var Zillow  = require('node-zillow')
var zwsid = process.env.ZILLOW_KEY
var zillow = new Zillow(zwsid)
var instagram = require('instagram-node').instagram();
var client_id = process.env.CLIENT_ID
var client_secret = process.env.CLIENT_SECRET
var access_token = process.env.ACCESS_TOKEN
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

instagram.use({
  access_token: access_token
});
// instagram.use({
//   client_id: client_id,
//   client_secret: client_secret
// });
app.use(function(req,res,next){
  // req.session.user = 8;
  if(req.session.user){
    db.user.findById(req.session.user).then(function(user){
      req.currentUser = user;
      next();
    });

  }else{
    req.currentUser = false;
    next();
  }
});

app.use(function(req,res,next){
  res.locals.currentUser = req.currentUser;
  res.locals.alerts = req.flash();
  next();
});


app.get("/signup", function(req,res){
  res.render('main/signup');
});

app.post("/signup", function(req, res){
    if(req.body.password != req.body.password2){
    req.flash('danger','Passwords must match.')
    res.redirect('/auth/signup');
  }else{
    db.user.findOrCreate({
      where:{
        email: req.body.email
      },
      defaults:{
        email: req.body.email,
        password: req.body.password,
        name: req.body.name
      }
    }).spread(function(user,created){
      if(created){
        req.flash('success','You are signed up.')
        res.redirect('/');
      }else{
        // throw new Error('A user with that e-mail address already exists.');
        // res.send('A user with that e-mail address already exists.');
        req.flash('danger','A user with that e-mail address already exists.');
        res.redirect('/auth/signup');
      }
    }).catch(function(err){
      if(err.message){
        req.flash('danger',err.message);
      }else{
        req.flash('danger','unknown error.');
        console.log(err);
      }
      res.redirect('/auth/signup');
    })
  }
})


app.get("/login", function(req,res){
    res.render('main/login');
});


app.post('/login', function(req, res){
  db.user.authenticate(req.body.email,req.body.password,function(err,user){
    if(err){
      res.send(err);
    }else if(user){
      req.session.user = user.id;
      req.flash('success','You are logged in.');
      res.redirect('/');
    }else{
      req.flash('danger','invalid username or password');
      res.redirect('/auth/login');
    }
  });
})

app.get("/favorites", function(req,res){
  if(req.currentUser){
    res.render('main/favorites');
  }else{
    req.flash('danger','ACCESS DENIED!!!');
    res.redirect('/');
  }
})

app.get("/", function(req, res){
  res.render("main/index")

})

app.get("/search", function(req, res) {
  async.waterfall([
    function(callback){
      var params = {
        address: req.query.address,
        citystatezip: "Seattle, WA " + req.query.zip_code
      };
      var zillowAddressCall = zillow.callApi('GetSearchResults', params);
      zillowAddressCall.then(function(data){
        var zpid = parseInt(data.response[0].results[0].result[0].zpid[0])
        var id = {zpid: zpid}

        var zillowIdCall = zillow.callApi('GetUpdatedPropertyDetails', id)
        zillowIdCall.then(function(result){
          if (result.message[0].code == '501'){
              res.send("We're sorry. Unfortunately, this information is protected")
          } else {
            var zillowResult = result.response[0];
            var zillowObj = {
              address: zillowResult.address[0].street+" "+zillowResult.address[0].city+" "+zillowResult.address[0].state,
              images: zillowResult.images[0].image[0],
              lat: zillowResult.address[0].latitude[0],
              lon: zillowResult.address[0].longitude[0]
            }
            callback(null, zillowObj)
          }
          // console.log(zillowObj)
        })
      })
    },
    function(zillowObj, callback){
      yelp.search({term: "food", location: req.query.zip_code}, function(error, data) {
        var foodArr = [];
        var score = 0;
        //res.send(data)
        data.businesses.forEach(function(place){
          foodArr.push(place.rating);
        })
        for (var i = 0; i < foodArr.length; i++) {
          score = foodArr[i]+score;
        };
        score = score / foodArr.length;
        var foodRate = score
        var foodScore = Math.round(score*50);
        yelp.search({term: "entertainment", location: req.query.zip_code}, function(error, data) {
          var ratingsArr = [];
          var score = 0;
          data.businesses.forEach(function(place){
            ratingsArr.push(place.rating);
          })
          for (var i = 0; i < ratingsArr.length; i++) {
            score = ratingsArr[i]+score;
          };
          score = score / ratingsArr.length;
          var entertainmentRate = score
          var entertainmentScore = Math.round(score*50);
            var yelpZillowObj = {
              zillow:zillowObj,
              yelpFoodRating: foodRate,
              yelpEntertainmentRating: entertainmentRate,
              yelpFoodScore:foodScore,
              yelpEntertainmentScore: entertainmentScore
            }
          // res.send(yelpZillowObj)
          callback(null, yelpZillowObj);
        })
      })
    },
    function(yelpZillowObj, callback){
      // res.send(parseInt(yelpZillowObj.zillow.lat))
      instagram.location_search({ lat: parseFloat(yelpZillowObj.zillow.lat), lng: parseFloat(yelpZillowObj.zillow.lon) }, function(err, result) {
        // res.send(result)
        if (err) {
          res.send(err+"no sam");
        } else {
            var id = result[2].id;
            instagram.location_media_recent(id, function(err, result){
              if (err) {
                res.send(err+"no sam");
              } else {
                var finalObj = {
                  info:yelpZillowObj,
                  images:result,
                }
                // res.send(finalObj)
                console.log(result);
                callback(null, finalObj)
              }
            });
        }
  })
    }
  ], function(err,results){
    //res.send(results)
    res.render('main/results', {info:results})
  })
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
instagram.location_search({ lat: parseFloat(yelpZillowObj.zillow.lat), lng: parseFloat(yelpZillowObj.zillow.lon), distance: 5000}, function(err, result) {
    if (err) {
      //console.log(err);
    } else {
       var id = result[0].id
        instagram.location_media_recent(id, function(err, result){
          if (err) {
            //console.log(err);
          } else {
            res.send(result);
           // console.log(result);
          }
        // res.send(result);
            //console.log(result);
          });
      }
})
})

app.get('/logout',function(req,res){
  req.flash('info','You have been logged out.');
  req.session.user = false;
  res.redirect('/');
});


app.listen(3000)