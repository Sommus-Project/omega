/* eslint-env mocha */
const expect = require('chai').expect;
const getXForwardedForHeader = require('./getXForwardedForHeader');

describe('getXForwardedForHeader tests', function () {
  it('should init', function () {
    expect(getXForwardedForHeader).to.be.a('function');
  });

  it('should read proper header', function () {
    const req = {
      headers: {
        // all keys for req.headers muct be lower case.
        'x-forwarded-for': '123.123.21.32, 1.2.3.4'
      },
      socket: {
        remoteAddress: '12.12.12.12',
        localAddress: '127.0.0.1'
      }
    }
    expect(getXForwardedForHeader(req)).to.equal('123.123.21.32, 1.2.3.4, 12.12.12.12');
  });

  it('should use remoteAddress', function () {
    const req = {
      headers: {},
      socket: {
        remoteAddress: '12.12.12.12',
        localAddress: '127.0.0.1'
      }
    }
    expect(getXForwardedForHeader(req)).to.equal('12.12.12.12');
  });
});
