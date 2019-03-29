const assert = require('assert');

describe('moog', function() {
  it('should exist', function() {
    const moog = require('../index.js')({ });

    assert(moog);
  });

  it('should be initialized without arguments', function() {
    const moog = require('../index.js')();
    assert(moog);
  });

  describe('methods', function() {
    it('should have a `define` method', function() {
      const moog = require('../index.js')({});
      assert(moog.define);
    });

    it('should have a `redefine` method', function() {
      const moog = require('../index.js')({});
      assert(moog.redefine);
    });

    it('should have a `create` method', function() {
      const moog = require('../index.js')({});
      assert(moog.create);
    });

    it('should have an `isDefined` method', function() {
      const moog = require('../index.js')({});
      assert(moog.isDefined);
    });
  });

  describe('defining and creating', function() {
    it('should be able to `define` a class', function() {
      const moog = require('../index.js')({});

      moog.define('myObject', {
        construct: function() {}
      });
    });

    it('should be able to `define` and then `create` an instance', async function() {
      const moog = require('../index.js')({});

      moog.define('myObject', {
        color: 'blue',
        construct: function(self, options) {
          self._options = options;
        }
      });

      const myObject = await moog.create('myObject', {});
      assert(myObject);
      assert(myObject._options.color === 'blue');
    });

    it('should be able to `define` multiple classes using an object', async function() {
      const moog = require('../index.js')({});

      moog.define({
        'myObjectOne': {
          construct: function(self, options) {}
        },
        'myObjectTwo': {
          construct: function(self, options) {}
        }
      });

      const myObject = await moog.create('myObjectOne', {});
      assert(myObject);
    });
  });

  describe('`create` and `createSync` syntax', function() {
    it('should `createSync` without options', function() {
      const moog = require('../index.js')();

      moog.define('myClass', {
        construct: function(self, options) { }
      });

      var myObject = moog.createSync('myClass');
      assert(myObject);
      assert(myObject.__meta.name === 'myClass');
    });

    it('should `create` without options', async function() {
      const moog = require('../index.js')();

      moog.define('myClass', {
        construct: function(self, options) { }
      });

      const myObj = await moog.create('myClass');
      assert(myObj);
      assert(myObj.__meta.name === 'myClass');
    });

  });

  describe('explicit subclassing behavior', function() {

    it('should be able to override a default option value at create time', async function() {
      const moog = require('../index.js')({});

      moog.define('myObject', {
        color: 'blue',
        construct: function(self, options) {
          self._options = options;
        }
      });

      const myObject = await moog.create('myObject', { color: 'purple' });
      assert(myObject);
      assert(myObject._options.color === 'purple');
    });

    it('should be able to create a subclass with expected default option behavior (async)', async function() {
      const moog = require('../index.js')({});

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

      const myObject = await moog.create('subClass', {});
      assert(myObject);
      assert(myObject._options.color === 'red');
    });

    it('should be able to create a subclass with expected default option behavior (sync)', function() {
      const moog = require('../index.js')({});

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

      const myObject = moog.createSync('subClass', {});
      assert(myObject);
      assert(myObject._options.color === 'red');
    });

    it('should report an error gracefully if subclass to be extended does not exist (async)', async function() {
      const moog = require('../index.js')({});

      // base class does not actually exist
      moog.define('subClass', {
        color: 'red',
        extend: 'baseClass'
      });

      try {
        await moog.create('subClass', {});
        assert(false);
      } catch (e) {
        assert(e);
        assert(e.toString().match(/baseClass/));
      }
    });

    it('should throw an exception gracefully if subclass to be extended does not exist (sync)', function() {
      const moog = require('../index.js')({});

      // base class does not actually exist
      moog.define('subClass', {
        color: 'red',
        extend: 'baseClass'
      });

      try {
        moog.createSync('subClass', {});
        assert(false);
      } catch (e) {
        assert(e);
        assert(e.toString().match(/baseClass/));
      }
    });

    it('should be able to `extend` a subclass into yet another subclass', async function() {
      const moog = require('../index.js')({});

      moog.define('baseClass', {
        color: 'blue',
        construct: function(self, options) {
          self._options = options;
        }
      });

      moog.define('subClassOne', {
        color: 'red',
        extend: 'baseClass'
      });

      moog.define('subClassTwo', {
        color: 'green',
        extend: 'subClassOne'
      });

      const myObject = await moog.create('subClassTwo', {});
      assert(myObject);
      assert(myObject._options.color === 'green');
    });

    it('default base class should take effect if configured', async function() {
      const moog = require('../index.js')({ defaultBaseClass: 'baseClass' });

      moog.define('baseClass', {
        construct: function(self, options) {
          // Moving these asserts here tests that meta is available
          // in its entirety even in base class constructor. -Tom
          assert(self.__meta);
          assert(self.__meta.chain);
          assert(self.__meta.chain[0]);
          assert(self.__meta.chain[0].name === 'baseClass');
          assert(self.__meta.chain[1].name === 'subClass');
          assert(self.__meta.name === 'subClass');
          self._options = options;
        }
      });

      moog.define('subClass', {
        color: 'red'
      });

      const myObject = await moog.create('subClass', {});
      assert(myObject);
      // What we are testing is that _options got set at all
      // (see construct for baseClass)
      assert(myObject._options.color === 'red');
    });

    it('default base class should not take effect if extend is explicitly set to false', async function() {
      const moog = require('../index.js')({ defaultBaseClass: 'baseClass' });

      moog.define('baseClass', {
        construct: function(self, options) {
          self._options = options;
        }
      });

      moog.define('subClass', {
        color: 'red',
        extend: false
      });

      const myObject = await moog.create('subClass', {});
      assert(myObject);
      assert(!myObject._options);
    });

    // ==================================================
    // `redefine` AND `isDefined`
    // ==================================================

    it('should allow a module to be redefined', async function() {
      const moog = require('../index.js')({});

      moog.define('myObject', {
        construct: function(self, options) {
          self._oldProperty = true;
        }
      });

      moog.redefine('myObject', {
        construct: function(self, options) {
          self._newProperty = true;
        }
      });

      const myObject = await moog.create('myObject', {});
      assert(myObject);
      assert(!myObject._oldProperty);
      assert(myObject._newProperty);
    });

    it('should find a module definition using `isDefined`', function() {
      const moog = require('../index.js')({});

      moog.define('myObject', {
        construct: function(self, options) {
          self._oldProperty = true;
        }
      });

      assert(moog.isDefined('myObject'));
    });

    it('should NOT find a non-existant module definition using `isDefined`', function() {
      const moog = require('../index.js')({});

      assert(!moog.isDefined('myObject'));
    });

  });

  describe('implicit subclassing behavior', function() {
    it('should allow a class defined twice to be implicitly subclassed', async function() {
      const moog = require('../index.js')({});

      moog.define('myObject', {
        construct: function(self, options) {
          self._order = (self._order || []).concat('first');
        }
      });

      moog.define('myObject', {
        construct: function(self, options) {
          self._order = (self._order || []).concat('second');
        }
      });

      const myObject = await moog.create('myObject', {});
      assert(myObject);
      assert(myObject._order[0] === 'first');
      assert(myObject._order[1] === 'second');
    });

    it('extendIfFirst property is honored if there is no existing definition for the type to implicitly subclass', async function() {
      const moog = require('../index.js')({});

      moog.define('fallback', {
        construct: function(self, options) {
          self._order = (self._order || []).concat('interloper');
        }
      });

      moog.define('myObject', {
        construct: function(self, options) {
          self._order = (self._order || []).concat('second');
        },
        extendIfFirst: 'fallback'
      });

      const myObject = await moog.create('myObject', {});
      assert(myObject);
      assert(myObject._order.length === 2);
      assert(myObject._order[0] === 'interloper');
      assert(myObject._order[1] === 'second');
    });

    it('extendIfFirst property is ignored if there is an existing definition for the type', async function() {
      const moog = require('../index.js')({});

      moog.define('fallback', {
        construct: function(self, options) {
          self._order = (self._order || []).concat('interloper');
        }
      });

      moog.define('myObject', {
        construct: function(self, options) {
          self._order = (self._order || []).concat('first');
        }
      });

      moog.define('myObject', {
        construct: function(self, options) {
          self._order = (self._order || []).concat('second');
        },
        extendIfFirst: 'fallback'
      });

      const myObject = await moog.create('myObject', {});
      assert(myObject);
      assert(myObject._order.length === 2);
      assert(myObject._order[0] === 'first');
      assert(myObject._order[1] === 'second');
    });

  });

  describe('order of operations', function() {

    // ==================================================
    // ORDERING
    // ==================================================

    it('should call `construct` methods baseClass-first', async function() {
      const moog = require('../index.js')({});

      moog.define('baseClass', {
        construct: function(self, options) {
          self._order = (self._order || []).concat('first');
        }
      });

      moog.define('subClassOne', {
        extend: 'baseClass',
        construct: function(self, options) {
          self._order = (self._order || []).concat('second');
        }
      });

      moog.define('subClassTwo', {
        extend: 'subClassOne',
        construct: function(self, options) {
          self._order = (self._order || []).concat('third');
        }
      });

      const subClassTwo = await moog.create('subClassTwo', {});
      assert(subClassTwo._order[0] === 'first');
      assert(subClassTwo._order[1] === 'second');
      assert(subClassTwo._order[2] === 'third');
    });

    it('should call `beforeConstruct` methods subClass-first', async function() {
      const moog = require('../index.js')({});

      moog.define('baseClass', {
        beforeConstruct: function(self, options) {
          self._order = (self._order || []).concat('third');
        }
      });

      moog.define('subClassOne', {
        extend: 'baseClass',
        beforeConstruct: function(self, options) {
          self._order = (self._order || []).concat('second');
        }
      });

      moog.define('subClassTwo', {
        extend: 'subClassOne',
        beforeConstruct: function(self, options) {
          self._order = (self._order || []).concat('first');
        }
      });

      const subClassTwo = await moog.create('subClassTwo', {});
      assert(subClassTwo._order[0] === 'first');
      assert(subClassTwo._order[1] === 'second');
      assert(subClassTwo._order[2] === 'third');
    });

    // "sync and async playing nicely" and exception-catching
    // tests eliminated because the built-in language functionality
    // of async/await now handles those jobs and is independently tested. -Tom
  });

  describe('odds and ends', function() {

    it('should report an error on a cyclical reference (extend in a loop)', async function() {
      const moog = require('../index.js')({});

      moog.define('classOne', {
        extend: 'classTwo'
      });

      moog.define('classTwo', {
        extend: 'classOne'
      });

      let e;
      let classOne;
      try {
        classOne = await moog.create('classOne', {});
      } catch (_e) {
        e = _e;
      }
      assert(e);
      assert(!classOne);
    });

    it('should allow synchronous creation of a class with no asynchronous beforeConstruct or construct methods', function() {
      const moog = require('../index.js')({});

      moog.define('baseclass', {
        color: 'blue',
        construct: function(self, options) {
          self._options = options;
        }
      });

      moog.define('subclass', {
        color: 'red',
        beforeConstruct: function(self, options) {
          options.color = 'purple';
        },
        extend: 'baseclass'
      });

      const obj = moog.createSync('subclass', {});
      assert(obj._options.color === 'purple');
    });

    it('should not allow synchronous creation of a class with asynchronous construct methods', function() {
      const moog = require('../index.js')({});

      moog.define('baseclass', {
        color: 'blue',
        construct: async function(self, options) {
          self._options = options;
        }
      });

      moog.define('subclass', {
        color: 'red',
        beforeConstruct: function(self, options) {
          options.color = 'purple';
        },
        extend: 'baseclass'
      });

      let errorReported = false;
      try {
        moog.createSync('subclass', {});
      } catch (e) {
        errorReported = true;
      }
      assert(errorReported);
    });

    it('should not allow synchronous creation of a class with asynchronous beforeConstruct methods', function() {
      const moog = require('../index.js')({});

      moog.define('baseclass', {
        color: 'blue',
        construct: function(self, options) {
          self._options = options;
        }
      });

      moog.define('subclass', {
        color: 'red',
        beforeConstruct: async function(self, options) {
          options.color = 'purple';
        },
        extend: 'baseclass'
      });

      let errorReported = false;
      try {
        moog.createSync('subclass', {});
      } catch (e) {
        errorReported = true;
      }
      assert(errorReported);
    });

    it('should not allow synchronous creation of a class with asynchronous afterConstruct methods', function() {
      const moog = require('../index.js')({});

      moog.define('baseclass', {
        color: 'blue',
        construct: function(self, options) {
          self._options = options;
        }
      });

      moog.define('subclass', {
        color: 'red',
        afterConstruct: async function(self) {
          await delay(10);
        },
        extend: 'baseclass'
      });

      let errorReported = false;
      try {
        moog.createSync('subclass', {});
      } catch (e) {
        errorReported = true;
      }
      assert(errorReported);
    });

    it('should report an error synchronously when creating a nonexistent type synchronously', function() {
      const moog = require('../index.js')({});
      try {
        moog.createSync('nonesuch');
        assert(false);
      } catch (e) {
        assert(true);
      }
    });

    it('should report an error asynchronously when creating a nonexistent type asynchronously', async function() {
      const moog = require('../index.js')({});
      try {
        await moog.create('nonesuch');
        assert(false);
      } catch (e) {
        assert(true);
      }
    });

    it('instanceOf should yield correct results', async function() {
      const moog = require('../index.js')({});

      moog.define('classOne', {});

      moog.define('classTwo', {
        extend: 'classOne'
      });

      moog.define('classThree', {});

      moog.define('classFour', {
        extend: 'classTwo'
      });

      const one = await moog.create('classOne');
      const two = await moog.create('classTwo');
      const three = await moog.create('classThree');
      const four = await moog.create('classFour');
      const rando = { strange: 'object' };

      assert(moog.instanceOf(one, 'classOne'));
      assert(moog.instanceOf(two, 'classOne'));
      assert(!moog.instanceOf(three, 'classOne'));
      assert(moog.instanceOf(four, 'classOne'));
      assert(!moog.instanceOf(rando));
    });

    it('sanity check of await behavior', async function() {
      const moog = require('../index.js')({});
      moog.define('classOne', {
        construct: async function(self, options) {
          await delay(100);
          self.size = 1;
        }
      });
      moog.define('classTwo', {
        extend: 'classOne',
        construct: async function(self, options) {
          await delay(1);
          self.size = 2;
        }
      });
      assert((await moog.create('classTwo', {})).size === 2);
    });

    it('isMy behaves sensibly', function() {
      const moog = require('../index.js')({});
      assert(moog.isMy('my-foo'));
      assert(!moog.isMy('foo'));
      assert(moog.isMy('@namespace/my-foo'));
      assert(!moog.isMy('@namespace/foo'));
    });

    it('originalToMy behaves sensibly', function() {
      const moog = require('../index.js')({});
      assert(moog.originalToMy('foo') === 'my-foo');
      assert(moog.originalToMy('@namespace/foo') === '@namespace/my-foo');
      // originalToMy is not guaranteed to do anything specific with
      // names that already have my-
    });

    it('myToOriginal behaves sensibly', function() {
      const moog = require('../index.js')({});
      assert(moog.myToOriginal('my-foo') === 'foo');
      assert(moog.myToOriginal('foo') === 'foo');
      assert(moog.myToOriginal('@namespace/my-foo') === '@namespace/foo');
      assert(moog.myToOriginal('@namespace/foo') === '@namespace/foo');
    });
  });
});

function delay(ms) {
  return new Promise(function(resolve, reject) {
    setTimeout(() => resolve(true), ms);
  });
}
