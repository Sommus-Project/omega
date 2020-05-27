(function () {
  const maxSafeInteger = Math.pow(2, 53) - 1;

  function isCallable (fn) {
    return typeof fn === 'function' || Object.prototype.toString.call(fn) === '[object Function]';
  }

  function toInteger(value) {
    var number = Number(value);
    if (isNaN(number)) { return 0; }
    if (number === 0 || !isFinite(number)) { return number; }
    return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
  }

  function toLength(value) {
    var len = toInteger(value);
    return Math.min(Math.max(len, 0), maxSafeInteger);
  }

  if (!Array.from) {
    Object.defineProperty(Array, 'from', { // eslint-disable-line no-extend-native
      // The length property of the from method is 1.
      value: function from(arrayLike/*, mapFn, thisArg */) {
        if (arrayLike == null) {
          throw new TypeError('Array.from requires an array-like object - not null or undefined');
        }

        var _this = this;
        var mapFn = arguments.length > 1 ? arguments[1] : undefined;
        var thisArg;
        if (typeof mapFn !== 'undefined') {
          if (!isCallable(mapFn)) {
            throw new TypeError('Array.from: when provided, the second argument must be a function');
          }

          if (arguments.length > 2) {
            thisArg = arguments[2];
          }
        }

        var idx = 0;
        var items = Object(arrayLike);
        var len = toLength(items.length);
        var retVal = isCallable(_this) ? Object(new _this(len)) : new Array(len);
        var kValue;

        while (idx < len) {
          kValue = items[idx];
          if (mapFn) {
            retVal[idx] = typeof thisArg === 'undefined' ? mapFn(kValue, idx) : mapFn.call(thisArg, kValue, idx);
          }
          else {
            retVal[idx] = kValue;
          }
          idx += 1;
        }
        retVal.length = len;
        return retVal;
      }
    });
  }
}());
