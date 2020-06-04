/* eslint-disable */
Object.values = function(obj) {
  return Object.keys(obj).map(function(e) {
    return obj[e]
  })
};
