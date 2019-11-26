/* eslint-env mocha */
const { expect } = require('chai');
const isRegExp = require('./isRegExp');

describe('isRegExp tests', () => {
  it('should be a function', () => {
    expect(isRegExp).to.be.an('function');
  });

  it('should return true with a RegExp', () => {
    expect(isRegExp(/a/)).to.equal(true);
  });

  it('should return false with a String', () => {
    expect(isRegExp('a')).to.equal(false);
  });

  it('should return false with a Number', () => {
    expect(isRegExp(123)).to.equal(false);
  });

  it('should return false with a Boolean', () => {
    expect(isRegExp(true)).to.equal(false);
  });

  it('should return false with a Object', () => {
    expect(isRegExp({a:/asd|qwe/})).to.equal(false);
  });
});