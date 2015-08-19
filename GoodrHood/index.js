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
var zwsid = process.env.ZILLOW_KEY;
var zillow = new Zillow(zwsid);
var cheerio = require('cheerio');
var instagram = require('instagram-node').instagram();
var client_id = process.env.CLIENT_ID;
var client_secret = process.env.CLIENT_SECRET;
var access_token = process.env.ACCESS_TOKEN;
var ws_api_key = process.env.WALKSCORE_API_KEY;
var wsapikey = process.env.WSAPIKEY;
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
  req.session.user = 1;
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

app.get("/contact", function(req, res){
  res.render('main/contact');
});

app.get("/team", function(req, res){
  res.render('main/team');
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

// FAVORITES
// GET Favorites localhost:3000/favorites
app.get("/:id/favorites", function(req, res){

  // res.send('working');
  db.user.find({
    where: {id:req.params.id}, include:[db.favorite]
  }).then(function(favorite){
      res.render('main/favorites',favorite.get())
      // res.send(favorite)
  }).catch(function(err){
    res.send(err);
  })
  //   res.render('main/favorites', {myfavorite: favorite});
  // });
  //res.render('main/favorites');

});

// POST favorites
app.post("/favorites", function(req,res){
  // res.send(req.body);
    db.favorite.findOrCreate({
      where:{user_id: req.currentUser.id,
             address: req.body.fave_Address}}).spread(function(favorite, created){
    res.redirect(req.currentUser.id + '/favorites')
  });
});



// FAVORITES BEGINS HERE

// GET http://localhost:3000/favorites
// app.get('/favorites',function(req,res){
//   db.favorite.findAll({
//     include:[db.address],
//     include:[db.zipcode]
//   }).then(function(favorites){
//     res.render('main/favorites',{favorites:favorites});
//   });
// });


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
          var snippet = []

            var yelpZillowObj = {
              zillow:zillowObj,
              yelpFoodRating: foodRate,
              yelpEntertainmentRating: entertainmentRate,
              yelpFoodScore:foodScore,
              yelpEntertainmentScore: entertainmentScore,
              neighborhood: data.businesses[0].location.neighborhoods[0],
            }
          callback(null, yelpZillowObj);
        })
      })
    },
    function(yelpZillowObj, callback){
      request('http://www.visitseattle.org/neighborhoods/'+yelpZillowObj.neighborhood, function (error, response, data) {
        if (!error && response.statusCode == 200) {
          var $ = cheerio.load(data);


          var blocks = $('.block-inner');



          var title = blocks.first().find('h1').text();
          // console.log(title);



          blocks.eq(1).find('p').each(function(index, element){
            var snippet =($(element).text());

            var requestObj = {
              yelpZillow:yelpZillowObj,
              community_snippet: snippet
            }
            // res.send(requestObj)
            callback(null, requestObj)
          })


        }
      });
    },
    function(requestObj, callback){
      instagram.location_search({ lat: parseFloat(requestObj.yelpZillow.zillow.lat), lng: parseFloat(requestObj.yelpZillow.zillow.lon) }, function(err, result) {
        if (err) {
          res.send(err+"no sam");
        } else {
            var id = result[2].id;
            instagram.location_media_recent(id, function(err, result){
              if (err) {
                res.send(err+"no sam");
              } else {
                var finalObj = {
                  info:requestObj,
                  images:result,
                }
                // console.log(result);
                // res.send(finalObj)
                callback(null, finalObj)
              }
            });
        }
  })
    },
    function(finalObj, callback){
      console.log(process.env.WALKSCORE_KEY)
      var url = 'http://api.walkscore.com/score?format=json&address='+finalObj.info.yelpZillow.zillow.address.split(' ').join('%20')+'&lat='+parseFloat(finalObj.info.yelpZillow.zillow.lat)+'&lon='+parseFloat(finalObj.info.yelpZillow.zillow.lon)+'&wsapikey='+wsapikey;
      request(url, function(err, response, data){
        if(data){
          var fullObj = {
            main: finalObj,
            walkscore: JSON.parse(data),
          }
          callback(null, fullObj)
        }else{
          res.send(err)
        }
      })
    }
  ], function(err,results){

     res.send(results)
    //res.render('main/results', {results:results, apikey:parseInt(ws_api_key)})
  })
});

app.get('/logout',function(req,res){
  req.flash('info','You have been logged out.');
  req.session.user = false;
  res.redirect('/');
});





app.listen(3000)