var http = require('http');
var _ = require('underscore');
var moment = require('moment');



/**
 * Calculate average data from Fitbit
 *
 * @param req request object
 * @param res response object
 */
var calculateAverageFromFitBit = function(req, status) {

	Parse.Cloud.useMasterKey();

	// get all users in application
	new Parse.Query('User').find().then(function(allusers) {

		var allPromises = [];
		var usersPromises = [];
		var usersSavePromises = [];
		


		_.each(allusers, function(user) {

			var dataFrom2Weeks = [];
			var promiseArray = [];

			for (var i = 1; i < 15; i++) {


				// get start and end of day during 2 weeks
				var startDayForResult = moment().subtract('days', i).sod().format();
				var startdate = new Date(startDayForResult);
				var endDayForResult = moment().subtract('days', i).eod().format();
				var enddate = new Date(endDayForResult);

				// get data from fitbit for every day during 2 weeks
				promiseArray.push(new Parse.Query('ActivitiesImport')
					.equalTo('user', user)
					.greaterThan("Date", startdate)
					.lessThan("Date", enddate)
					.find()
					.then(
						function(resultOfDay) {
							dataFrom2Weeks.push(resultOfDay[0]);
						}
					));
			}

			// create array of promises which collect all data from fitbit to arrays 
			allPromises.push(Parse.Promise.when(promiseArray).then(function() {
				var calories = [],
					exertivehr = [],
					normalhr = [],
					restinghr = [],
					steps = [],
					totalsleepminutes = [],
					totalsleeprecords = [],
					totaltimeinbed = [];

				_.each(dataFrom2Weeks, function(fromDay) {
					if (fromDay) {
						if (typeof(fromDay.get('Calories')) !== 'undefined') {
							calories.push(fromDay.get('Calories'));
						}
						if (typeof(fromDay.get('ExertiveHR')) !== 'undefined') {
							exertivehr.push(fromDay.get('ExertiveHR'));
						}
						if (typeof(fromDay.get('NormalHR')) !== 'undefined') {
							normalhr.push(fromDay.get('NormalHR'));
						}
						if (typeof(fromDay.get('RestingHR')) !== 'undefined') {
							restinghr.push(fromDay.get('RestingHR'));
						}
						if (typeof(fromDay.get('Steps')) !== 'undefined') {
							steps.push(fromDay.get('Steps'));
						}
						if (typeof(fromDay.get('TotalSleepMinutes')) !== 'undefined') {
							totalsleepminutes.push(fromDay.get('TotalSleepMinutes'));
						}
						if (typeof(fromDay.get('TotalSleepRecords')) !== 'undefined') {
							totalsleeprecords.push(fromDay.get('TotalSleepRecords'));
						}
						if (typeof(fromDay.get('TotalTimeInBed')) !== 'undefined') {
							totaltimeinbed.push(fromDay.get('TotalTimeInBed'));
						}

					}

				});

				// return average of all records in array
				var average = function(arr) {
					return _.reduce(arr, function(memo, num) {
						return memo + num;
					}, 0) / (arr.length === 0 ? 1 : arr.length);
				}

				// create array of promises which create new or update 
				// record in UserTable with new average data
				usersPromises.push(

					new Parse.Query('UserTable').equalTo('Username', user).find().then(function(resultuser) {

						if (resultuser[0]) {
						
							if (typeof(resultuser[0].get('DailyHR')) !== 'undefined') {
								resultuser[0].set('DailyHRLast', resultuser[0].get('DailyHR'));
							}
							if (typeof(resultuser[0].get('DailyKcalBurn')) !== 'undefined') {
								resultuser[0].set('DailyKcalBurnLast', resultuser[0].get('DailyKcalBurn'));
							}
							if (typeof(resultuser[0].get('DailySleep')) !== 'undefined') {
								resultuser[0].set('DailySleepLast', resultuser[0].get('DailySleep'));
							}
							if (typeof(resultuser[0].get('DailySteps')) !== 'undefined') {
								resultuser[0].set('DailyStepsLast', resultuser[0].get('DailySteps'));
							}
							resultuser[0].set('DailyHR', average(normalhr));
							resultuser[0].set('DailyKcalBurn', average(calories));
							resultuser[0].set('DailySleep', average(totalsleepminutes));
							resultuser[0].set('DailySteps', average(steps));

							usersSavePromises.push(resultuser[0].save());
						} else {
							
							
							
							var UT = Parse.Object.extend("UserTable");
							var usertable = new UT();
							
							usertable.set('DailyKcalBurn', average(calories));
							usertable.set('DailySleep', average(totalsleepminutes));
							usertable.set('DailySteps', average(steps));
							usertable.set('Username', user);

							usersSavePromises.push(usertable.save());

						}

					})
				);


			}));



		});

		Parse.Promise.when(allPromises).then(function() {
			Parse.Promise.when(usersPromises).then(function() {
				Parse.Promise.when(usersSavePromises).then(function() {
					status.success('Average data successfully updated');
				});
			});
		});


	});

};



//exports

exports.calculateAverageFromFitBit = calculateAverageFromFitBit;