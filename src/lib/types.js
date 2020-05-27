// istanbul ignore next
const VALUE_MUST_BE = {
  ARRAY_OF_STRINGS: 'The incoming value must be an array of strings.',
  BOOL: 'The incoming value must be a boolean.',
  DATE: 'The incoming value must be a date object.',
  NUMBER: 'The incoming value must be a number.',
  OBJECT: 'The incoming value must be an object.',
  STRING: 'The incoming value must be a string.'
};

const getType = val => (val == null ? 'Null' : val.constructor.toString().substr(9, 3))
const isBool = val => getType(val) == 'Boo'; // eslint-disable-line eqeqeq
const isDate = val => getType(val) == 'Dat'; // eslint-disable-line eqeqeq
const isNum = val => getType(val) == 'Num'; // eslint-disable-line eqeqeq
const isObj = val => getType(val) == 'Obj'; // eslint-disable-line eqeqeq
const isStr = val => getType(val) == 'Str'; // eslint-disable-line eqeqeq

module.exports = {
  VALUE_MUST_BE,
  isBool,
  isDate,
  isNum,
  isObj,
  isStr
};