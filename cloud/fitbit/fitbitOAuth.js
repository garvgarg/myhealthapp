var saveFitBitOAuthData = function(req, res) {


	// get records for current user
	new Parse.Query('OAuthFitbit').equalTo('user_owner', req.user).find().then(function(resultuser) {
		// check if record for current user exists
		if (resultuser[0]) {

			// update record
			resultuser[0].set('Consumer_Key', req.params.consumer_key);
			resultuser[0].set('OAuth_Token', req.params.oauth_token);
			resultuser[0].set('OAuth_Secret_Token', req.params.oauth_secret_token);
			resultuser[0].save().then(function() {
				res.success('data saved');
			});
		} else {

			// create new record 
			var oauthFitbit = Parse.Object.extend("OAuthFitbit");
			var oauthdata = new oauthFitbit();
			oauthdata.set('Consumer_Key', req.params.consumer_key);
			oauthdata.set('OAuth_Token', req.params.oauth_token);
			oauthdata.set('OAuth_Secret_Token', req.params.oauth_secret_token);
			oauthdata.set('user_owner', req.user);
			oauthdata.save().then(function() {
				res.success('data saved');
			});

		}
	});



};



//exports

exports.saveFitBitOAuthData = saveFitBitOAuthData;