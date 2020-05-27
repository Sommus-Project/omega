/* eslint-env mocha */
const expect = require('chai').expect;
const proxyquire = require('proxyquire').noCallThru();
var loadData = {};
const httpStub = {
  createServer(app) {
    loadData.httpServer = 'http';
    loadData.app = app;
    return this;
  },
  listen(port, address) {
    loadData.httpPort = port;
    loadData.address = address;
  }
};

const httpsStub = {
  createServer(sslOptions, app) {
    loadData.httpsServer = 'https';
    loadData.sslOption = sslOptions;
    loadData.app = app;
    return this;
  },
  listen(port, address, cb) {
    loadData.httpsPort = port;
    loadData.address = address;
    loadData.cb = cb;
    setTimeout(() => {
      cb();
    },1);
  }
};

const fsStub = {
  readFileSync(fname) {
    return fname;
  }
}

const stubs = {
  http: httpStub,
  https: httpsStub,
  fs: fsStub
}

const startup = proxyquire('./startup', stubs);

describe('startup tests', () => {
  beforeEach(() => {
    loadData = {};
  });

  it('should init', () => {
    expect(startup).to.be.a('function');
  });

  it('should init', (done) => {
    var address = '0.0.0.0';
    var app = {};
    var distPath = '';
    var finished = false;
    var config = {
      httpPort: 40,
      httpsPort: 50,
      keyPath: '-keyPath',
      certPath: '-certPath'
    };
    var sslOptions = {
      key: config.keyPath,
      cert: config.certPath
    }
    var promise = startup(app, distPath, config).then(
      () => {
        expect(finished).to.equal(true);
        done();
      }
    );

    expect(promise).to.be.an.instanceof(Promise);
    expect(loadData.httpServer).to.equal('http');
    expect(loadData.app).to.eql(app);
    expect(loadData.httpPort).to.equal(config.httpPort);
    expect(loadData.address).to.equal(address);

    expect(loadData.httpsServer).to.equal('https');
    expect(loadData.sslOption).to.eql(sslOptions);
    expect(loadData.app).to.eql(app);
    expect(loadData.httpsPort).to.equal(config.httpsPort);
    expect(loadData.address).to.equal(address);
    finished = true;
  });
});
