Object.defineProperty(Array.prototype, 'includes', { // eslint-disable-line no-extend-native
  value: function(valueToFind, fromIndex) {
    if (this == null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }

    var o = Object(this);
    var len = o.length >>> 0;

    if (len === 0) {
      return false;
    }

    var n = fromIndex | 0;
    var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

    function sameValueZero(x, y) {
      return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
    }

    while (k < len) {
      if (sameValueZero(o[k], valueToFind)) {
        return true;
      }
      k++;
    }

    return false;
  }
});
