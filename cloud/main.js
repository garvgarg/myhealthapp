/**
 * Load needed modules.
 */
var express = require('express');
var querystring = require('querystring');
var _ = require('underscore');
var Buffer = require('buffer').Buffer;
var moment = require('moment');

/**
 * Create an express application instance
 */
var app = express();
var qs = require('qs');

/**
 * In the Data Browser, set the Class Permissions for these 2 classes to
 *   disallow public access for Get/Find/Create/Update/Delete operations.
 * Only the master key should be able to query or write to these classes.
 */
var TokenRequest = Parse.Object.extend("TokenRequest");
var TokenStorage = Parse.Object.extend("TokenStorage");

/**
 * Create a Parse ACL which prohibits public access.  This will be used
 *   in several places throughout the application, to explicitly protect
 *   Parse User, TokenRequest, and TokenStorage objects.
 */
var restrictedAcl = new Parse.ACL();
restrictedAcl.setPublicReadAccess(false);
restrictedAcl.setPublicWriteAccess(false);

/**
 * Global app configuration section
 */
app.set('views', 'cloud/views'); // Specify the folder to find templates
app.set('view engine', 'ejs'); // Set the template engine
app.use(express.bodyParser()); // Middleware for reading request body


/**
 * create Parse.request to algorithm api
 *
 * return api-response on Parse.client-side
 */



Parse.Cloud.define('fetchDataFromAlgorithm', function (req, res) {


  var currentUser = req.user;
  var fetchResponse = {
    status: '200',
    statusMessage: 'Successfully fetched'
  };

  var url = "http://projectvision-health2.herokuapp.com/api";

  completionAccess(currentUser).then(function (access) {
    if (access) {

      getAlgoData(currentUser).then(function (algodata) {

        Parse.Cloud.httpRequest({
          url: url,
          params: algodata,
          headers: {
            'Content-Type': 'application/json'
          },

          success: function (httpResponse) {
            var algoData = JSON.parse(httpResponse.text);

            var fd = moment(algoData.final_date, 'DD-MM-YYYY').format("YYYY-MM-DD");


            currentUser.set('ABSI_zscore', algoData.absi_zscore);
            currentUser.set('Final_Date', new Date(fd));
            currentUser.set('Waist_Circumference_Ideal', algoData.wc_ideal);

            var fitnessRelation = currentUser.relation("Focus1_GroupID");
            var dietRelation = currentUser.relation("Focus2_GroupID");
            var mindRelation = currentUser.relation("Focus3_GroupID");

            var relationArray = [
              fitnessRelation.query().find({
                success: function (list) {
                  _.each(list, function (relation) {
                    fitnessRelation.remove(relation);
                  });
                }
              }),
              dietRelation.query().find({
                success: function (list) {
                  _.each(list, function (relation) {
                    dietRelation.remove(relation);
                  });
                }
              }),
              mindRelation.query().find({
                success: function (list) {
                  _.each(list, function (relation) {
                    mindRelation.remove(relation);
                  });
                }
              })
            ]
            Parse.Promise.when(relationArray).then(function () {

              var ChallengeGroupArray = [];

              _.each(algoData.activity_groups_name, function (name) {

                ChallengeGroupArray.push(
                  new Parse.Query("ChallengeGroup").equalTo('GroupName', name).find().then(
                    function (challenge) {
                      if (typeof(challenge[0]) !== 'undefined') {
                        fitnessRelation.add(challenge[0])
                      }
                    })
                );
              });
              _.each(algoData.stress_activities_id, function (name) {

                ChallengeGroupArray.push(
                  new Parse.Query("ChallengeGroup").equalTo('GroupName', name).find().then(
                    function (challenge) {
                      if (typeof(challenge[0]) !== 'undefined') {
                        mindRelation.add(challenge[0])
                      }
                    })
                );
              });
              _.each(algoData.diet_groups_challenge, function (name) {

                ChallengeGroupArray.push(
                  new Parse.Query("ChallengeGroup").equalTo('GroupName', name).find().then(
                    function (challenge) {
                      if (typeof(challenge[0]) !== 'undefined') {
                        dietRelation.add(challenge[0])
                      }
                    })
                );
              });

              Parse.Promise.when(ChallengeGroupArray).then(function () {
                currentUser.save(
                  null, {
                    success: function () {
                      res.success(fetchResponse);
                    }
                  }
                );
              });

            });


          },

          error: function (httpResponse) {
            fetchResponse.status = '400';
            fetchResponse.statusMessage = 'Request failed';
            res.success(fetchResponse);
          }

        });
      });

    } else {
      fetchResponse.status = '100';
      fetchResponse.statusMessage = 'Completion rate failed';
      res.success(fetchResponse);
    }

  });


});

