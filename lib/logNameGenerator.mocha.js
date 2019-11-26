/* eslint-env mocha */
const { expect } = require('chai');
const logNameGenerator = require('./logNameGenerator');

describe('logNameGenerator tests', () => {
  it('should be a function', () => {
    expect(logNameGenerator).to.be.an('function');
  });

  it('should return a function', () => {
    expect(logNameGenerator('dogs')).to.be.a('function');
  });

  it('should return a valid string with no date or index', () => {
    expect(logNameGenerator('dogs.log')()).to.equal('dogs.log');
  });

  it('should return a valid string with date but no index', () => {
    const dt = new Date(1999, 11, 31)
    expect(logNameGenerator('dogs.log')(dt)).to.equal('dogs-1999-12-31.log');
  });

  it('should return a valid string with date and index', () => {
    const dt = new Date(1999,1,3)
    expect(logNameGenerator('dogs.log')(dt, 1)).to.equal('dogs-1999-02-03.1.log');
  });
});