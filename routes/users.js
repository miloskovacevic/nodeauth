var express = require('express');
var router = express.Router();
var User = require('../models/user');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;



/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// Register page
router.get('/register', function(req, res, next) {
  res.render('register', {
    title: 'Register'
  });
});

// Login page
router.get('/login', function(req, res, next) {
  res.render('login', {
    title: 'Login'
  });
});

router.post('/register', function (req, res, next) {
  // Pokupi Form vrijednosti preko req-a
  var name = req.body.name;
  var email = req.body.email;
  var username = req.body.username;
  var password = req.body.password;
  var password2 = req.body.password2;

  // Provjeri Image polje
  if(req.files && req.files.profileimage) {
    console.log('Uploading File...');
    //file info
    var profileImageOriginalName = req.files.profileimage.originalname;
    var profileImageMime = req.files.profileimage.mimetype;
    var profileImagePath = req.files.profileimage.path;
    var profileImageExt = req.files.profileimage.extension;
    var profileImageSize = req.files.profileimage.size;
  } else {
    //setuj Difoltnu sliku
    var profileImageName = 'noimage.png';
  }



  // Validacija forme koristimo Express Validator, u checkBody ubacujemo
  // string reprezentaciju varijabli koje smo izvukli na linijama 26-30...
  req.checkBody('name', 'Name field is required').notEmpty();
  req.checkBody('email', 'Email field is required').notEmpty();
  req.checkBody('email', 'Email not valid.').isEmail();
  req.checkBody('username', 'Username field is required').notEmpty();
  req.checkBody('password', 'Password field is required').notEmpty();
  req.checkBody('password2', 'Password do not mach').equals(req.body.password);


  // Provjera gresaka
  var errors = req.validationErrors();

  if(errors){
    res.render('register', {
      errors: errors,
      name: name,
      email: email,
      username: username,
      password: password,
      password2: password2
    });
  } else {
    var newUser = new User({
      name: name,
      email: email,
      username: username,
      password: password,
      profileimage: profileImageName
    });
    
    //Kreiraj korisnika
    User.createUser(newUser, function (err, user) {
      if(err) throw err;
      console.log(user);
    });

    // Success message...
    req.flash('success', 'You are now registered and may log in');
    res.location('/');
    res.redirect('/');
  }
});


passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.getUserById(id, function (err, user) {
    done(err, user);
  });
});

//pravimo Lokalnu Strategiju koju ce da koristi funkcija ispod ove (passport.authenticate(...))
passport.use(new LocalStrategy(
    function(username, password, done){
      User.getUserByUsername(username, function (err, user) {
        if(err) throw err;
        if(!user){
          console.log('Unknown User!');
          return done(null, false,{message: 'Unknown User'});
        }

        //uporedjujemo prosledjeni password kroz formu i ovaj sto smo dobili iz mongo-a...
        User.comparePasswords(password, user.password, function(err, isMatch){
          if (err) throw err;

          if(isMatch){
            return done(null, user);
          } else {
            console.log('Invalid Password');
            return done(null, false, {message:'Invalid Password'});
          }
        });
      });
    }
));

router.post('/login', passport.authenticate('local', {failureRedirect:'/users/login', failureFlash: 'Invalid username or password'}), function(req, res){
  console.log('Authentication Successful');
  req.flash('success', 'You are logged in');
  res.redirect('/');
});

router.get('/logout', function(req, res){
  req.logout();
  req.flash('success', 'You have logged out!');
  //kad je u pitanju redirect, pisemo cijelu putanju!
  res.redirect('/users/login');
});

module.exports = router;

