Parse.Cloud.define('getChallenges', function (req, res) {

  var currentUser = req.user;
  var challenges = {};
  var ChallengesArray = [];
  var fitness = [];
  var diet = [];
  var mind = [];

  var ch = [
    currentUser.relation('Focus1_GroupID').query().find().then(
      function (fitnessChallenges) {

        _.each(fitnessChallenges, function (fitnessChallenge) {
          ChallengesArray.push(
            new Parse.Query("Challenges").equalTo('GroupID', fitnessChallenge).find().then(
              function (challenge) {
                if (typeof(challenge[0]) !== 'undefined') {
                  fitness.push.apply(fitness, challenge)
                }
              })
          );
        });

      }
    ),

    currentUser.relation('Focus2_GroupID').query().find().then(
      function (dietChallenges) {

        _.each(dietChallenges, function (dietChallenge) {
          ChallengesArray.push(
            new Parse.Query("Challenges").equalTo('GroupID', dietChallenge).find().then(
              function (challenge) {
                if (typeof(challenge[0]) !== 'undefined') {
                  diet.push.apply(diet, challenge)
                }
              })
          );
        });

      }
    ),
    currentUser.relation('Focus3_GroupID').query().find().then(
      function (mindChallenges) {

        _.each(mindChallenges, function (mindChallenge) {
          ChallengesArray.push(
            new Parse.Query("Challenges").equalTo('GroupID', mindChallenge).find().then(
              function (challenge) {
                if (typeof(challenge[0]) !== 'undefined') {
                  mind.push.apply(mind, challenge)
                }
              })
          );
        });

      }
    )
  ];
  Parse.Promise.when(ch).then(function () {
    Parse.Promise.when(ChallengesArray).then(function () {
      challenges.fitness = fitness;
      challenges.diet = diet;
      challenges.mind = mind;
      res.success(challenges);
    })
  });


});


// Clicking submit on the login form triggers this.
app.post('/myhealthlogin', function (req, res) {
  Parse.User.logIn(req.body.username, req.body.password).then(function () {
      // Login succeeded, redirect to homepage.
      // parseExpressCookieSession will automatically set cookie. 
      res.render('login.ejs');
    },
    function(error) {
      // Login failed, redirect back to login form.
      res.redirect('/');
    });
});

// You could have a "Log Out" link on your website pointing to this.
app.get('/logout', function (req, res) {
  Parse.User.logOut();
  res.redirect('/');
});

var requestEndpoint = 'https://api.fitbit.com/oauth/request_token';
var redirectEndpoint = 'https://www.fitbit.com/oauth/authorize?';
var validateEndpoint = 'https://api.fitbit.com/oauth/access_token';
var userEndpoint = 'https://api.fitbit.com/user';

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

var oauth_access_callback = function(err, token, token_secret, parsedQueryString, data) {
  console.log("Oauth Access Callback function called");
  console.log(err);
  console.log(token);
  console.log(token_secret);
  console.log(parsedQueryString);
}

var oauth_callback = function(err, token, token_secret, parsedQueryString, data, res) {

  console.error("Call back function called");
  console.error(err);
  console.error(token);
  console.error(token_secret);
  console.error(parsedQueryString);
  var oa_data = querystring.parse(data);
  var url = redirectEndpoint + data;
  console.log(url);
  var requestOptions = {
    url: url,
    followRedirects: true,
  };

  requestOptions.success = function (response) {
    console.log("response status: " + response.status);
  }

  requestOptions.error = function (err) {
    console.log("error");
    callback(err);
  };

  Parse.Cloud.httpRequest(requestOptions);
}
/**
 * Login with GitHub route.
 *
 * When called, generate a request token and redirect the browser to GitHub.
 */
app.get('/authorize', function(req, res) {

  var oa = new OAuth(requestEndpoint, redirectEndpoint, consumerKey, consumerSecret, "1.0", null, "HMAC-SHA1");
  oa.getOAuthRequestToken(oauth_callback);
});

/**
 * OAuth Callback route.
 *
 * This is intended to be accessed via redirect from GitHub.  The request
 *   will be validated against a previously stored TokenRequest and against
 *   another GitHub endpoint, and if valid, a User will be created and/or
 *   updated with details from GitHub.  A page will be rendered which will
 *   'become' the user on the client-side and redirect to the /main page.
 */
