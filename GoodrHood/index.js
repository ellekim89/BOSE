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

app.post("/", function(req, res) {

var params = {
  address: req.body.address,
  citystatezip: "Seattle, WA " + req.body.zip_code
  // city: 'Seattle',
  // state: 'WA',
  // zip: '98107'
};


zillow.callApi('GetSearchResults', params)
  .then(function(result){

    var id = result.response[0].results[0].result[0].zpid[0]
    var parameters = {
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
      })
    });


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