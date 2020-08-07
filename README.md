# moog

Moog provides object oriented programming services, with rich support for asynchronous constructors, modification of constructor parameters by subclasses, and "implicit subclassing" that allows a class to be replaced in a way that is transparent to end users.

Moog implements the "self pattern," so you never have to worry about using `.call`, `.apply` or `.bind`.

`moog` synthesizes objects with full support for inheritance. You can define them with any combination of synchronous and asynchronous constructors, specify default options easily, and modify options before they are seen by base classes.

```javascript
const moog = require('moog')();

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
  construct: async function(self, options) {
    self.candy = await goGetTheCandy();
  }
});

const obj = await moog.create('subclass', { age: 20 });
assert(obj._options.color === 'red');
assert(obj.jump(5) === 'I jumped 5 pixels high');
```

### Factory function

To create an instance of `moog`:

```javascript
var moog = require('moog')();
```

You may also pass options:

```javascript
var moog = require('moog')({
  defaultBaseClass: 'superclass'
});
```

### moog.define(className, definition)

Defines a new class. `className` is a string.

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

The `definition` object can contain the properties `construct`, `beforeConstruct`, and `afterConstruct`, which are functions invoked by `moog.create`, as described below. The `extend` property allows for subclassing. All other properties are treated as defaults for the `options` object provided when constructing an instance of the class.

To subclass another class, just `extend` it by name in the definition of your subclass:

```javascript
moog.define('subclass', {
  // Change the default value of an option
  color: 'blue',
  extend: 'baseclass'
});
```

#### Default base class

**If you set the `defaultBaseClass` option of `moog`** and do not explicitly `extend` anything for a particular class, then that class will extend the `defaultBaseClass`. If you wish to override this behavior for a specific class, just set `extend` to `false`.

#### Implicit subclassing

**If you define the same class twice** without setting `extend` the second time, an *implicit subclass* is created.

The new version subclasses the old one, effectively "patching" it with new options and behavior **without having to redefine everything.** All other types that subclass that name now subclass the new version.

The `.__meta.name` property of each instance will have a `my-` prefix (or more than one, if such implicit subclassing is repeated).

### Fallback base classes

If you are not sure if there is an existing definition for a class, you can use `extendIfFirst` to specify a fallback base class. This is helpful when encouraging third-party developers to optionally define a type themselves.

#### Defining many types at once

For convenience, you may pass an object containing properties that define many different types:

```javascript
moog.define({
  // This is equivalent to calling moog.define for each of these types
  'baseclass': {
    // See above for example of a definition
  },
  'subclass': {
    // See above for example of a definition
  }
});
```

### moog.redefine(className, definition)

Explicitly replaces any previous definition of `className` with a new one. Does *not* subclass the old class. If there was no old definition, this method is equivalent to `moog.define`.

### moog.isDefined(className, options)

Returns true if the class is defined, whether explicitly or via the autoloader option. That is, `moog.create` will succeed for `className`, provided that the constructor does not signal an error. If the class is available via the autoloader, this method returns true but does not leave the definition in place.

The `options` argument may be omitted entirely. If `options.autoload` is explicitly set to `false`, no attempt to test for the ability to load the class via the autoloader is made.

### await moog.create(className, options)
### moog.createSync(className, options)

Creates an object of the specified `class`, passing `options` to override any default options set in `moog.define`.

```javascript
moog.define('myObject', {
  color: 'blue',
  construct: function(self, options) {
    self.color = options.color;
  }
});

var myObject = moog.create('myObject', { color: 'purple' });
alert("My object is " + myObject.color); // "My object is purple"
```

When `create` is called, `moog` will first call `beforeConstruct`, starting with the deepest subclass first. Then the `construct` methods are called, if present, starting with the base class and ending with the final subclass. Finally the `afterConstruct` methods are called, if present, starting with the base class and ending with the final subclass.

*`moog.create` is asynchronous, and so it must be awaited.* You can also create an object with `moog.createSync`, which does not require `await`. However, *createSync will throw an exception if any of `beforeConstruct`, `construct` or `afterConstruct` throw a promise, including those in parent classes, etc.*

```javascript
// Always works
const object = await moog.create('myObject', { color: 'purple' });

// Throws an exception if any construction-related functions return
// a promise
const object = moog.createSync('myObject', { color: 'purple' });
```

### The `__meta` property

