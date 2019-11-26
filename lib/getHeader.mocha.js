/* eslint-env mocha */
const expect = require('chai').expect;
const getHeader = require('./getHeader');

describe('getHeader.js tests', function() {
  it('should init', function() {
    expect(getHeader).to.be.a('function');
  });

  it('should fail with no params', function (done) {
    try {
      getHeader();
      done(new Error('Should have thrown an error'));
    }

    catch(ex) {
      expect(ex instanceof TypeError).to.equal(true);
      expect(ex.message).to.equal('`headers` must be an object');
      done();
    }
  });

  it('should fail with invalid first param', function (done) {
    try {
      getHeader(10);
      done(new Error('Should have thrown an error'));
    }

    catch (ex) {
      expect(ex instanceof TypeError).to.equal(true);
      expect(ex.message).to.equal('`headers` must be an object');
      done();
    }
  });

  it('should fail with invalid second param', function (done) {
    try {
      getHeader({}, 10);
      done(new Error('Should have thrown an error'));
    }

    catch (ex) {
      expect(ex instanceof TypeError).to.equal(true);
      expect(ex.message).to.equal('`headerKey` must be a string');
      done();
    }
  });

  it('should return undefined with missing header', function (done) {
    try {
      const val = getHeader({cat:'meow'}, 'dog');
      expect(val).to.equal(undefined);
      done();
    }

    catch (ex) {
      done(new Error('Should not have thrown an error'));
    }
  });

  it('should return value with found header', function (done) {
    const headers = {
      cat: 'meow',
      'X-Some-Header': 'one-two-three'
    };

    try {
      const val = getHeader(headers, 'X-SOME-HEADER');
      expect(val).to.equal(headers['X-Some-Header']);
      done();
    }

    catch (ex) {
      done(new Error('Should not have thrown an error'));
    }
  });
});
