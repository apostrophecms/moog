const _ = require('lodash');

module.exports = function(options) {

  options = options || {};

  const self = {};

  self.options = options;

  self.definitions = {};

  self.ordinal = 0;

  // The "extending" argument is of interest to subclasses like
  // moog-require that need to know about relative paths. Must
  // return the new definition for the convenience of moog-require too

  self.define = function(className, definition, extending) {
    // Define many in a single call
    if (typeof (className) === 'object') {
      // Apply any definitions passed directly to the factory function
      _.each(className || {}, function(definition, name) {
        self.define(name, definition);
      });
      return;
    }

    if (!definition) {
      // This can happen because we use self.define as an autoloader
      // when resolving "extend". The moog-require module overloads
      // self.define to handle this case
      throw new Error(new Error('The className ' + className + ' is not defined.'));
    }

    // Make a shallow clone to avoid numerous problems with multiple
    // intentionally separate instances of moog; otherwise they wind
    // up sharing `__meta` depending on whether they were loaded with
    // `require`, and so on. We must clone `__meta` itself for the
    // same reason, and also `__meta.chain` because it is an array
    // object. All other properties of `__meta` are simple values.

    definition = _.clone(definition);
    if (definition.__meta !== undefined) {
      definition.__meta = _.clone(definition.__meta);
      if (definition.__meta.chain) {
        definition.__meta.chain = _.clone(definition.__meta.chain);
      }
    }
    definition.__meta = definition.__meta || {};
    definition.__meta.name = className;
    definition.__meta.ordinal = self.ordinal++;

    if (!extending) {
      definition.__meta.explicit = true;
    }

    const exists = _.has(self.definitions, className);
    if (definition.extendIfFirst && (!exists)) {
      definition.extend = definition.extendIfFirst;
    }

    if ((!definition.extend) && (definition.extend !== false)) {
      if (exists) {
        // Double definitions result in implicit subclassing of
        // the original definition by the new one; anything else
        // trying to access this className name will see
        // the resulting subclass via self.definitions. However
        // we reset the __name property for the benefit of
        // implementations that need to distinguish assets that
        // come from each subclass in the inheritance chain.
        definition.extend = self.definitions[className];
        definition.__meta.name = 'my-' + definition.__meta.name;
      } else {
        // Extend the default base class by default, if any, unless
        // we're it
        if (self.options.defaultBaseClass && className !== self.options.defaultBaseClass) {
          definition.extend = self.options.defaultBaseClass;
        }
      }
    }
    self.definitions[className] = definition;
    return definition;
  };

  self.redefine = function(className, definition) {
    delete self.definitions[className];
    return self.define(className, definition);
  };

  self.isDefined = function(className, options) {
    options = options || {};
    if (_.has(self.definitions, className)) {
      return true;
    }
    if (options.autoload === false) {
      return false;
    }
    try {
      // Can we autoload it?
      self.define(className);
      // Yes, but we don't really want it yet
      delete self.definitions[className];
      return true;
    } catch (e) {
      return false;
    }
  };

  // Create an instance of the given class name
  self.create = async function(className, options) {

    options = options || {};

    const {
      that,
      steps
    } = createPrep(className, options);

    for (let step of steps) {
      applyOptions(options, step);
      if (step.beforeConstruct) {
        await step.beforeConstruct(that, options);
      }
    }

    // Now we want to start from the base class and go down
    steps.reverse();

    for (let step of steps) {
      if (step.construct) {
        await step.construct(that, options);
      }
    }

    for (let step of steps) {
      if (step.afterConstruct) {
        await step.afterConstruct(that, options);
      }
    }

    return that;

  };

  // Create an instance synchronously. Throws an exception
  // if the class or any of its ancestors have async methods for
  // `beforeConstruct`, `construct` or `afterConstruct`.

  self.createSync = function(className, options) {
    options = options || {};

    const {
      that,
      steps
    } = createPrep(className, options);

    steps.forEach(step => {
      applyOptions(options, step);
      if (step.beforeConstruct) {
        const result = step.beforeConstruct(that, options);
        if (result && result.then) {
          throw new Error('createSync invoked, but beforeConstruct for ' + step.__meta.name + ' is async.');
        }
      }
    });

    // Now we want to start from the base class and go down
    steps.reverse();

    steps.forEach(step => {
      if (step.construct) {
        const result = step.construct(that, options);
        if (result && result.then) {
          throw new Error('createSync invoked, but construct for ' + step.__meta.name + ' is async.');
        }
      }
    });

    steps.forEach(step => {
      if (step.afterConstruct) {
        const result = step.afterConstruct(that, options);
        if (result && result.then) {
          throw new Error('createSync invoked, but afterConstruct for ' + step.__meta.name + ' is async.');
        }
      }
    });

    return that;

  };

  // Returns true if the given object is of the given moog class.
  // If the object is not a moog object, `false` is returned.

  self.instanceOf = function(object, name) {
    if (!object.__meta) {
      return false;
    }
    if (!object.__meta.chain) {
      return false;
    }
    return !!_.find(object.__meta.chain, { name: name });
  };

  return self;

  function createPrep(className, options) {

    const that = {};
    const steps = [];
    const seen = {};
    let next = self.definitions[className];
    if (!next) {
      throw 'The className ' + className + ' is not defined.';
    }
    while (next) {
      const current = next;
      if (_.has(seen, current.__meta.ordinal)) {
        throw new Error('The className ' + className + ' encounters an infinite loop, "extend" probably points back to itself or its subclass.');
      }
      seen[current.__meta.ordinal] = true;
      steps.push(current);
      next = current.extend;
      // In most cases it'll be a string we need to look up
      // in self.definitions. In a few cases it is already
      // a pointer to another definition (see double defines, above)
      if (typeof (next) === 'string') {
        const nextName = next;
        next = self.definitions[nextName];
        if (!next) {
          // Try to use define as an autoloader. This will fail in
          // the default implementation
          next = self.define(nextName, undefined, current);
        }
      }
    }

    // Attach metadata about the modules in the
    // inheritance chain, base class first
    that.__meta = { chain: [], name: className };
    let i = steps.length - 1;
    while (i >= 0) {
      that.__meta.chain.push(steps[i].__meta);
      i--;
    }

    return { that, steps };
  }

  function applyOptions(options, step) {
    // Apply the simple option defaults
    _.each(step, (val, key) => {
      if ((key === 'construct') || (key === 'extend') || (key === 'beforeConstruct')) {
        return;
      }
      if (key.substr(0, 2) === '__') {
        return;
      }
      if (_.has(options, key)) {
        return;
      }
      options[key] = val;
    });
  }

};
