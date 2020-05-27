
/* eslint-env mocha */
const { expect } = require('chai');
const types = require('./types');
const { isBool, isDate, isNum, isObj, isStr } = types; // eslint-disable-line no-unused-vars

describe('Tests for /src/lib/types.js', () => {
  beforeEach(() => {
  });

  it('should be a valid object', () => {
    expect(types).to.be.an('object');
    expect(Object.keys(types).length).to.equal(6);
    expect(types.VALUE_MUST_BE).to.be.an('object');
    expect(types.isBool).to.be.a('function');
    expect(types.isDate).to.be.a('function');
    expect(types.isNum).to.be.a('function');
    expect(types.isObj).to.be.a('function');
    expect(types.isStr).to.be.a('function');
  });

  it('should properly detect a bool', () => {
    expect(isBool(true)).to.equal(true);
    expect(isBool(false)).to.equal(true);
    expect(isBool(Boolean(1))).to.equal(true);
    expect(isBool(Boolean(0))).to.equal(true);
    expect(isBool(new Boolean(1))).to.equal(true); // eslint-disable-line no-new-wrappers
    expect(isBool(new Boolean(0))).to.equal(true); // eslint-disable-line no-new-wrappers
    expect(isBool(null)).to.equal(false);
    expect(isBool()).to.equal(false);
    expect(isBool(1)).to.equal(false);
    expect(isBool(0)).to.equal(false);
    expect(isBool('test')).to.equal(false);
    expect(isBool({})).to.equal(false);
    expect(isBool(new Date())).to.equal(false);
  });

  it('should properly detect a Date', () => {
    expect(isDate(true)).to.equal(false);
    expect(isDate(false)).to.equal(false);
    expect(isDate(null)).to.equal(false);
    expect(isDate()).to.equal(false);
    expect(isDate(1)).to.equal(false);
    expect(isDate(0)).to.equal(false);
    expect(isDate('test')).to.equal(false);
    expect(isDate({})).to.equal(false);
    expect(isDate(new Date())).to.equal(true);
  });

  it('should properly detect a Number', () => {
    expect(isNum(true)).to.equal(false);
    expect(isNum(false)).to.equal(false);
    expect(isNum(null)).to.equal(false);
    expect(isNum()).to.equal(false);
    expect(isNum(1.4)).to.equal(true);
    expect(isNum(0)).to.equal(true);
    expect(isNum(Number('2.3'))).to.equal(true);
    expect(isNum(new Number('2.3'))).to.equal(true); // eslint-disable-line no-new-wrappers
    expect(isNum('test')).to.equal(false);
    expect(isNum({})).to.equal(false);
    expect(isNum(new Date())).to.equal(false);
  });

  it('should properly detect a String', () => {
    expect(isStr(true)).to.equal(false);
    expect(isStr(false)).to.equal(false);
    expect(isStr(null)).to.equal(false);
    expect(isStr()).to.equal(false);
    expect(isStr(1.4)).to.equal(false);
    expect(isStr(0)).to.equal(false);
    expect(isStr('test')).to.equal(true);
    expect(isStr(String('2.3'))).to.equal(true);
    expect(isStr(new String('2.3'))).to.equal(true); // eslint-disable-line no-new-wrappers
    expect(isStr({})).to.equal(false);
    expect(isStr(new Date())).to.equal(false);
  });

  it('should properly detect an Object', () => {
    expect(isObj(true)).to.equal(false);
    expect(isObj(false)).to.equal(false);
    expect(isObj(null)).to.equal(false);
    expect(isObj()).to.equal(false);
    expect(isObj(1.4)).to.equal(false);
    expect(isObj(0)).to.equal(false);
    expect(isObj('test')).to.equal(false);
    expect(isObj(String('2.3'))).to.equal(false);
    expect(isObj(new String('2.3'))).to.equal(false); // eslint-disable-line no-new-wrappers
    expect(isObj({})).to.equal(true);
    expect(isObj(new Date())).to.equal(false);
  });
});
