const isString = require('./isString');

function getHeader(headers, headerKey) {
  let value;
  if (!headers || (typeof headers !== 'object')) {
    throw new TypeError('`headers` must be an object');
  }

  if (!isString(headerKey)) {
    throw new TypeError('`headerKey` must be a string');
  }

  const headerKeyL = headerKey.toLowerCase();

  Object.entries(headers).some(
    ([key, val]) => {
      if (key.toLowerCase() === headerKeyL) {
        value = val;
        return true;
      }
    }
  );

  return value;
}

module.exports = getHeader;