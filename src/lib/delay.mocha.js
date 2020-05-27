/* eslint-env mocha */
const { expect } = require('chai');
const delay = require('./delay');

describe('Tests for API: src/lib/delay.js', () => {
  it('should be correct value', async () => {
    const before = Date.now();
    await delay(55);
    const after = Date.now();
    expect(after - before > 50).to.equal(true);
  });
});