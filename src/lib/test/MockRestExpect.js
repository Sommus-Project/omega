// Create an Object with methods 'get', 'post', 'put', etc.
// Each of them push their args and the method name, in upper case,
// into the expect array found in the `priv` variable.
var METHODS = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'];

function MockRestExpect(priv) {
  return METHODS.reduce(
    (api, method) => {
      api[method.toLowerCase()] = (uri, times = 1, data) => {
        priv.expect.push({method, uri, data, times});
      };
      return api;
    }, {}
  );
}

module.exports = MockRestExpect;
