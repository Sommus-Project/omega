class InvalidActionError extends Error {
  constructor(message = '', additional = '') {
    super(message);
    this.additional = additional;
  }
}

module.exports = InvalidActionError;
