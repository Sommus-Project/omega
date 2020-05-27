class InvalidGroupError extends Error {
  constructor(additional = '') {
    super('INVALID_GROUP');
    this.additional = additional;
  }
}

module.exports = InvalidGroupError;