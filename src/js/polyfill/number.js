if (Number.isFinite == null) {
  Object.defineProperty(Number, 'isFinite', { // eslint-disable-line no-extend-native
    value: function(value) {
      return typeof value === 'number' && isFinite(value);
    }
  });
}

if (Number.isInteger == null) {
  Object.defineProperty(Number, 'isInteger', { // eslint-disable-line no-extend-native
    value: function(value) {
      return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
    }
  });
}

if (Number.isSafeInteger == null) {
  Object.defineProperty(Number, 'isSafeInteger', { // eslint-disable-line no-extend-native
    value: function (value) {
       return Number.isInteger(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER;
    }
  });
}

if (Number.isNaN == null) {
  Object.defineProperty(Number, 'isNaN', { // eslint-disable-line no-extend-native
    value: function(value) {
      return value !== value; // eslint-disable-line no-self-compare
    }
  });
}

if (Number.parseFloat == null) {
  Object.defineProperty(Number, 'parseFloat', { // eslint-disable-line no-extend-native
    value: parseFloat
  });
}

if (Number.parseInt == null) {
  Object.defineProperty(Number, 'parseInt', { // eslint-disable-line no-extend-native
    value: parseInt
  });
}

if (Number.EPSILON == null) {
  Object.defineProperty(Number, 'EPSILON', { // eslint-disable-line no-extend-native
    value: Math.pow(2, -52)
  });
}

if (Number.MIN_SAFE_INTEGER == null) {
  Object.defineProperty(Number, 'MIN_SAFE_INTEGER', { // eslint-disable-line no-extend-native
    value: -(Math.pow(2, 53) - 1)
  });
}

if (Number.MAX_SAFE_INTEGER == null) {
  Object.defineProperty(Number, 'MAX_SAFE_INTEGER', { // eslint-disable-line no-extend-native
    value: Math.pow(2, 53) - 1
  });
}
