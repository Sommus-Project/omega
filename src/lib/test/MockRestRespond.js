// Create an Object with methods 'get', 'post', 'put', etc.
// Each of them call `MockHttp.addResponse` with their args
// and the method name, in upper case.
const MockHttp = require('./MockHttp');
var METHODS = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'];

function MockRestRespond() {
  return METHODS.reduce(
    (api, method) => {
      api[method.toLowerCase()] = (uri, response) => {
        MockHttp.addResponse(method, uri, response);
      };
      return api;
    }, {}
  );
}

module.exports = MockRestRespond;
