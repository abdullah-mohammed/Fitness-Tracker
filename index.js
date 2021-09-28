const express = require('express');
const passport = require('passport');
const cookieSession = require('cookie-session');

const GoogleStrategy = require('passport-google-oauth20');


// Google login credentials, used when the user contacts
// Google, to tell them where he is trying to login to, and show
// that this domain is registered for this service. 
// Google will respond with a key we can use to retrieve profile
// information, packed into a redirect response that redirects to
// server162.site:[port]/auth/redirect
const hiddenClientID = process.env['clientID']
const hiddenClientSecret = process.env['ClientSecret']



// An object giving Passport the data Google wants for login.  This is 
// the server's "note" to Google.
const googleLoginData = {
  clientID: hiddenClientID,
  clientSecret: hiddenClientSecret,
  callbackURL: '/auth/accepted',
  proxy: true
};


// Tell passport we will be using login with Google, and
// give it our data for registering us with Google.
// The gotProfile callback is for the server's HTTPS request
// to Google for the user's profile information.
// It will get used much later in the pipeline. 
passport.use(new GoogleStrategy(googleLoginData, gotProfile));

// app is the object that implements the express server
const app = express();

const dbo = require('./databaseOps');
app.use(express.json());

app.use(express.static('public'))

// pipeline stage that just echos url, for debugging
app.use('/', printURL);

// Check validity of cookies at the beginning of pipeline
// Will get cookies out of request object, decrypt and check if 
// session is still going on. 
app.use(cookieSession({
  maxAge: 6 * 60 * 60 * 1000, // Six hours in milliseconds
  // after this user is logged out.
  // meaningless random string used by encryption
  keys: ['hanger waldo mercy dance']
}));

// Initializes passport by adding data to the request object
app.use(passport.initialize());

// If there is a valid cookie, this stage will ultimately call deserializeUser(),
// which we can use to check for a profile in the database
app.use(passport.session());

// Public static files - /public should just contain the splash page
app.get("/", (request, response) => {
  response.sendFile(__dirname + "/public/splash.html");
});

app.get('/*', express.static('public'));

// next, handler for url that starts login with Google.
// The app (in public/login.html) redirects to here 
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

// Google redirects here after user successfully logs in
app.get('/auth/accepted',
  // for educational purposes
  function(req, res, next) {
    console.log("at auth/accepted");
    next();
  },

  passport.authenticate('google'),
  

  function(req, res) {
    console.log('Logged in and using cookies!')
    // tell browser to get the hidden main page of the app
    res.redirect('/index.html');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/splash.html');
});


// static files in /user are only available after login
app.get('/*',
  isAuthenticated, // only pass on to following function if
  // user is logged in 
  // serving files that start with /user from here gets them from ./
  express.static('user')
);


app.get('/query', isAuthenticated,
  function(req, res) {
    console.log("saw query");
    res.send('HTTP query!')
  });


app.post('/store', isAuthenticated, function(request, response, next) {
  var newEntry = request.body;
	let userId = request.user.id;
	console.log(userId);

  dbo.insertActivity(userId,newEntry).catch(
    function(error) {
      console.log("error inserting entry:", error);
      response.send("Error inserting");
    }
  );
  response.send("I got your POST request");
});

app.get('/week', isAuthenticated, function(request, response, next) {
  var date = request.query.date;
  var activity = request.query.activity;
	let userId = request.user.id;

  dbo.chart(userId,date, activity)
    .then((r) => { response.send(r) })
    .catch(
      function(error) {
        console.log("error getting week:", error);
        response.send("Error inserting");
      }
    );
});


app.get('/name', isAuthenticated, function(req, res) { 
  let userId = req.user.id; 

  dbo.userSearch(userId).then ((val) => {
      console.log("val is: ", val);
      //name is val 
      res.send(val);
      })
      .catch(
        function(error) {
          console.log("error getting name:", error);
          res.send("Error getting name");
        }
    );

});

app.get('/reminder', isAuthenticated, function(request, response, next) {
	let userid = request.user.id;
  dbo.reminder(userid)
    .then((r) => { response.send(r) })
    .catch(
      function(error) {
        console.log("error reminder:", error);
        response.send("Error with reminder");
      }
    );
});

// dump table to check what is in DB to debug
app.get('/dump', isAuthenticated, function(request, response, next) {
  console.log("userinfo:", request.user);
  dbo.full()
  .then((r) => { response.send(r)})
  .catch(
  function (error) {
    console.log("error dump:",error);
    response.send("Error dump");}
  );
});

app.get('/dump2', isAuthenticated, function(request, response, next) {
  dbo.full2()
  .then((r) => { response.send(r)})
  .catch(
  function (error) {
    console.log("error dump:",error);
    response.send("Error dump");}
  );
});

// finally, file not found, if we cannot handle otherwise.
app.use(fileNotFound);

//start pipeline
const listener = app.listen(3000, () => {
  console.log("The static server is listening on port " + listener.address().port);
});


// middleware functions called by some of the functions above. 

// print the url of incoming HTTP request
function printURL(req, res, next) {
  console.log(req.url);
  next();
}

// function for end of server pipeline
function fileNotFound(req, res) {
  let url = req.url;
  res.type('text/plain');
  res.status(404);
  res.send('Cannot find ' + url);
}


// function to check whether user is logged when trying to access
// personal data
function isAuthenticated(req, res, next) {
  if (req.user) {
    // user field is filled in in request object
    // so user must be logged in! 
    console.log("user", req.user, "is logged in");
    next();
  } else {
    res.redirect('/splash.html');  // send response telling
    // Browser to go to login page
  }
}

// function called during login, the second time passport.authenticate
// is called (in /auth/redirect/),
// once we actually have the profile data from Google. 
function gotProfile(accessToken, refreshToken, profile, done) {
  console.log("Google profile has arrived", profile);

  let userid = profile.id;
  let name = profile.name.givenName;
  dbo.insertProfile(userid,name).then(
    console.log("Profile storede in DB")).catch(
    function(error) {
      console.log("error inserting entry:", error);
      response.send("Error inserting");
    }
  );
  done(null, userid);
} 

// Part of Server's sesssion set-up.  
passport.serializeUser((userid, done) => {
  console.log("SerializeUser. Input is", userid);
  done(null, userid);
});

// Where we should lookup user database info. 
passport.deserializeUser((userid, done) => {
  console.log("deserializeUser. Input is:", userid);
  let userData = { id:userid, name: "data from user's db row goes here" };

  
    dbo.userSearch(userid).then ((val) => {
        userData = { id:userid, name:val };
        done(null, userData);
      })
      .catch(
        function(error) {
          console.log("error inserting entry:", error);
          response.send("Error inserting");
        }
    );

});


const mySecret = process.env['clientID']