app.get('/oauthCallback', function(req, res) {
  var data = req.query;
  var token;
  /**
   * Validate that code and state have been passed in as query parameters.
   * Render an error page if this is invalid.
   */
  if (!(data && data.code && data.state)) {
    res.render('error', {
      errorMessage: 'Invalid auth response received.'
    });
    return;
  }
  var query = new Parse.Query(TokenRequest);
  /**
   * Check if the provided state object exists as a TokenRequest
   * Use the master key as operations on TokenRequest are protected
   */
  Parse.Cloud.useMasterKey();
  Parse.Promise.as().then(function() {
    return query.get(data.state);
  }).then(function(obj) {
    // Destroy the TokenRequest before continuing.
    return obj.destroy();
  }).then(function() {
    // Validate & Exchange the code parameter for an access token from GitHub
    return getGitHubAccessToken(data.code);
  }).then(function(access) {
    /**
     * Process the response from GitHub, return either the getGitHubUserDetails
     *   promise, or reject the promise.
     */
    var githubData = access.data;
    if (githubData && githubData.access_token && githubData.token_type) {
      token = githubData.access_token;
      return getGitHubUserDetails(token);
    } else {
      return Parse.Promise.error("Invalid access request.");
    }
  }).then(function(userDataResponse) {
    /**
     * Process the users GitHub details, return either the upsertGitHubUser
     *   promise, or reject the promise.
     */
    var userData = userDataResponse.data;
    if (userData && userData.login && userData.id) {
      return upsertGitHubUser(token, userData);
    } else {
      return Parse.Promise.error("Unable to parse GitHub data");
    }
  }).then(function(user) {
    /**
     * Render a page which sets the current user on the client-side and then
     *   redirects to /main
     */
    res.render('store_auth', {
      sessionToken: user.getSessionToken()
    });
  }, function(error) {
    /**
     * If the error is an object error (e.g. from a Parse function) convert it
     *   to a string for display to the user.
     */
    if (error && error.code && error.error) {
      error = error.code + ' ' + error.error;
    }
    res.render('error', {
      errorMessage: JSON.stringify(error)
    });
  });

});

/**
 * Logged in route.
 *
 * JavaScript will validate login and call a Cloud function to get the users
 *   GitHub details using the stored access token.
 */
app.get('/main', function(req, res) {
  res.render('main', {});
});

/**
 * Attach the express app to Cloud Code to process the inbound request.
 */
app.listen();

/**
 * Cloud function which will load a user's accessToken from TokenStorage and
 * request their details from GitHub for display on the client side.
 */
Parse.Cloud.define('getGitHubData', function(request, response) {
  if (!request.user) {
    return response.error('Must be logged in.');
  }
  var query = new Parse.Query(TokenStorage);
  query.equalTo('user', request.user);
  query.ascending('createdAt');
  Parse.Promise.as().then(function() {
    return query.first({
      useMasterKey: true
    });
  }).then(function(tokenData) {
    if (!tokenData) {
      return Parse.Promise.error('No GitHub data found.');
    }
    return getGitHubUserDetails(tokenData.get('accessToken'));
  }).then(function(userDataResponse) {
    var userData = userDataResponse.data;
    response.success(userData);
  }, function(error) {
    response.error(error);
  });
});

var login = function (username, pass) {
  return Parse.User.logIn(username, pass);
};


var getAlgoData = function (currentUser) {

  var username = currentUser.get('username');

  var algoData = {};

  var completion = [
    new Parse.Query('Lifestyle').equalTo('username', username).find().then(
      function (userLifeStyle) {
        algoData.activity_level = userLifeStyle[0].get('ActivityLevel');
      }
    ),
    new Parse.Query('Demographics').equalTo('username', username).find().then(
      function (userDemographics) {
        var dob = moment(userDemographics[0].get('DOB'), "MM/DD/YY").format("MM/DD/YYYY");
        algoData.height = userDemographics[0].get('HEIGHT');
        algoData.weight = userDemographics[0].get('WEIGHT');
        algoData.dob = dob;
        algoData.ethnicity = userDemographics[0].get('ETHNICITY');
        algoData.gender_id = userDemographics[0].get('GENDER');
        algoData.somatotype = userDemographics[0].get('SOMATOTYPE');
        algoData.waist_cf = '70';
      }
    ),
    new Parse.Query('Diet').equalTo('username', username).find().then(
      function (userDiet) {
        algoData.food_group_4 = userDiet[0].get('CALCIUM');
        algoData.food_group_3 = userDiet[0].get('FRUITS_VEG');
        algoData.food_group_2 = userDiet[0].get('GRAIN');
        algoData.food_group_1 = userDiet[0].get('HABITS');
        algoData.food_group_5 = userDiet[0].get('MEATS');
        algoData.food_group_6 = userDiet[0].get('SAT_FAT');
        algoData.food_group_7 = userDiet[0].get('SUGAR');
      }
    ),
    new Parse.Query('Stress_Level').equalTo('username', username).find().then(
      function (userStressLevel) {
        algoData.stress_level = userStressLevel[0].get('STRESS_LEVEL');
      }
    )
  ];


  return Parse.Promise.when(completion).then(function () {
    return algoData;
  });
};

