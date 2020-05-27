const HttpError = require('./HttpError');

function apiIdToInt(path) {
  return id => {
    if (!isNaN(id)) {
      return parseInt(id, 10);
    }
    throw new HttpError(400, {data:`Invalid id: ${path}/${id}`});
  }
}

module.exports = apiIdToInt;
