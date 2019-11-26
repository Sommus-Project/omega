/* eslint-env mocha */
const expect = require('chai').expect;
const isString = require('./isString');

describe('isString tests', function () {
  it('should init', () => {
    expect(isString).to.be.an('function');
  });

  it('should work with a string', () => {
    expect(isString('dsa')).to.equal(true);
  });

  it('should work with a number', () => {
    expect(isString(0)).to.equal(false);
  });

  it('should work with a boolean', () => {
    expect(isString(true)).to.equal(false);
  });

  it('should work with an Arran', () => {
    expect(isString([1,2,3])).to.equal(false);
  });

  it('should work with an object', () => {
    expect(isString({a: 'dsa'})).to.equal(false);
  });
});