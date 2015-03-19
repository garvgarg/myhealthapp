var expect = require("chai").expect;
var _ = require('lodash');

var algo = require('../cloud/algorithm/interface.js')

describe('Cloud points', function () {
  describe('Weight loss algorithm proxy', function () {
    it('should have methods defined', function () {
      var methodsCount = 0;

      _.forEach(['getChallenges', 'getAlgoData', 'fetchDataFromAlgorithm', 'isProfileComplete'], function (method) {
        expect(algo[method]).to.be.a('function');
        methodsCount++;
      });

      expect(methodsCount).to.equal(4);
    });
  });
});