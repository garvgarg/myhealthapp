/*
 * author: ankush.shah.nitk@gmail.com
 * date: 29th Jan 2015
 * desc: a sample script demonstrating calling of the algorithm module
 */

algo_io = require("cloud/algorithm/interface")

function test(todo) {
  // Build the post string from an object
  var data = {
	'dob' : '10/15/1989',
	'gender_id': '1',
	'ethinicity': '1',
	'somatotype' : '1',
	'activity_level': '10',
	'height':'72',
	'weight':'174',
	'waist_cf':'30',
	'stress_level':'25',
	'food_group_1':'3',
	'food_group_2':'3',
	'food_group_3':'3',
	'food_group_4':'3',
	'food_group_5':'3',
	'food_group_6':'3',
	'food_group_7':'3',
  	};
  
  algo_io.get_results(data, todo);
 }

exports.test = test
