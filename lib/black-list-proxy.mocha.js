/* eslint-env mocha */
const expect = require('chai').expect;
const HttpError = require('./HttpError');
const proxyquire = require('proxyquire').noCallThru();
let cbResponse;
let loadData;

class Request {
  get socket() {
    return {
      destroy() {
        loadData.socketDestroyCalled = true;
      }
    };
  }

  constructor(val) {
    this.val = val;
  }

  abort() {
    loadData.abortCalled = true;
  }

  on(evt, cb) {
    loadData.onList = loadData.onList || [];
    loadData.onList.push({evt, cb})
  }

  setTimeout(timeout, cb) {
    loadData.timeoutList = loadData.timeoutList || [];
    loadData.timeoutList.push({timeout, cb})
  }

  setSocketKeepAlive(bool) {
    loadData.keepAlive = bool;
  }
}

var debugList = [];
const debugStub = () => (...args) => debugList.push(...args);

const httpStub = {
  request(options, cb) {
    loadData.request = {options, cb};
    // Clear the `agent` value since we don't care what it is for testing.
    loadData.request.options.agent = {};
    setTimeout(() => {
      cb(cbResponse);
    }, 0);
    return new Request();
  },
  Agent: () => ({})
}

const stubs = {
  'debug': debugStub,
  'http': httpStub,
  'https': httpStub
}

const proxy = proxyquire('./black-list-proxy', stubs);

const req = {
  connection:{
    encrypted: true
  },
  socket: {
    localAddress: '86.75.30.9',
    remoteAddress: '33.44.55.66'
  },
  pipe(request) {
    loadData.pipeToReq = request;
  }
};

const res = {
  headersSent: false,
  status(val) {
    loadData.status = val;
  },
  writeHead(status, headers) {
    loadData.status = status;
    loadData.resHeader = headers;
  }
}

