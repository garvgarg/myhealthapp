  var express = require('express');
  var parseExpressHttpsRedirect = require('parse-express-https-redirect');
  var parseExpressCookieSession = require('parse-express-cookie-session');
  var app = express();

  app.set('views', 'cloud/views');
  app.set('view engine', 'ejs');
  app.use(parseExpressHttpsRedirect());  // Require user to be on HTTPS.
  app.use(express.bodyParser());
  app.use(express.cookieParser('YOUR_SIGNING_SECRET'));
  app.use(parseExpressCookieSession({ cookie: { maxAge: 3600000 } }));

  // You could have a "Log In" link on your website pointing to this.
  app.get('/login', function(req, res) {
    // Renders the login form asking for username and password.
    res.render('myhealthlogin.ejs');
  });

  // Clicking submit on the login form triggers this.
  app.post('/login', function(req, res) {
    Parse.User.logIn(req.body.username, req.body.password).then(function() {
      // Login succeeded, redirect to homepage.
      // parseExpressCookieSession will automatically set cookie. 
      res.redirect('/start');
    },
    function(error) {
      // Login failed, redirect back to login form.
      res.redirect('/login');
    });
  });

  // You could have a "Log Out" link on your website pointing to this.
  app.get('/logout', function(req, res) {
    Parse.User.logOut();
    res.redirect('/');
  });

  // The homepage renders differently depending on whether user is logged in.
  app.get('/start', function(req, res) {
    if (Parse.User.current()) {
      // No need to fetch the current user for querying Note objects.
      res.redirect('/hello');
      var Note = Parse.Object.extend("Note");
      var query = new Parse.Query(Note);
      query.find().then(function(results) {
	
        // Render the notes that the current user is allowed to see.
      },
      function(error) {
        // Render error page.
      });
    } else {
      // Render a public welcome page, with a link to the '/login' endpoint.
    }
  });

  // You could have a "Profile" link on your website pointing to this.
  app.get('/profile', function(req, res) {
    // Display the user profile if user is logged in.
    if (Parse.User.current()) {
      // We need to fetch because we need to show fields on the user object.
      Parse.User.current().fetch().then(function(user) {
        // Render the user profile information (e.g. email, phone, etc).
      },
      function(error) {
        // Render error page.
      });
    } else {
      // User not logged in, redirect to login form.
      res.redirect('/login');
    }
  });

 app.get('/hello', function(req, res) {
   res.render('hello', { message: 'Congrats, you just set up your app!' });
});

 app.post('/hello', function(req, res) {
   res.render('hello', { message: res.body.message });
});
  app.listen();