var completionAccess = function (currentUser) {

  var username = currentUser.get('username');

  var access = [];

  setAccess = function (data) {
    if (data[0].get('COMPLETIONRATE') === '100') {
      access.push(true);
    } else access.push(false);
  };


  var completion = [
    new Parse.Query('Lifestyle').equalTo('username', username).find().then(
      this.setAccess
    ),

    new Parse.Query('Demographics').equalTo('username', username).find().then(
      this.setAccess
    ),

    new Parse.Query('Health_Beliefs').equalTo('username', username).find().then(
      this.setAccess
    ),

    new Parse.Query('Diet').equalTo('username', username).find().then(
      this.setAccess
    ),

    new Parse.Query('Stress_Level').equalTo('username', username).find().then(
      this.setAccess
    )
  ];


  return Parse.Promise.when(completion).then(function () {
    if (_.indexOf(access, false) === -1) {
      return true;
    }
    return false;
  });

};



/**
 * This function is called when GitHub redirects the user back after
 *   authorization.  It calls back to GitHub to validate and exchange the code
 *   for an access token.
 */
var getGitHubAccessToken = function(code) {
  var body = querystring.stringify({
    client_id: githubClientId,
    client_secret: githubClientSecret,
    code: code
  });
  return Parse.Cloud.httpRequest({
    method: 'POST',
    url: githubValidateEndpoint,
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Parse.com Cloud Code'
    },
    body: body
  });
}

/**
 * This function calls the githubUserEndpoint to get the user details for the
 * provided access token, returning the promise from the httpRequest.
 */
var getGitHubUserDetails = function(accessToken) {
  return Parse.Cloud.httpRequest({
    method: 'GET',
    url: githubUserEndpoint,
    params: {
      access_token: accessToken
    },
    headers: {
      'User-Agent': 'Parse.com Cloud Code'
    }
  });
}

/**
 * This function checks to see if this GitHub user has logged in before.
 * If the user is found, update the accessToken (if necessary) and return
 *   the users session token.  If not found, return the newGitHubUser promise.
 */
var upsertGitHubUser = function(accessToken, githubData) {
  var query = new Parse.Query(TokenStorage);
  query.equalTo('githubId', githubData.id);
  query.ascending('createdAt');
  // Check if this githubId has previously logged in, using the master key
  return query.first({
    useMasterKey: true
  }).then(function (tokenData) {
    // If not, create a new user.
    if (!tokenData) {
      return newGitHubUser(accessToken, githubData);
    }
    // If found, fetch the user.
    var user = tokenData.get('user');
    return user.fetch({
      useMasterKey: true
    }).then(function (user) {
      // Update the accessToken if it is different.
      if (accessToken !== tokenData.get('accessToken')) {
        tokenData.set('accessToken', accessToken);
      }
      /**
       * This save will not use an API request if the token was not changed.
       * e.g. when a new user is created and upsert is called again.
       */
      return tokenData.save(null, {
        useMasterKey: true
      });
    }).then(function(obj) {
      // Return the user object.
      return Parse.Promise.as(user);
    });
  });
}

/**
 * This function creates a Parse User with a random login and password, and
 *   associates it with an object in the TokenStorage class.
 * Once completed, this will return upsertGitHubUser.  This is done to protect
 *   against a race condition:  In the rare event where 2 new users are created
 *   at the same time, only the first one will actually get used.
 */
var newGitHubUser = function(accessToken, githubData) {
  var user = new Parse.User();
  // Generate a random username and password.
  var username = new Buffer(24);
  var password = new Buffer(24);
  _.times(24, function(i) {
    username.set(i, _.random(0, 255));
    password.set(i, _.random(0, 255));
  });
  user.set("username", username.toString('base64'));
  user.set("password", password.toString('base64'));
  // Sign up the new User
  return user.signUp().then(function(user) {
    // create a new TokenStorage object to store the user+GitHub association.
    var ts = new TokenStorage();
    ts.set('githubId', githubData.id);
    ts.set('githubLogin', githubData.login);
    ts.set('accessToken', accessToken);
    ts.set('user', user);
    ts.setACL(restrictedAcl);
    // Use the master key because TokenStorage objects should be protected.
    return ts.save(null, {
      useMasterKey: true
    });
  }).then(function(tokenStorage) {
    return upsertGitHubUser(accessToken, githubData);
  });
}

//algoithm function begins
test_algo = require("cloud/test_algorithm")
Parse.Cloud.define("algo", function(request, response) {
  test_algo.test(response.success);
});
//algoithm function ends