/* eslint-env mocha */
const {expect} = require('chai');
const HttpError = require('./HttpError');
const apiIdToInt = require('./apiIdToInt');

describe('apiIdToInt tests', () => {
  beforeEach(() => {
  });

  afterEach(() => {
  });

  it('should be a function', () => {
    expect(apiIdToInt).to.be.an('function');
  });

  it('should return a function', () => {
    expect(apiIdToInt()).to.be.an('function');
  });

  it('should parse a valid number', () => {
    var load = apiIdToInt()('345');
    expect(load).to.equal(345);
  });

  it('should throw error with invalid number', done => {
    try {
      apiIdToInt('mine')('K');
      done('Should have thrown an error');
    }

    catch(ex) {
      expect(ex).to.be.an.instanceof(HttpError);
      expect(ex.status).to.equal(400);
      expect(ex.data).to.equal('Invalid id: mine/K');
      done();
    }
  });
});