describe('black-list-proxy tests', () => {
  beforeEach(() => {
    req.connection.encrypted = true;
    req.originalUrl = '';
    req.headers = {host:'testing'};
    req.method = 'GET';
    delete req.proxyLookup;
    debugList = [];
    loadData = {};
    cbResponse = {
      statusCode: 404,
      headers: {},
      pipe() {}
    };
  });

  it('should be a function', () => {
    expect(proxy).to.be.a('function');
    expect(proxy()).to.be.a('function');
  });

  it('should not proxy a non-excrypted request', done => {
    let mw = proxy();
    req.connection.encrypted = false;
    mw(req, res, () => {
      expect(debugList.length).to.equal(1);
      expect(debugList[0]).to.equal('Not Encrypted - No proxy.');
      done();
    })
  });

  it('should not proxy a path that should be ignored', done => {
    const config = {
      proxyLookup: [
        { pathRe: /^\/dogs\/cats([/?#].*)?$/, proxy: false }
      ]
    };
    let mw = proxy(config);
    req.originalUrl = '/dogs/cats';
    mw(req, res, () => {
      const expected = `Proxy skip: /dogs/cats => ${config.proxyLookup[0].pathRe.toString()}`;
      expect(debugList.length).to.equal(1);
      expect(debugList[0]).to.equal(expected);
      done();
    })
  });

  it('should proxy an HTTP path that is not ignored', done => {
    const host = 'www.moon.org';
    const config = {
      proxyLookup: [
        { pathRe: /^\/dogs\/cats$/, proxy: false },
        { pathRe: /^\/dogs\/cats([/?#].*)?$/, proxy: {hostname: host, port: 98, protocol: 'http'} }
      ]
    };

    let mw = proxy(config);
    req.originalUrl = '/dogs/cats/2';
    req.headers.host = host;
    mw(req, res, () => {
      done('Next should not have been called.');
    })
    const expected = {
      agent: {},
      headers: {
        'X-Forwarded-For': '33.44.55.66',
        'X-Real-IP': '33.44.55.66',
        'X-Forwarded-Host': host
      },
      hostname: 'www.moon.org',
      method: 'GET',
      path: '/dogs/cats/2',
      protocol: 'http:',
      port: 98
    };
    expect(loadData.request.options).to.eql(expected);
    done();
  });

  it('should proxy when req.proxyLookup is provided', done => {
    const config = {};
    let mw = proxy(config);

    req.proxyLookup = [
      { pathRe: /^\/dogs\/cats([/?#].*)?$/, proxy: { hostname: 'www.moon.org', port: 98, protocol: 'http' } }
    ]
    req.originalUrl = '/dogs/cats/2';
    mw(req, res, () => {
      done('Next should not have been called.');
    })
    const expected = {
      agent: {},
      headers: {
        'X-Forwarded-For': '33.44.55.66',
        'X-Real-IP': '33.44.55.66',
        'X-Forwarded-Host': 'testing'
      },
      hostname: 'www.moon.org',
      method: 'GET',
      path: '/dogs/cats/2',
      protocol: 'http:',
      port: 98
    };
    expect(loadData.request.options).to.eql(expected);
    done();
  });

  it('should not proxy a when no proxyLookup is provided', done => {
    let mw = proxy();
    req.originalUrl = '/css/dogs/cats';
    mw(req, res, () => {
      expect(debugList.length).to.equal(1);
      expect(debugList[0]).to.equal('No proxyLookup. Not proxying any file.');
      done();
    })
  });

  it('should proxy a valid GET', done => {
    const config = {
      proxyLookup: [
        { pathRe: /^\/dogs\/cats([/?#].*)?$/, proxy: { hostname: 'localhost', port: 4443, protocol: 'https' } }
      ]
    };

    let mw = proxy(config);
    req.originalUrl = '/dogs/cats';
    req.headers.cookie = 'yummy';
    req.headers['x-forwarded-for'] = '1.2.3.4, 2.3.4.5';
    mw(req, res, () => {
      done('`next` should not have been called.');
    })

    var expected = {
      agent: {},
      protocol: 'https:',
      hostname: 'localhost',
      port: 4443,
      headers: {
        'X-Forwarded-For': '1.2.3.4, 2.3.4.5, 33.44.55.66',
        "X-Real-IP": "1.2.3.4",
        'X-Forwarded-Host': 'testing',
        cookie: 'yummy'
      },
      path: req.originalUrl,
      method: req.method
    };
    expect(loadData.request.options).to.eql(expected);
    expect(loadData.request.cb).to.be.a('function');
    expect(loadData.timeoutList.length).to.equal(1);
    expect(loadData.timeoutList[0].timeout).to.equal(30000);
    expect(loadData.timeoutList[0].cb).to.be.a('function');
    expect(loadData.onList.length).to.equal(1);
    expect(loadData.onList[0].evt).to.equal('error');
    expect(loadData.onList[0].cb).to.be.a('function');
    expect(loadData.socketDestroyCalled).to.equal(undefined);
    expect(loadData.keepAlive).to.equal(undefined);
    done();
  });

  it('should proxy a valid GET and delete cookie', done => {
    const config = {
      cookies: false,
      proxyLookup: [
        { pathRe: /^\/dogs\/cats([/?#].*)?$/, proxy: { hostname: 'localhost', port: 4443, protocol: 'https' } }
      ]
    };

    let mw = proxy(config);
    req.originalUrl = '/dogs/cats';
    req.headers.cookie = 'yummy';

    mw(req, res, () => {
      done('`next` should not have been called.');
    })

    var options = {
      agent: {},
      protocol: 'https:',
      hostname: 'localhost',
      port: 4443,
      headers: {
        'X-Forwarded-For': '33.44.55.66',
        "X-Real-IP": "33.44.55.66",
        'X-Forwarded-Host': 'testing'
      },
      path: req.originalUrl,
      method: req.method
    };
    expect(loadData.request.options).to.eql(options);
    done();
  });

  it('should proxy a valid GET with timeout', done => {
    const config = {
      proxyLookup: [
        { pathRe: /^\/dogs\/cats([/?#].*)?$/, proxy: { hostname: 'localhost', port: 4443, protocol: 'https' } }
      ]
    };

    let mw = proxy(config);
    req.originalUrl = '/dogs/cats';
    var nextCalled = false;
    mw(req, res, (err) => {
      expect(loadData.socketDestroyCalled).to.equal(true);
      expect(loadData.keepAlive).to.equal(false);
      expect(loadData.status).to.equal(504);
      expect(err).to.be.an.instanceof(HttpError);
      nextCalled = true;
      done();
    })

    expect(loadData.timeoutList.length).to.equal(1);
    expect(loadData.timeoutList[0].cb).to.be.a('function');
    loadData.timeoutList[0].cb();
    expect(nextCalled).to.equal(true);
  });

  it('should proxy a valid GET with preCallback', done => {
    let preCallbackWasCalled = false;

    function preCallback(options/*, req*/) {
      const { agent, ...rest } = options; // eslint-disable-line no-unused-vars
      const expected = {
        headers: {
          "X-Forwarded-For": "33.44.55.66",
          "X-Real-IP": "33.44.55.66",
          'X-Forwarded-Host': 'testing',
          authtoken: "Nicklecade",
          authuser: "myusername"
        },
        hostname: 'www.taco.com',
        method: 'GET',
        path: '/dogs/cats',
        protocol: 'http:',
        port: 14443
      };
      expect(rest).to.eql(expected);
      preCallbackWasCalled = true;
    }

    const config = {
      token: 'Nicklecade',
      username: 'myusername',
      preCallback,
      proxyLookup: [
        { pathRe: /^\/dogs\/cats([/?#].*)?$/, proxy: { hostname: 'www.taco.com', port: 14443, protocol: 'http' } }
      ]
    };

    let mw = proxy(config);
    req.originalUrl = '/dogs/cats';
    mw(req, res, () => {
      done(new Error('`next` should not have been called.'));
    })

    setTimeout(() => {
      expect(preCallbackWasCalled).to.equal(true);
      done();
    }, 0);
  });

  it('should proxy a valid GET with postCallback', done => {
    let postCallbackWasCalled = false;
    cbResponse.statusCode = 301;
    cbResponse.headers = {
      location: 'https://dogs.com/one/two/three?fun=free',
      one: 'This is header one',
      two: 'This is header two'
    };
    req.originalUrl = '/dogs/cats';

    function postCallback(resp/*, req, options*/) {
      expect(resp.headers.location).to.equal(cbResponse.headers.location);
      expect(resp.headers.one).to.equal(cbResponse.headers.one);
      expect(resp.headers.two).to.equal(cbResponse.headers.two);
      postCallbackWasCalled = true;
    }

    const config = {
      postCallback,
      proxyLookup: [
        { pathRe: /^\/dogs\/cats([/?#].*)?$/, proxy: { hostname: 'localhost', port: 4443, protocol: 'https' } }
      ]
    };

    let mw = proxy(config);
    mw(req, res, () => {
      done(new Error('`next` should not have been called.'));
    })

    setTimeout(() => {
      expect(postCallbackWasCalled).to.equal(true);
      done();
    }, 0);
  });

  it('should proxy a valid GET with error', done => {
    const config = {
      proxyLookup: [
        { pathRe: /^\/dogs\/cats([/?#].*)?$/, proxy: { hostname: 'localhost', port: 4443, protocol: 'https' } }
      ]
    };

    let mw = proxy(config);
    req.originalUrl = '/dogs/cats';
    req.headers.cookie = 'yummy';
    var nextCalled = false;
    var errorMessage = 'We Failed.';
    mw(req, res, (err) => {
      expect(loadData.socketDestroyCalled).to.equal(undefined);
      expect(loadData.keepAlive).to.equal(undefined);
      expect(loadData.status).to.equal(undefined);
      expect(err).to.equal(errorMessage);
      nextCalled = true;
      done();
    })

    expect(loadData.onList.length).to.equal(1);
    expect(loadData.onList[0].cb).to.be.a('function');
    loadData.onList[0].cb(errorMessage);
    expect(nextCalled).to.equal(true);
  });

  // TODO: Need to handle a response
  // TODO: need to handle a POST
});
