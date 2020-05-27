/* eslint-env mocha */
const {expect} = require('chai');
const HttpError = require('./HttpError');
const throw404 = require('./throw404');

describe('throw404 tests', () => {
  beforeEach(() => {
  });

  afterEach(() => {
  });

  it('should be a function', () => {
    expect(throw404).to.be.an('function');
  });

  it('should throw error with parameters', done => {
    try {
      throw404('mine', 'K');
      done('Should have thrown an error');
    }

    catch(ex) {
      expect(ex).to.be.an.instanceof(HttpError);
      expect(ex.status).to.equal(404);
      expect(ex.headers).to.eql({'X-No-Entity':'mine'});
      expect(ex.title).to.equal('K');
      done();
    }
  });

  it('should throw error without parameters', done => {
    try {
      throw404();
      done('Should have thrown an error');
    }

    catch(ex) {
      expect(ex).to.be.an.instanceof(HttpError);
      expect(ex.status).to.equal(404);
      expect(ex.headers).to.eql({'X-No-Entity':'Unknown path'});
      expect(ex.title).to.equal('');
      done();
    }
  });
});
