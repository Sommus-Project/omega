/* eslint-env mocha */
//const http = require('http');
const { expect } = require('chai');
const SEVERITY_LEVEL = require('./SEVERITY_LEVEL');

describe('Tests for SEVERITY_LEVEL.js', () => {
  it('should expose proper objects', () => {
    expect(SEVERITY_LEVEL).to.be.an('object');
    expect(Object.keys(SEVERITY_LEVEL)).to.eql(['SEVERITY_LEVEL', 'SECURITY_LEVEL_STR']);
    expect(SEVERITY_LEVEL.SEVERITY_LEVEL).to.be.an('object');
    expect(SEVERITY_LEVEL.SECURITY_LEVEL_STR).to.be.an('object');
  });
});
