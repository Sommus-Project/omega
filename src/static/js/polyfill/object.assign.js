/* eslint-disable */
if (!Object.assign) {
  Object.defineProperty(Object, "assign", {
    // .length of the .assign function must be 2
    value: function assign(target, varArgs) { // eslint-disable-line no-unused-vars
      'use strict';
      if (target == null) { // TypeError if undefined or null
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource != null) { // Skip over if undefined or null
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    }
  });
}

if (!Object.is) {
  Object.defineProperty(Object, "is", {
    value: function is(x, y) {
      if (x === y) {
        return x !== 0 || 1 / x === 1 / y;
      }

      return x !== x && y !== y; // eslint-disable-line no-self-compare
    }
  });
}
