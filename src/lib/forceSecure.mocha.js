/* eslint-env mocha */
const expect = require('chai').expect;
const forceSecure = require('./forceSecure');

describe('forceSecure tests', function() {
  var encrypted = false;
  var hostname = '';
  var originalUrl = '';
  var returnType = '';
  var returnVal = '';

  var req = {
    connection: {
      get encrypted() {
        return encrypted;
      }
    },
    get hostname() {
      return hostname;
    },
    get originalUrl() {
      return originalUrl;
    }
  };

  var res = {
    end() {},
    redirect(url) {
      returnType = 'redirect';
      returnVal = url;
      return this;
    },
    send(val) {
      returnType = 'send';
      returnVal = val;
      return this;
    }
  }

  beforeEach(() => {
    encrypted = false;
    hostname = '';
    originalUrl = '';
    returnType = '';
    returnVal = '';
  });

  afterEach(() => {
  });

  it('should init', function() {
    expect(forceSecure).to.be.a('function');
  });

  it('should return a function', function() {
    expect(forceSecure()).to.be.a('function');
  });

  it('should handle encrypted connection', function() {
    encrypted = true;

    forceSecure()(req, res, err => {
      expect(err).to.equal(undefined);
      expect(hostname).to.equal('');
      expect(originalUrl).to.equal('');
      expect(returnType).to.equal('');
      expect(returnVal).to.equal('');
    });
  });

  it('should handle non-encrypted connection(5000)-server redirect', function() {
    hostname = 'my-host.com';
    originalUrl = '/tacos/are/great';

    forceSecure(5000, false)(req, res, null);

    expect(returnType).to.equal('redirect');
    expect(returnVal).to.equal('https://my-host.com:5000/tacos/are/great');
  });

  it('should handle non-encrypted connection(443)-client redirect', function() {
    forceSecure(443)(req, res, null);

    var portRe = /port\s*=\s*'([^']+)'/;
    var match = returnVal.match(portRe);

    expect(returnType).to.equal('send');
    expect(match).to.be.equal(null);
  });
});
