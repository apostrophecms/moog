var async, _;

if (module) {
  // For npm
  async = require('async');
  _ = require('lodash');
} else {
  // Works in browser if async and _ are already global
  async = window.async;
  _ = window._;
}

module.exports = function(options) {

  var self = {};

  self.options = options;

  self.definitions = {};

  // The "extending" argument is of interest to subclasses like
  // moog-require that need to know about relative paths.

  self.define = function(type, definition, extending) {

    // Define many in a single call
    if (typeof(type) === 'object') {
      // Apply any definitions passed directly to the factory function
      _.each(type || {}, function(definition, name) {
        self.define(name, definition);
      });
      return;
    }

    if (!definition) {
      // This can happen because we use self.define as an autoloader
      // when resolving "extend". The moog-require module overloads
      // self.define to handle this case
      throw new Error(new Error('The type ' + nextType + ' is not defined.'));
    }
    definition.__meta = definition.__meta || {};
    definition.__meta.name = type;
    if (!definition.extend) {
      if (_.has(self.definitions, type)) {
        // Double definitions result in implicit subclassing of
        // the original definition by the new one; anything else
        // trying to access this type name will see
        // the resulting subclass via self.definitions. However
        // we reset the __name property for the benefit of
        // implementations that need to distinguish assets that
        // come from each subclass in the inheritance chain.
        definition.extend = self.definitions[type];
        definition.__meta.name = 'my-' + definition.__meta.name;
      } else {
        // Extend the default base class by default, if any, unless
        // we're it
        if (self.options.defaultBaseClass && type !== self.options.defaultBaseClass) {
          definition.extend = self.options.defaultBaseClass;
        }
      }
    }
    self.definitions[type] = definition;
    return definition;
  };

  self.redefine = function(type, definition) {
    delete self.definitions[type];
    return self.define(type, definition);
  };

  self.isDefined = function(type) {
    if (_.has(self.definitions, type)) {
      return true;
    }
    try {
      // Can we autoload it?
      self.define(type);
      // Yes, but we don't really want it yet
      delete self.definitions[type];
      return true;
    } catch (e) {
      return false;
    }
  };

  // Create an instance
  self.create = function(type, options, callback) {
    var definition;

    var that = {};
    var steps = [];
    var next = self.definitions[type];
    if (!next) {
      return callback(new Error('The type ' + type + ' is not defined.'));
    }
    while (next) {
      var current = next;
      steps.push(current);
      next = current.extend;
      // In most cases it'll be a string we need to look up
      // in self.definitions. In a few cases it is already
      // a pointer to another definition (see double defines, above)
      if (typeof(next) === 'string') {
        var nextName = next;
        next = self.definitions[nextName];
        if (!next) {
          try {
            // Try to use define as an autoloader. This will fail in
            // the default implementation
            next = self.define(nextName, undefined, current);
          } catch (e) {
            return callback(e);
          }
        }
      }
    }

    return async.series({
      beforeConstruct: function(callback) {
        return async.eachSeries(steps, function(step, callback) {
          // Apply the simple option defaults
          _.each(step, function(val, key) {
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

          // Invoke beforeConstruct, defaulting to an empty one
          var beforeConstruct = step.beforeConstruct || function(self, options, callback) { return setImmediate(callback); };
          // Turn sync into async
          if (beforeConstruct.length === 2) {
            var syncBeforeConstruct = beforeConstruct;
            beforeConstruct = function(self, options, callback) {
              try {
                syncBeforeConstruct(self, options);
              } catch (e) {
                return setImmediate(_.partial(callback, e));
              }
              return setImmediate(callback);
            };
          }
          if (beforeConstruct.length < 3) {
            return callback(new Error('beforeConstruct must take the following arguments: "self", "options", and (if it is async) "callback"'));
          }

          return beforeConstruct(that, options, callback);
        }, callback);
      },
      construct: function(callback) {
        // Now we want to start from the base class and go down
        steps.reverse();
        // Also attach metadata about the modules in the
        // inheritance chain, base class first
        that.__meta = [];
        return async.eachSeries(steps, function(step, callback) {
          that.__meta.push(step.__meta);
          // Invoke construct, defaulting to an empty one
          var construct = step.construct || function(self, options, callback) { return setImmediate(callback); };

          // Turn sync into async
          if (construct.length === 2) {
            var syncConstruct = construct;
            construct = function(self, options, callback) {
              try {
                syncConstruct(self, options);
              } catch (e) {
                return setImmediate(_.partial(callback, e));
              }
              return setImmediate(callback);
            };
          }
          if (construct.length < 3) {
            return callback(new Error('construct must take the following arguments: "self", "options", and (if it is async) "callback"'));
          }
          return construct(that, options, callback);
        }, callback);
      }
    }, function(err) {
      if (err) {
        return callback(err);
      }
      return callback(null, that);
    });
  };

  self.createAll = function(globalOptions, specificOptions, callback) {
    var result = {};
    return async.eachSeries(
      _.keys(options.definitions),
      function(name, callback) {
        var options = {};
        _.extend(options, globalOptions);
        if (_.has(specificOptions, name)) {
          _.extend(options, specificOptions[name]);
        }
        return self.create(name, options, function(err, obj) {
          if (err) {
            return callback(err);
          }
          result[name] = obj;
          return callback(null);
        });
      },
      function(err) {
        if (err) {
          return callback(err);
        }
        return callback(null, result);
      }
    );
  };

  self.bridge = function(modules) {
    return _.each(modules, function(module) {
      if (module.setBridge) {
        module.setBridge(modules);
      }
    });
  }

  return self;

};

