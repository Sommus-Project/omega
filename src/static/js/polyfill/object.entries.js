/* eslint-disable */
Object.entries = function(obj) {
  return Object.keys(obj).map(function(e) {
    return [e, obj[e]];
  })
};
