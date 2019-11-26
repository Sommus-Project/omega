const HttpError = require('./HttpError');

function throw404(path = 'Unknown path', title = '') {
  throw new HttpError(404, {headers: {'X-No-Entity': path},title});
}

module.exports = throw404;
