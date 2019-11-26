/* eslint-env mocha */
const {expect} = require('chai');
const attrEsc = require('./attrEsc');

describe('attrEsc tests', () => {
  it('should be a function', () => {
    expect(attrEsc).to.be.an('function');
  });

  it('should process a string with no need to escape', () => {
    const str = 'the dog is fat';
    expect(attrEsc(str)).to.equal(str);
  });

  it('should handle no param', () => {
    expect(attrEsc()).to.equal('');
  });

  it('should escape a string', () => {
    const inStr = 'the "dog\'s" fat feet & legs';
    const outStr = 'the &quot;dog&amp;s&quot; fat feet &amp; legs';
    expect(attrEsc(inStr)).to.equal(outStr);
  });

  it('should handle a non string', () => {
    expect(attrEsc(1)).to.equal('1');
    expect(attrEsc(false)).to.equal('false');
  });
});
