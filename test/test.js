var assert = require('assert');

describe('moog', function() {
  it('should exist', function(done) {
    var moog = require('../index.js')({ });

    assert(moog);
    return done();
  });

  describe('methods', function() {
    it('should have a `define` method', function(done) {
      var moog = require('../index.js')({});
      assert(moog.define);
      return done();
    });

    it('should have a `redefine` method', function(done) {
      var moog = require('../index.js')({});
      assert(moog.redefine);
      return done();
    });

    it('should have a `create` method', function(done) {
      var moog = require('../index.js')({});
      assert(moog.create);
      return done();
    });

    it('should have a `isDefined` method', function(done) {
      var moog = require('../index.js')({});
      assert(moog.isDefined);
      return done();
    });
  });

  describe('basic methods', function() {
    it('should be able to `define` an instance', function() {
      var moog = require('../index.js')({});

      moog.define('myObject', {
        construct: function(){}
      });

      return done();
    });

    it('should be able to `define` and then `create` an instance', function() {
      var moog = require('../index.js')({});

      moog.define('myObject', {
        construct: function(){}
      });

      moog.create('myObject', function(myObject) {
        assert(myObject);
        return done();
      });
    });
  });
});