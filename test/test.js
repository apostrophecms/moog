var assert = require('assert');

describe('synthesizer', function() {
  it('should exist', function(done) {
    var synth = require('../index.js')({

    });

    assert(synth);
    return done();
  });
});