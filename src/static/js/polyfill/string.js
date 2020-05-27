if (String.prototype.endsWith == null) {
    Object.defineProperty(String.prototype, 'endsWith', { // eslint-disable-line no-extend-native
        value: function endsWith(search, this_len) {
          if (this_len === undefined || this_len > this.length) {
            this_len = this.length; // eslint-disable-line no-param-reassign
          }

          return this.substring(this_len - search.length, this_len) === search;
        }
    });
}

if (String.prototype.includes == null) {
  Object.defineProperty(String.prototype, 'includes', { // eslint-disable-line no-extend-native
    value: function includes(search, start) {
      if (typeof start !== 'number') {
        start = 0; // eslint-disable-line no-param-reassign
      }

      return (start + search.length > this.length) ? false : this.indexOf(search, start) !== -1
    }
  });
}

if (String.prototype.repeat == null) {
  Object.defineProperty(String.prototype, 'repeat', { // eslint-disable-line no-extend-native
    value: function repeat(count) {
      'use strict';
      if (this == null) { // check if `this` is null or undefined
        throw new TypeError('String.prototype.repeat called on null or undefined');
      }

      var str = '' + this;

      // Convert string to integer.
      count = +count; // eslint-disable-line no-param-reassign
      if (count < 0 || count === Infinity) {
        throw new RangeError('Invalid count value');
      }

      // floors and rounds-down it.
      count |= 0; // eslint-disable-line no-param-reassign
      if (str.length === 0 || count === 0) {
        return '';
      }

      // Ensure count is a 31-bit integer
      if (str.length * count >= (1 << 28)) {
        throw new RangeError('Invalid string length');
      }

      var dst = str;
      while (--count) { // eslint-disable-line no-cond-assign, no-param-reassign
         dst += str;
      }

      return dst;
    }
  });
}

if (String.prototype.startsWith == null) {
    Object.defineProperty(String.prototype, 'startsWith', { // eslint-disable-line no-extend-native
        value: function startsWith(search, pos) {
            pos = !pos || pos < 0 ? 0 : +pos; // eslint-disable-line no-param-reassign
            return this.substring(pos, pos + search.length) === search;
        }
    });
}
