const isString = url => (url != null && url.constructor.toString().substr(9, 6) === 'String');

module.exports = isString;