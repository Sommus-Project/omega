/* eslint-env mocha */
const { expect } = require('chai');
const SESSION_COOKIE = require('./SESSION_COOKIE');

describe('Tests for API: src/lib/SESSION_COOKIE.js', () => {
  it('should be correct value', () => {
    expect(SESSION_COOKIE).to.equal('sessionid');
  });
});