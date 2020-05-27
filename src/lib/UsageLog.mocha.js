/* eslint-env mocha */
const { expect } = require('chai');
const proxyquire = require('proxyquire');
const os = require('os');
const OS_HOST = os.hostname();
const { SEVERITY_LEVEL, SECURITY_LEVEL_STR } = require('./SEVERITY_LEVEL');
const ANONYMOUS_USER = 'ANONYMOUS';

let fsError;
let fsData = [];
const fsStub = {
  appendFile(fileName, dataStr, cb) {
    const re = /\}\n\{/g;
    const reVal = '},{';
    const data = JSON.parse(`[${dataStr.replace(re, reVal)}]`);
    fsData.push({ fileName, data });

    if (fsError) {
      return cb(fsError);
    }

    cb();
  }
}

const stubs = {
  fs: fsStub
}

let resCbs;
let req;
let expectedData;

function doResFinishCb() {
  const array = resCbs.finish;
  if (array) {
    array.forEach(
      fn => {
        if (typeof fn == 'function') {
          fn();
        }
      }
    );
  }
}

const UsageLog = proxyquire('./UsageLog', stubs);

describe('UsageLog tests', () => {
  beforeEach(() => {
    fsData = [];
    fsError = null;
    resCbs = {};
    req = {
      body: undefined,
      headers: {'user-agent': 'cool testing app'},
      hostname: 'big.server.com',
      ip: '123.23.34.45',
      requestId: '123456ABCDEF',
      socket: {
        localPort: 443
      },
      protocol: 'https',
      method: 'GET',
      originalUrl: '/url/for/testing',
      res: {
        on(event, cb) {
          resCbs[event] = resCbs[event] || [];
          resCbs[event].push(cb);
        },
        statusCode: 200,
        statusMessage: 'OK'
      }
    };
    expectedData = {
      client: req.headers['user-agent'],
      extraInfo: { default: {} },
      host: req.hostname,
      ip: req.ip,
      level: SECURITY_LEVEL_STR[SEVERITY_LEVEL.INFO],
      nodeID: OS_HOST,
      nodeRequestID: req.requestId,
      parameters: '',
      port: req.socket.localPort,
      protocol: req.protocol,
      requestBody: '',
      requestID: `node-${req.requestId}`,
      responseCode: '200 OK',
      urlPath: req.originalUrl,
      user: ANONYMOUS_USER,
      verb: req.method
    }
  });

  it('should be a function', () => {
    expect(UsageLog).to.be.an('function'); // A Class is just a function
  });

  it('should throw with no parameter in constructor', (done) => {
    function doIt() {
      const ul = new UsageLog(); // eslint-disable-line no-unused-vars
      done(new Error(`Should have thrown an error and did not.`))
    }

    expect(doIt).to.throw(TypeError);
    done();
  });

  it('should work with no user object', (done) => {
    const ul = new UsageLog(req); // eslint-disable-line no-unused-vars
    doResFinishCb();
    setTimeout(() => {
      expect(fsData.length).to.equal(1);
      expectedData.timestamp = fsData[0].data[0].timestamp;
      expect(fsData[0].data).to.eql([expectedData]);
      done();
    }, 110);
  });

  it('should work with a user object', (done) => {
    req.user = {
      provider: 'bedrock',
      username: 'fred'
    };

    expectedData.user = `${req.user.username}@${req.user.provider}`;
    const ul = new UsageLog(req); // eslint-disable-line no-unused-vars
    doResFinishCb();
    setTimeout(() => {
      expect(fsData.length).to.equal(1);
      expectedData.timestamp = fsData[0].data[0].timestamp;
      expect(fsData[0].data).to.eql([expectedData]);
      done();
    }, 110);
  });

  it('should work with extra error', (done) => {
    req.user = {
      provider: 'bedrock',
      username: 'fred'
    };

    expectedData.user = `${req.user.username}@${req.user.provider}`;
    const ul = new UsageLog(req);
    ul.error('error message');
    doResFinishCb();
    expectedData.level = SECURITY_LEVEL_STR[SEVERITY_LEVEL.ERROR];
    expectedData.extraInfo.default[expectedData.level] = ['error message'];

    setTimeout(() => {
      expect(fsData.length).to.equal(1);
      expectedData.timestamp = fsData[0].data[0].timestamp;
      expect(fsData[0].data).to.eql([expectedData]);
      done();
    }, 110);
  });

  it('should work with extra critical as Error object', (done) => {
    const ul = new UsageLog(req);
    ul.critical(new Error('critical message'));
    doResFinishCb();
    expectedData.level = SECURITY_LEVEL_STR[SEVERITY_LEVEL.CRITICAL];
    expectedData.extraInfo.default[expectedData.level] = ['critical message'];

    setTimeout(() => {
      expect(fsData.length).to.equal(1);
      expectedData.timestamp = fsData[0].data[0].timestamp;
      expect(fsData[0].data).to.eql([expectedData]);
      done();
    }, 110);
  });

  it('should work with extra debug', (done) => {
    const ul = new UsageLog(req);
    ul.debug('debug message');
    ul.debug('second debug message');
    doResFinishCb();
    const debugLevel = SECURITY_LEVEL_STR[SEVERITY_LEVEL.DEBUG]
    expectedData.extraInfo.default[debugLevel] = ['debug message', 'second debug message'];

    setTimeout(() => {
      expect(fsData.length).to.equal(1);
      expectedData.timestamp = fsData[0].data[0].timestamp;
      expect(fsData[0].data).to.eql([expectedData]);
      done();
    }, 110);
  });

  it('should work with two log entries', (done) => {
    const ul1 = new UsageLog(req);

    req.user = {
      provider: 'bedrock',
      username: 'fred'
    };
    req.originalUrl = '/url/for/testing?dogs=woof';
    const ul2 = new UsageLog(req);
    ul1.info('info message');
    ul2.warn('warn message');
    doResFinishCb();

    setTimeout(() => {
      expect(fsData.length).to.equal(1);
      const expected = [{...expectedData}, {...expectedData}];
      expected[0].timestamp = fsData[0].data[0].timestamp;
      expected[0].level = SECURITY_LEVEL_STR[SEVERITY_LEVEL.INFO];
      expected[0].extraInfo = {
        default: {
          [expected[0].level]: ['info message']
        }
      };

      expected[1].user = `${req.user.username}@${req.user.provider}`;
      expected[1].parameters = 'dogs=woof';
      expected[1].timestamp = fsData[0].data[1].timestamp;
      expected[1].level = SECURITY_LEVEL_STR[SEVERITY_LEVEL.WARNING];
      expected[1].extraInfo = {
        default: {
          [expected[1].level]: ['warn message']
        }
      };

      expect(fsData[0].data).to.eql(expected);
      done();
    }, 110);
  });

  it('should work with Boolean values', (done) => {
    const ul1 = new UsageLog(req);

    req.user = {
      provider: 'bedrock',
      username: 'fred'
    };
    req.originalUrl = '/url/for/testing?dogs=woof';
    const ul2 = new UsageLog(req);
    ul1.info(true);
    ul2.warn(false);
    doResFinishCb();

    setTimeout(() => {
      expect(fsData.length).to.equal(1);
      const expected = [{ ...expectedData }, { ...expectedData }];
      expected[0].timestamp = fsData[0].data[0].timestamp;
      expected[0].level = SECURITY_LEVEL_STR[SEVERITY_LEVEL.INFO];
      expected[0].extraInfo = {
        default: {
          [expected[0].level]: [true]
        }
      };

      expected[1].user = `${req.user.username}@${req.user.provider}`;
      expected[1].parameters = 'dogs=woof';
      expected[1].timestamp = fsData[0].data[1].timestamp;
      expected[1].level = SECURITY_LEVEL_STR[SEVERITY_LEVEL.WARNING];
      expected[1].extraInfo = {
        default: {
          [expected[1].level]: [false]
        }
      };

      expect(fsData[0].data).to.eql(expected);
      done();
    }, 110);
  });

  it('should work with Number values', (done) => {
    const ul1 = new UsageLog(req);

    req.user = {
      provider: 'bedrock',
      username: 'fred'
    };
    req.originalUrl = '/url/for/testing?dogs=woof';
    const ul2 = new UsageLog(req);
    ul1.info(0);
    ul1.info(923782);
    ul2.warn(-999);
    doResFinishCb();

    setTimeout(() => {
      expect(fsData.length).to.equal(1);
      const expected = [{ ...expectedData }, { ...expectedData }];
      expected[0].timestamp = fsData[0].data[0].timestamp;
      expected[0].level = SECURITY_LEVEL_STR[SEVERITY_LEVEL.INFO];
      expected[0].extraInfo = {
        default: {
          [expected[0].level]: [0, 923782]
        }
      };

      expected[1].user = `${req.user.username}@${req.user.provider}`;
      expected[1].parameters = 'dogs=woof';
      expected[1].timestamp = fsData[0].data[1].timestamp;
      expected[1].level = SECURITY_LEVEL_STR[SEVERITY_LEVEL.WARNING];
      expected[1].extraInfo = {
        default: {
          [expected[1].level]: [-999]
        }
      };

      expect(fsData[0].data).to.eql(expected);
      done();
    }, 110);
  });
});
