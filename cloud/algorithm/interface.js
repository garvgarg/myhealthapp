/*
 * author: ankush.shah.nitk@gmail.com
 * date: 29th Jan 2015
 * desc: nodejs interface for the HealthApp algorithm
 */

//requirements
var querystring = require('querystring');
var http = require('http');

function get_parameters(data) {
	/*
	 * function to convert json data into url 
	 * encode string
	 */
	var url_encoded_parameters = querystring.stringify(data);
	return url_encoded_parameters;
}

function get_results(data, todo) {
	/*
	 * making call to the original api
	 * builds the final url
	 * make an http get request on the url
	 * execute "todo" on the returned results
	 */
	var api = "http://projectvision-health2.herokuapp.com/api";
	var parameters = get_parameters(data);
	var url = api + parameters;

	Parse.Cloud.httpRequest({
  		url: api,
  		params: data,
  		success: function(httpResponse) {
    			todo(httpResponse.text);
  			},
  		error: function(httpResponse) {
    			console.error('Request failed with response code ' + httpResponse.status);
  			}
		});
	  
	 /*var post_req = http.get(url, function(res) {
	      res.setEncoding('utf8');
	      res.on('data', function (chunk) {
	    	  todo(chunk);
	      });
	  });*/
	
}

//exports
exports.get_results = get_results;
