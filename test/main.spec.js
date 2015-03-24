var _ = require('lodash');

var chai = require("chai");
var expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");

var Parse = require("parse");

chai.use(chaiAsPromised);


var algo = require('../cloud/algorithm/interface.js')

describe('Cloud points', function () {
  describe('for Weight Loss Algorithm', function () {
    it('should have proxy methods defined', function () {
      var methodsCount = 0;

      _.forEach(['getChallenges', 'getAlgoData', 'fetchDataFromAlgorithm', 'isProfileComplete'], function (method) {
        expect(algo[method]).to.be.a('function');
        methodsCount++;
      });

      expect(methodsCount).to.equal(4);
    });

    it('should return proper value on getChallenges call', function () {

      var res = {};
      var req = {};

      // Shouldn't have any exceptions on empty call
    });
  });

});