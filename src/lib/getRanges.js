const HttpError = require('./HttpError');

const VALID_SORT_OPTIONS = ['asc', 'desc'];

function getRanges(query) {
  const start = Number(query.start || '0');
  if (start < 0 || Math.round(start) !== start) {
    throw new HttpError(400, 'The query parameter "start" must be a positive integer value');
  }
  const limit = Number(query.limit || '12000');
  if (limit < 0 || Math.round(limit) !== limit) {
    throw new HttpError(400, 'The query parameter "limit" must be a positive integer value');
  }
  const order = (query.order || 'asc').toLowerCase();
  if (!VALID_SORT_OPTIONS.includes(order)) {
    throw new HttpError(400, `The query parameter "order" must be one of the following values: "${VALID_SORT_OPTIONS.join('", "')}"`);
  }

  return { start, limit, order };
}

module.exports = getRanges;
module.exports.VALID_SORT_OPTIONS = VALID_SORT_OPTIONS;
