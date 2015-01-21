var async, _;

if (window) {
  // Works in browser if async and _ are already global
  async = window.async;
  _ = window._;
} else {
  // For npm
  async = require('async');
  _ = require('lodash');
}

module.exports = function(options) {

  var self = {};

  self.dirty = false;

  self.options = options;

  self.definitions = {};

  self.define = function(type, definition) {
    self.definitions[type] = definition;
    self.dirty = true;
  };

  _.each(options.definitions || {}, function(definition, name) {
    self.define(name, definition);
  });

  // The default autoloader just returns the explicit definition, if any
  self.autoloader = options.autoloader || function(self, self.options, type, definition, extendedBy) {
    if (!definition) {
      throw new Error('The type ' + type + ' is not defined.');
    }
    return definition;
  };

  self.create = function(type, options, callback) {

    var definition;

    try {
      definition = self.autoloader(type, self.definitions[type], false);
    } catch (e) {
      return callback(e);
    }

    var that = {};
    var next = definition;
    var steps = [];
    var seen = {};

    while (next) {
      if (_.has(seen, next.__name)) {
        return callback(new Error('"extends" loop detected, a class is extending its subclass and vice versa: ' + name));
      }
      seen[next.__name] = true;
      steps.push(next);
      next = next.extend;
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
          return async.eachSeries(steps, function(step, callback) {
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
    }
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

  function getNpmPath(parentPath, type) {
    if (_.has(self.bundled, type)) {
      return self.bundled[type];
    }
    try {
      return npmResolve.sync(type, { basedir: path.dirname(parentPath) });
    } catch (e) {
      // Not found via npm. This does not mean it doesn't
      // exist as a project-level thing
      return null;
    }
  }
};

