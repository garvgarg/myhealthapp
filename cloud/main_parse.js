var express = require('express');
var querystring = require('querystring');
var _ = require('underscore');
var Buffer = require('buffer').Buffer;

/**
 * Create an express application instance
 */
var app = express();

app.set('views', 'cloud/views');  // Specify the folder to find templates
app.set('view engine', 'ejs');    // Set the template engine
app.use(express.bodyParser());    // Middleware for reading request body

var RedirectEndpoint = 'https://www.fitbit.com/oauth/authorize?';
var ValidateEndpoint = 'https://api.fitbit.com/oauth/access_token';
var UserEndpoint = 'https://api.fitbit.com/user';

var qs = require('qs');
var OAuth = require('cloud/oauth').OAuth;
var consumerKey = '9aabb8bc18c9440a98f2ffe469128001';
var consumerSecret = '79dbe36bec3841359f6474b662570ae8';

/**
 * Main route.
 *
 * When called, render the login.ejs view
 */
app.get('/', function(req, res) {
   // res.render('myhealthlogin.ejs');
  res.render('login', {});
});

var oauth_callback = function(err, token, token_secret, parsedQueryString) {
	console.log(err);
	console.log(token);
	console.log(token_secret);
	console.log(parsedQueryString);
}
//function(err, token, token_secret, parsedQueryString) {} 
/**
 * Login route.
 *
 * When called, generate a request token and redirect the browser.
 */
app.get('/authorize', function(req, res) {

  var oa = new OAuth(githubRedirectEndpoint, githubValidateEndpoint, consumerKey, consumerSecret, "1.0", null, "HMAC-SHA1");
  oa.getOAuthRequestToken(oauth_callback);
  
/*  var tokenRequest = new TokenRequest();
  // Secure the object against public access.
  tokenRequest.setACL(restrictedAcl);
  **
   * Save this request in a Parse Object for validation when GitHub responds
   * Use the master key because this class is protected
   *
  tokenRequest.save(null, { useMasterKey: true }).then(function(obj) {
    **
     * Redirect the browser to GitHub for authorization.
     * This uses the objectId of the new TokenRequest as the 'state'
     *   variable in the GitHub redirect.
     *
    res.redirect(
      githubRedirectEndpoint + querystring.stringify({
        client_id: githubClientId,
        state: obj.id
      })
    );
  }, function(error) {
    // If there's an error storing the request, render the error page.
    res.render('error', { errorMessage: 'Failed to save auth request.'});
  });
*/
});
