var expect = require("expect.js");

var algo = require('../cloud/algorithm/interface.js')

describe('Message', function () {
  describe('response', function () {
    it('should have a function defined', function () {
      expect(algo.get_results).to.be.a('function');
    });
  });
});