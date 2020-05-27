const isRegExp = val => (val != null && val.constructor.toString().substr(9, 6) === 'RegExp');

module.exports = isRegExp;