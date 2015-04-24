var http = require('http');
var _ = require('underscore');
var moment = require('moment');

/**
 * Safe division preventing division to zero
 *
 * @param a
 * @param b
 * @returns {number}
 * @private
 */
function _safe_perc(a, b) {
  if (b !== 0) {
    return Math.round(a / b * 100);
  }
  return 0;
}

/**
 * Calculate Challenges Completion Rate over 2 week periods
 *
 * @param req
 * @param res
 */
function calculateChallengesCompletionRateOverPeriod(req, status) {

  //var currentUser = req.user;
  var challengesArray = [];
  var usersChallengesArray = [];
  var resultsArray = [];
  var usersPromises = [];
  var usersSavePromises = [];


  new Parse.Query('User').find().then(function(allusers) {
    // Instantiate UserChallenges object
    _.each(allusers, function(currentUser) {

      var UserChallenges = Parse.Object.extend('UserChallenges');

      // Fetch all challenges
      var Challenges = Parse.Object.extend("Challenges");
      var challengesQuery = new Parse.Query(Challenges);
      challengesQuery.include(['GroupID', 'GroupID.FocusID']);

      challengesArray.push(challengesQuery.find().then(function(challenges) {

        var query = new Parse.Query(UserChallenges);

        query.equalTo('user', currentUser);

        // Fetch challenges associated with current user
        // and filter them one-by-one
        usersChallengesArray.push(query.find().then(function(data) {
          // ASSUMPTION: Focus id is predefined entitites
          var results = {
            'completed_2weeks': {
              1: [],
              2: [],
              3: []
            },
            'completed_4weeks': {
              1: [],
              2: [],
              3: []
            },
            'accepted_2weeks': {
              1: [],
              2: [],
              3: []
            },
            'accepted_4weeks': {
              1: [],
              2: [],
              3: []
            }
          };
          _.each(data, function(e) {

            // Get challenge from challenges list
            var currentChallenge = _.find(challenges, function(c) {
              return c.get('challengeId') == e.get('challengeId');
            });

            if (currentChallenge) {

              var currentFocus = currentChallenge.get('GroupID').get('FocusID').get("focusId");
              // Calculate amount of day passed since the challenge was completed
              var days = moment().diff(e.get('completedAt'), 'days');
              if (e.get('completed')) {
                if (days < 14) {
                  results['completed_2weeks'][currentFocus].unshift(e);
                }
                if (days < 28 && days >= 14) {
                  results['completed_4weeks'][currentFocus].unshift(e);
                }
              }

              // Calculate amount of day passed since the challenge was accepted
              var days2 = moment().diff(e.get('acceptedAt'), 'days');

              if (days2 < 14) {
                results['accepted_2weeks'][currentFocus].unshift(e);
              }
              if (days2 < 28 && days2 >= 14) {
                results['accepted_4weeks'][currentFocus].unshift(e);
              }
            }
          });

          results['completionRate_2weeks'] = {};
          results['completionRate_4weeks'] = {};

          // For each focus id
          // ASSUMPTION: Focus id is predefined entitites
          _.each([1, 2, 3], function(focusId) {
            results['completionRate_2weeks'][focusId] = _safe_perc(results['completed_2weeks'][focusId].length, results['accepted_2weeks'][focusId].length);
            results['completionRate_4weeks'][focusId] = _safe_perc(results['completed_4weeks'][focusId].length, results['accepted_4weeks'][focusId].length);
          });
          resultsArray.push(results);

          usersPromises.push(

            new Parse.Query('UserTable').equalTo('Username', currentUser).find().then(function(resultuser) {

              if (resultuser[0]) {

                resultuser[0].set('PercentDietChallenges', results.completionRate_2weeks[2]);
                resultuser[0].set('PercentFitnessChallenges', results.completionRate_2weeks[1]);
                resultuser[0].set('PercentStressChallenges', results.completionRate_2weeks[3]);

                resultuser[0].set('PercentDietChallengesLast', results.completionRate_4weeks[2]);
                resultuser[0].set('PercentFitnessChallengesLast', results.completionRate_4weeks[1]);
                resultuser[0].set('PercentStressChallengesLast', results.completionRate_4weeks[3]);


                usersSavePromises.push(resultuser[0].save());
              } else {



                var UT = Parse.Object.extend("UserTable");
                var usertable = new UT();

                usertable.set('PercentDietChallenges', results.completionRate_2weeks[2]);
                usertable.set('PercentFitnessChallenges', results.completionRate_2weeks[1]);
                usertable.set('PercentStressChallenges', results.completionRate_2weeks[3]);

                usertable.set('PercentDietChallengesLast', results.completionRate_4weeks[2]);
                usertable.set('PercentFitnessChallengesLast', results.completionRate_4weeks[1]);
                usertable.set('PercentStressChallengesLast', results.completionRate_4weeks[3]);


                usertable.set('Username', currentUser);

                usersSavePromises.push(usertable.save());

              }

            })
          );



        }));
      }));



    });
    Parse.Promise.when(challengesArray).then(function() {
      Parse.Promise.when(usersChallengesArray).then(function() {
        Parse.Promise.when(usersPromises).then(function() {
          Parse.Promise.when(usersSavePromises).then(function() {
            status.success('Average data successfully updated');
          });
        });

      });
    });


  });

}


exports.getChallengesCompletionRateOverPeriod = calculateChallengesCompletionRateOverPeriod;