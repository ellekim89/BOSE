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
  req.session.user = 3;

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
  if(req.currentUser){
    var cleanUser = req.currentUser.get();
    delete cleanUser.password;
  }else{
    var cleanUser = false;
  }
  res.locals.cleanUser = cleanUser;
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
             address: req.body.address,
             rating: req.body.rating,
             mainImage: req.body.mainImage}}).spread(function(favorite, created){
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
        // console.log(data)
        // res.send(data)
        var zpid = parseInt(data.response[0].results[0].result[0].zpid[0])
        var id = {zpid: zpid}
        var zData = data.response[0].results[0].result[0]
        var zillowIdCall = zillow.callApi('GetUpdatedPropertyDetails', id)
        zillowIdCall.then(function(result){
          // res.send(result)
          if (result.message[0].code == '501'){

          } else if(result.message[0].code == '508') {
            res.send(result.message[0].text)
          } else if(result.message[0].code == '502'){
            console.log('we are here 502')
            var zillowObj = {
              address: zData.address[0].street[0],
              lat: zData.address[0].latitude[0],
              lon: zData.address[0].longitude[0],
              zipcode: zData.address[0].zipcode[0],
              neighborhood: zData.localRealEstate[0].region[0].$.name
            }
            console.log('step 1')
            callback(null, zillowObj)
          } else {
            console.log("we are here 0")
            var zillowResult = result.response[0];
            var zillowObj = {
              address: zillowResult.address[0].street[0],
              images: zillowResult.images[0].image[0].url,
              lat: zillowResult.address[0].latitude[0],
              lon: zillowResult.address[0].longitude[0],
              zipcode: zillowResult.address[0].zipcode[0],
              neighborhood: zData.localRealEstate[0].region[0].$.name
            }
            // res.send(zillowObj)
            console.log('step 1')
            callback(null, zillowObj)
          }
        })
      })
    },
    function(zillowObj, callback){
      // res.send(zillowObj)
      yelp.search({term: "food", location: zillowObj.address+" "+zillowObj.zipcode}, function(error, data) {
        var foodArr = [];
        foodPhotosArr = []
        var score = 0;
        data.businesses.forEach(function(place){
          foodArr.push(place.rating);
          if(place.image_url != null){
            foodPhotosArr.push(place.image_url.replace("ms.jpg","l.jpg"))
          }
        })
        for (var i = 0; i < foodArr.length; i++) {
          score = foodArr[i]+score;
        };
        score = score / foodArr.length;
        var foodRate = score
        var foodScore = Math.round(score*50);
        yelp.search({term: 'entertainment', location: zillowObj.address+" "+zillowObj.zipcode}, function(error, data) {
          // res.send(data)
          var ratingsArr = [];
          var photosArr = [];
          var score = 0;
          // res.send(data)
          data.businesses.forEach(function(place){
            ratingsArr.push(place.rating);
            if(place.image_url != null){
              photosArr.push(place.image_url.replace("ms.jpg","l.jpg"))
            }
          })
          // res.send(photosArr)
          for (var i = 0; i < ratingsArr.length; i++) {
            score = ratingsArr[i]+score;
          };
          score = score / ratingsArr.length;
          var entertainmentRate = score
          var entertainmentScore = Math.round(score*50);
          yelp.search({term: 'apartments', location: zillowObj.address+" "+zillowObj.zipcode}, function(error, data){
            // res.send(data.businesses)
            var apartmentInfo = []
            data.businesses.forEach(function(place){
              if( place.location.display_address[0].indexOf(zillowObj.address) != -1){
                  apartmentInfo.push({
                    apartmentName: place.name,
                    apartmentRating: place.rating,
                    apartmentSnippet: place.snippet_text
                  })
              }

            })
            var yelpZillowObj = {
              zillow:zillowObj,
              yelpFoodRating: foodRate,
              yelpEntertainmentRating: entertainmentRate,
              yelpFoodScore:foodScore,
              yelpEntertainmentScore: entertainmentScore,
              foodPhotos: foodPhotosArr,
              photos: photosArr,
              apartmentInfo: apartmentInfo
            };
          console.log('step 2')
          // res.send(yelpZillowObj);
          callback(null, yelpZillowObj);
            // res.send(apartmentInfo)
          })
        })
      })
    },
    function(yelpZillowObj, callback){
      console.log(yelpZillowObj.zillow.neighborhood)
      var neighborhood = yelpZillowObj.zillow.neighborhood.toLowerCase().replace("north " || "east " || "south " || "west ", "");
      console.log(neighborhood)
      if(neighborhood.indexOf("downtown") != -1){
        var url = 'http://www.visitseattle.org/neighborhoods/downtown-seattle'
      } else if(neighborhood.indexOf( "beacon hill" || "genesee") != -1 ){
        var url = 'http://www.visitseattle.org/neighborhoods/columbia-city/'
      } else if(neighborhood.indexOf('first hill') != -1) {
        var url = 'http://www.visitseattle.org/neighborhoods/capitol-hill/'
      }else{
        var url = 'http://www.visitseattle.org/neighborhoods/'+neighborhood.split(' ').join('-')
      };
      console.log(url)
      request(url, function (error, response, data) {
        if (!error && response.statusCode == 200) {
          var $ = cheerio.load(data);
          var blocks = $('.block-inner');
          var title = blocks.first().find('h1').text();
          blocks.eq(1).find('p').each(function(index, element){
            var snippet = ($(element).text());
            var requestObj = {
              yelpZillow:yelpZillowObj,
              community_snippet: snippet
            };
            console.log('step 3')
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
                console.log('step 4')
                callback(null, finalObj)
              }
            });
        }
      })
    },
    function(finalObj, callback){
      var url = 'http://api.walkscore.com/score?format=json&address='+finalObj.info.yelpZillow.zillow.address.split(' ').join('%20')+'&lat='+parseFloat(finalObj.info.yelpZillow.zillow.lat)+'&lon='+parseFloat(finalObj.info.yelpZillow.zillow.lon)+'&wsapikey='+wsapikey;
      request(url, function(err, response, data){
        if(data){
          var fullObj = {
            main: finalObj,
            walkscore: JSON.parse(data),
          }
          console.log('step 5')
          callback(null, fullObj)
        }else{
          res.send(err)
        }
      })
    }
  ], function(err,results){

     //res.send(results)
    res.render('main/results', {results:results, apikey:parseInt(ws_api_key)})

  })
});

app.get('/logout',function(req,res){
  req.flash('info','You have been logged out.');
  req.session.user = false;
  res.redirect('/');
});





app.listen(3000)