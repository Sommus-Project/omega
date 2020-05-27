/* eslint-env mocha */
const { expect } = require('chai');
const twodigits = require('./twodigits');
const { isBool, isDate, isNum, isObj, isStr } = twodigits; // eslint-disable-line no-unused-vars

describe('Tests for /src/lib/twodigits.js', () => {
  beforeEach(() => {
  });

  it('should be a valid object', () => {
    expect(twodigits).to.be.a('function');
    expect(twodigits.length).to.equal(1);
  });

  it('should work', () => {
    expect(twodigits(0)).to.equal('00');
    expect(twodigits(5)).to.equal('05');
    expect(twodigits(9)).to.equal('09');
    expect(twodigits(10)).to.equal('10');
    expect(twodigits(99)).to.equal('99');
    expect(twodigits(100)).to.equal('00');
  });

  it('should handle "undefined"', () => {
    expect(twodigits()).to.equal('ed');
  });

  it('should handle a string', () => {
    expect(twodigits('9')).to.equal('09');
    expect(twodigits('l')).to.equal('0l');
    expect(twodigits('lost')).to.equal('st');
  });

  it('should handle an object', () => {
    expect(twodigits({})).to.equal('t]');
  });
});
