var http = require('http');

/**
 * Gathers required data for algorithm from parse.com database into a single dictionary
 *
 * @param currentUser
 * @returns {Parse.Promise}
 */
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


/**
 * Checks if current user has completed profile
 *
 * @param currentUser
 * @returns {bool} is profile complete
 */
var isProfileComplete = function (currentUser) {

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
 * Fetches data from heroku-based algorithm and put the data into
 *
 * @param req request object
 * @param res response object
 */
var fetchDataFromAlgorithm = function (req, res) {

  var currentUser = req.user;
  var fetchResponse = {
    status: '200',
    statusMessage: 'Successfully fetched'
  };

  var url = "http://projectvision-health2.herokuapp.com/api";

  isProfileComplete(currentUser).then(function (access) {
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
            ];
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
      fetchResponse.statusMessage = 'Profile is not completed yet';
      res.success(fetchResponse);
    }

  });
};

/**
 * Returns list of challenges for a client
 *
 * @param req
 * @param res
 */
var getChallenges = function (req, res) {
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

};

//exports
exports.getChallenges = getChallenges;
exports.getAlgoData = getAlgoData;
exports.fetchDataFromAlgorithm = fetchDataFromAlgorithm;
exports.isProfileComplete = isProfileComplete;
