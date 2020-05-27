const HttpError = require('./HttpError');

const VALID_SORT_OPTIONS = ['asc', 'desc'];

function getRanges(query) {
  const start = Number(query.start || '0');
  if (start < 0 || Math.round(start) !== start) {
    return new HttpError(400, '"start" must be a positive integer value');
  }
  const limit = Number(query.limit || '12000');
  if (limit < 0 || Math.round(limit) !== limit) {
    return new HttpError(400, '"limit" must be a positive integer value');
  }
  const order = (query.order || 'asc').toLowerCase();
  if (!VALID_SORT_OPTIONS.includes(order)) {
    return new HttpError(400, `"order" must be one of the following values: "${VALID_SORT_OPTIONS.join('", "')}"`);
  }

  return { start, limit, order };
}

module.exports = getRanges;
module.exports.VALID_SORT_OPTIONS = VALID_SORT_OPTIONS;
