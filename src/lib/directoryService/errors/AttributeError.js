class AttributeError extends Error {
  constructor(code, reason = 'ATTRIBUTE_ERROR', additional = '') {
    super(reason.split(' Code:')[0]);
    this.additional = additional;
    this.code = code;
  }
}

module.exports = AttributeError;