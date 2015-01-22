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

    it('should have a `createAll` method', function(done) {
      var moog = require('../index.js')({});
      assert(moog.createAll);
      return done();
    });

    it('should have a `bridge` method', function(done) {
      var moog = require('../index.js')({});
      assert(moog.bridge);
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
    });

    it('should be able to `define` and then `create` an instance', function(done) {
      var moog = require('../index.js')({});

      moog.define('myObject', {
        color: 'blue',
        construct: function(self, options) {
          self._options = options;
        }
      });

      moog.create('myObject', {}, function(err, myObject) {
        assert(!err);
        assert(myObject);
        assert(myObject._options.color === 'blue');
        return done();
      });
    });

    it('should be able to `define` multiple types using an object', function(done) {
      var moog = require('../index.js')({});

      moog.define({
        'myObjectOne': {
          construct: function(){}
        },
        'myObjectTwo': {
          construct: function(){}
        }
      });

      moog.create('myObjectOne', {}, function(err, myObject) {
        if (err) {
          console.error(err);
        }
        assert(!err);
        assert(myObject);
        return done();
      });
    });

    it('should be able to override a default option value at create time', function(done) {
      var moog = require('../index.js')({});

      moog.define('myObject', {
        color: 'blue',
        construct: function(self, options) {
          self._options = options;
        }
      });

      moog.create('myObject', { color: 'purple' }, function(err, myObject) {
        assert(!err);
        assert(myObject);
        assert(myObject._options.color === 'purple');
        return done();
      });
    });

    it('should be able to create a subclass with expected default option behavior', function(done) {
      var moog = require('../index.js')({});

      moog.define('baseClass', {
        color: 'blue',
        construct: function(self, options) {
          self._options = options;
        }
      });

      moog.define('subClass', {
        color: 'red',
        extend: 'baseClass'
      });

      moog.create('subClass', {}, function(err, myObject) {
        if (err) {
          console.error(err);
        }
        assert(!err);
        assert(myObject);
        assert(myObject._options.color === 'red');
        return done();
      });
    });

    it('default base class should take effect if configured', function(done) {
      var moog = require('../index.js')({ defaultBaseClass: 'baseClass' });

      moog.define('baseClass', {
        construct: function(self, options) {
          self._options = options;
        }
      });

      moog.define('subClass', {
        color: 'red',
        extend: 'baseClass'
      });

      moog.create('subClass', {}, function(err, myObject) {
        if (err) {
          console.error(err);
        }
        assert(!err);
        assert(myObject);
        // What we are testing is that _options got set at all
        // (see construct for baseClass)
        assert(myObject._options.color === 'red');
        assert(myObject.__meta);
        assert(myObject.__meta[0]);
        assert(myObject.__meta[0].name === 'baseClass');
        assert(myObject.__meta[1].name === 'subClass');
        return done();
      });
    });

    it('should create multiple modules using `createAll`', function(done) {
      var moog = require('../index.js')({});

      moog.define('objectOne', {
        construct: function(self, options) { }
      });

      moog.define('objectTwo', {
        construct: function(self, options) { }
      });

      moog.createAll({}, {}, function(err, modules) {
        if (err) {
          console.error(err);
        }
        assert(!err);
        assert(modules);
        assert(modules.objectOne);
        assert(modules.objectTwo);
        return done();
      });
    });

    it('should allow modules to reference each other using `bridge`', function(done) {
      var moog = require('../index.js')({});

      moog.define('objectOne', {
        construct: function(self, options) {
          self._options = options;
          self.setBridge = function(modules) {
            self._otherModule = modules.objectOne;
          };
        }
      });

      moog.define('objectTwo', {
        color: 'red',
        construct: function(self, options) {
          self._options = options;
          self.setBridge = function(modules) {
            self._otherModule = modules.objectTwo;
          };
        }
      });

      moog.createAll({}, {}, function(err, modules) {
        if (err) {
          console.error(err);
        }
        assert(!err);
        moog.bridge(modules);
        assert(modules.objectOne._otherModule);
        assert(modules.objectTwo._otherModule);
        return done();
      });
    });
  });

  describe('error handling', function() {

  });
});
