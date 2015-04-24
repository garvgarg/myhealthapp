var _ = require('underscore'),
  chai = require("chai"),
  expect = chai.expect,
  chaiAsPromised = require("chai-as-promised"),
  Parse = require('parse').Parse,
  ParseMock = require('parse-mock'),
  algo = require('../cloud/algorithm/interface.js'),
  completion = require('../cloud/challenges/completion.js');

chai.use(chaiAsPromised);

describe('Cloud points', function () {

  afterEach(function () {
    ParseMock.clearStubs();
  });

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

  describe('for Challenges completion rate', function () {
    it('should calculate items properly', function () {
      var user = new Parse.Object('User', {id: 123}),
        challenge = new Parse.Object('Challenges'), //todo: add GroupID, GroupID.FocusID relations
        userChallenge = new Parse.Object('UserCallenges'),
        req = {user: user},
        res = {};

      ParseMock.stubQueryFind(function () {
        return {
          Challenges: [challenge],
          UserChallenges: [userChallenge]
        }[this.className];
      });

      completion.getChallengesCompletionRateOverPeriod(req, res);
    });
  });
});