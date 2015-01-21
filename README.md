# moog

```javascript
var moog = require('moog')();

moog.define('baseclass', {
  color: 'blue',
  // sync constructor
  construct: function(self, options) {
    self._options = options;

    self.jump = function(howHigh) {
      return 'I jumped ' + howHigh + ' pixels high';
    };
  }
});

moog.define('subclass', {
  color: 'red',
  // async constructor
  construct: function(self, options, callback) {
    return goGetTheCandy(function(err, results) {
      if (err) {
       return callback(err);
      }
      self.candy = results;
      return callback(null);
    });
  }
});

moog.create('subclass', { age: 20 }, function(err, obj) {
  assert(obj._options.color === 'red');
  assert(obj.jump(5) === 'I jumped 5 pixels high');
});
```

`moog` synthesizes objects with full support for inheritance. You can define them with any combination of synchronous and asynchronous constructors, specify default options easily, and modify options before they are seen by base classes.

### Factory function

To create an instance of `moog`:

```javascript
var moog = require('moog')();
```

You may also pass options:

```javascript
var moog = require('moog')({
  defaultBaseClass: 'superclass',
  definitions: {
    // This is equivalent to calling moog.define for each of these types
    'baseclass': {
      // see `moog.define` for example
    },
    'subclass': {
      // see `moog.define` for example
    }
  }
});
```

### moog.define(type, definition)

Defines a new type. `type` is a string. A definition looks like:

```javascript
moog.define('baseclass', {
  // Set the default value of an option
  color: 'red',
  // Simple synchronous constructor
  construct: function(self, options) {
    self._options = options;
  }
});
```

`construct` may optionally take a callback as a third argument.

To subclass another type, just `extend` it by name in the definition of your subclass:

```javascript
moog.define('subclass', {
  // Change the default value of an option
  color: 'blue',
  extend: 'baseclass'
});
```

**If you define the same class twice** without setting `extend` the second time, an *implicit subclass* is created. The new version subclasses the old one, effectively "patching" it with new options and behavior without having to redefine everything. All other types that subclass that name now subclass the new version.

### moog.redefine(type, definition)

Explicitly replaces any previous definition of `type` with a new one. Does *not* subclass the old type. If there was no old definition, this method is equivalent to `moog.define`.

### moog.isDefined(type)

Returns true if the type is defined, whether explicitly or via the autoloader optional. That is, `moog.create` will succeed for `type`, provided that the constructor does not signal an error.

### moog.create(type, options, callback)

Creates an object of the specified `type`, passing `options`, which may be modified first by the default option values given in type definitions beginning with the deepest subclass, then by any `beforeConstruct` methods present, which are called for the deepest subclass first. Then the `construct` methods are called, if present, starting with the base class and ending with the final subclass.

The callback receives the arguments `err, obj` where `obj` is the object created.

### moog.createAll(globalOptions, specificOptions, callback)

Creates one object of each type that has been defined via `moog.define` or via the `definitions` option given when configuring `moog`. Only types explicitly defined in this way are created, but they may extend types available via the `autoloader` option given when configuring `moog`.

The options passed for each object consist of `globalOptions` extended by `specificOptions[type]`.
