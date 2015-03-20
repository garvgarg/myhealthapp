var http = require('http');
var _ = require('underscore');
var moment = require('moment');

/**
 * Calculate Challenges Completion Rate over 2 week periods
 *
 * @param req
 * @param res
 */
function calculateChallengesCompletionRateOverPeriod(req, res) {

  var currentUser = req.user;

  // Instantiate UserChallenges object
  var UserChallenges = Parse.Object.extend('UserChallenges');
  var query = new Parse.Query(UserChallenges);

  query.equalTo('user', currentUser);

  // Fetch challenges associated with current user
  // and filter them one-by-one
  query.find().then(function (data) {
    var results = {'completed_2weeks': [], 'completed_4weeks': [], 'accepted_2weeks': [], 'accepted_4weeks': []};
    _.each(data, function (e) {

      // Calculate amount of day passed since the challenge was completed
      var days = moment().diff(e.get('completedAt'), 'days');
      if (e.get('completed')) {
        if (days < 14) {
          results['completed_2weeks'].unshift(e);
        }
        if (days < 28 && days >= 14) {
          results['completed_4weeks'].unshift(e);
        }
      }

      // Calculate amount of day passed since the challenge was accepted
      var days2 = moment().diff(e.get('acceptedAt'), 'days');

      if (days2 < 14) {
        results['accepted_2weeks'].unshift(e);
      }
      if (days2 < 28 && days2 >= 14) {
        results['accepted_4weeks'].unshift(e);
      }
    });

    // Prevent division to zero
    if (results['accepted_2weeks'].length) {
      results['completionRate_2weeks'] = Math.round(results['completed_2weeks'].length / results['accepted_2weeks'].length * 100);
    } else {
      results['completionRate_2weeks'] = 0;
    }

    // Prevent division to zero
    if (results['accepted_4weeks'].length) {
      results['completionRate_4weeks'] = Math.round(results['completed_4weeks'].length / results['accepted_4weeks'].length * 100);
    } else {
      results['completionRate_4weeks'] = 0;
    }

    res.success(results);
  })
}


exports.getChallengesCompletionRateOverPeriod = calculateChallengesCompletionRateOverPeriod;
