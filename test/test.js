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

  describe('basic methods', function() {
    it('should be able to `define` an instance', function() {
      var synth = require('../index.js')({});

      synth.define('myObject', {
        construct: function(){}
      });

      return done();
    });

    it('should be able to `define` and then `create` an instance', function() {
      var synth = require('../index.js')({});

      synth.define('myObject', {
        construct: function(){}
      });

      synth.create('myObject', function(myObject) {
        assert(myObject);
        return done();
      });
    });
  });
});