/* eslint-env mocha */
const { expect } = require('chai');
const apiFixStack = require('./apiFixStack');

describe('apiFixStack tests', () => {
  beforeEach(() => {
  });

  afterEach(() => {
  });

  it('should be a function', () => {
    expect(apiFixStack).to.be.an('function');
  });

  it('should parse a valid API stack', () => {
    const stack = 'this is a test\n  at blahblah (eval at require blah blah blah, <anonymous>:10:20) and other stuff';
    const load = apiFixStack(stack, '/src/api/somefile.js');
    expect(load).to.equal('this is a test\n  at blahblah (/src/api/somefile.js:8:20) and other stuff');
  });

  it('should parse astack without an API error', () => {
    const stack = 'this is a test\n  at something (/src/lib/things.js:10:20) and other stuff';
    const load = apiFixStack(stack, '/src/api/somefile.js');
    expect(load).to.equal(stack);
  });
});