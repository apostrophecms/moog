var assert = require('assert');

describe('synthesizer', function() {
  it('should exist', function(done) {
    var synth = require('../index.js')({ });

    assert(synth);
    return done();
  });

  describe('methods', function() {
    it('should have a `define` method', function(done) {
      var synth = require('../index.js')({});
      assert(synth.define);
      return done();
    });

    it('should have a `redefine` method', function(done) {
      var synth = require('../index.js')({});
      assert(synth.redefine);
      return done();
    });

    it('should have a `create` method', function(done) {
      var synth = require('../index.js')({});
      assert(synth.create);
      return done();
    });

    it('should have a `isDefined` method', function(done) {
      var synth = require('../index.js')({});
      assert(synth.isDefined);
      return done();
    });
  });
});