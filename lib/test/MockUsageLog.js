class MockUsageLog {
  constructor(...args) {
    this.testData = {
      constArgs: args,
      critical: [],
      error: [],
      warn: [],
      info: [],
      debug: []
    };
  }

  critical(message) {
    this.testData.critical.push(message);
  }

  error(message) {
    this.testData.error.push(message);
  }

  warn(message) {
    this.testData.warn.push(message);
  }

  info(message) {
    this.testData.info.push(message);
  }

  debug(message) {
    this.testData.debug.push(message);
  }
}

module.exports = MockUsageLog;
