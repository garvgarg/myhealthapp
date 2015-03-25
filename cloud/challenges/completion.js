var http = require('http');
var _ = require('underscore');
var moment = require('moment');
var Parse = require('parse').Parse;
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
function calculateChallengesCompletionRateOverPeriod(req, res) {

  var currentUser = req.user;

  // Instantiate UserChallenges object
  var UserChallenges = Parse.Object.extend('UserChallenges');

  // Fetch all challenges
  var Challenges = Parse.Object.extend("Challenges");
  var challengesQuery = new Parse.Query(Challenges);
  challengesQuery.include(['GroupID', 'GroupID.FocusID']);
  challengesQuery.find().then(function (challenges) {
    var query = new Parse.Query(UserChallenges);

    query.equalTo('user', currentUser);

    // Fetch challenges associated with current user
    // and filter them one-by-one
    query.find().then(function (data) {
      // ASSUMPTION: Focus id is predefined entitites
      var results = {
        'completed_2weeks': {1: [], 2: [], 3: []},
        'completed_4weeks': {1: [], 2: [], 3: []},
        'accepted_2weeks': {1: [], 2: [], 3: []},
        'accepted_4weeks': {1: [], 2: [], 3: []}
      };
      _.each(data, function (e) {

        // Get challenge from challenges list
        var currentChallenge = _.find(challenges, function (c) {
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
      _.each([1, 2, 3], function (focusId) {
        results['completionRate_2weeks'][focusId] = _safe_perc(results['completed_2weeks'][focusId].length, results['accepted_2weeks'][focusId].length);
        results['completionRate_4weeks'][focusId] = _safe_perc(results['completed_4weeks'][focusId].length, results['accepted_4weeks'][focusId].length);
      });

      res.success(results);

    });
  });
}


exports.getChallengesCompletionRateOverPeriod = calculateChallengesCompletionRateOverPeriod;