`obj` will always have a `__meta` property, which contains an array of metadata objects describing each module in the inheritance chain, starting with the base class. The metadata objects will always have a `name` property. [moog-require](https://github.com/punkave/moog-require) also provides `dirname` and `filename`. This is useful to implement template overrides, or push browser-side javascript and styles defined by each level.

### `my-` utilities

The methods `isMy`, `myToOriginal`, and `originalToMy` can be used to manipulate class names, detecting, adding or removing a `my-` prefix as appropriate while accommodating npm namespaces in class names. If the class name contains an npm package name (such as `@namespace/foo`), the prefix is applied to the second part, for example `@namespace/my-foo`.

## Changelog
2.1.2 (2020-08-12): Updates ESLint to address dependency warnings.

2.1.1: actually use the `originalToMy` utility when implicitly subclassing.

2.1.0: utilities to manipulate the `my-` prefix safely for type names with and without an npm namespace.

2.0.1: `npm update`, plus removal of `package-lock.json` which is not appropriate in libraries.
No code changes.

2.0.0: this is a major version change with significant, intentional bc breaks.

* `beforeConstruct`, `construct` and `afterConstruct` may all be `async` functions. They can also be simple synchronous functions of course.
* **Support for callbacks has been removed.**
* `beforeConstruct`, `construct` and `afterConstruct` all receive the same arguments: `(self, options)`.
* The `mirror` method has been removed as we do not intend to use it in Apostrophe 3.x.
* The `createAll` method has been removed as it has seen little use.
* Explicit browser support has been removed, you may use 2.0 in the browser via `webpack`, `browserify`, etc. with appropriate Babel presets to allow `async/await` in your browser of choice.

1.0.3: nudging past npm not making 1.0.2 available for some reason; no code changes.

1.0.2: in addition to the shallow top-level clone, we must also clone the `__meta` property and its `__meta.chain` subproperty to ensure they are not reused between instances of `moog`. No other properties of the definition are objects subject to modification.

1.0.1: shallowly clone each definition to avoid numerous problems when multiple instances of `moog` intended to be separate worlds wind up sharing the same definition objects due to the `require` cache. A shallow clone gives us independent `__meta` properties, which are all we need to solve the problem. Definitions are few, instances are many and the clone is shallow, so this is not a significant performance hit.

Also, use the apostrophe eslint test configuration. This required various syntax updates and flushed out a few oddities although no bugs.

1.0.0: updated `lodash` and `mocha` to satisfy `npm audit`. Code is still compatible with lodash 3.x as well, for those using the `@sailshq/lodash` fork for bc, and for Apostrophe's frontend which uses that version and shouldn't push multiple versions.

0.3.1: new `instanceOf` method. Given an object and a type name, this method returns true if the object is of the given type or a type that extends it.

0.3.0: new `options` argument to `isDefined`, which may contain an `autoloader: false` property to prevent `isDefined` from attempting to test whether the type can be defined by the autoloader.

0.2.4: throw the proper exception when synchronously creating a type that extends an undefined type. (Previously an exception was thrown, but it wasn't informative. It was an accidental benefit of trying to invoke a nonexistent callback.)

0.2.3: exceptions thrown for attempts to synchronously create types with asynchronous beforeConstruct/construct/afterConstruct methods now include the correct name of the type or ancestor type that requires the call to be asynchronous.

0.2.2: if `afterConstruct` expects a callback, calling `create` synchronously should throw an error. This is a bug fix, so no minor version bump is required.

0.2.1: `__meta` property is available in `beforeConstruct`. I regard this as a bug fix as the idea was always to have this information be available as early as possible.

0.2.0: added support for `mirror`, which allows browser-side type hierarchies to match those used on the server side. To add actual code for those types, take advantage of the implicit subclassing feature of `moog.define`.

0.1.5: added support for `extendIfFirst`, useful when you don't know if there is an existing definition of the type. report certain errors synchronously when creating objects synchronously.

0.1.4: allow setting `extend` to `false` to explicitly turn off `defaultBaseClass` for a particular type. Also corrected the unit test for `defaultBaseClass` (the feature worked, but the test was wrong).

0.1.3: never pass `options` to `afterConstruct`. We formerly were correctly leaving it off in the async case, but passing it in the sync case.

0.1.2: Updated some documentation.

0.1.1: added `afterConstruct`, another optional method which is invoked after `construct`. Like `beforeConstruct` and `construct` it can be sync or async. Unlike those methods it DOES NOT take the `options` parameter.

0.1.0: bc break: `__meta` is now an object with `chain` and `name` properties. `chain` is the array of subclass metadata objects as before. `name` is the class name being instantiated. Also, `__meta` is fully populated before any constructors are called.
