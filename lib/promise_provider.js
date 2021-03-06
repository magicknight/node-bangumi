/*!
 * ignore
 */

var assert = require('assert');

/**
 * Helper for multiplexing promise implementations
 *
 * @api private
 */

var store = {
  _promise: null
};

/**
 * Get the current promise constructor
 *
 * @api private
 */

store.get = function() {
  return store._promise;
};

/**
 * Set the current promise constructor
 *
 * @api private
 */

store.set = function(lib) {
  assert.ok(typeof lib === 'function',
    'bangumi.Promise must be a function, got ' + lib);
  store._promise = lib;
};

/*!
 * Use native promises by default
 */
if (global.hasOwnProperty('Promise')) store.set(global.Promise);

module.exports = store;