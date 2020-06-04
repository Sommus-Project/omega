/* eslint-env mocha */
/*
const path = require('path').posix;
const {expect} = require('chai');
const HttpError = require('./HttpError');
const HttpResponse = require('./HttpResponse');
const MockUsageLog = require('./test/MockUsageLog');
const proxyquire = require('proxyquire').noCallThru();
// More info on `peoxyquire`:
// https://github.com/thlorenz/proxyquire#readme
var loadData
var apiFile;

const appPath = process.cwd().replace(/\\/g, '/');
const MOCK_HEADERS = {headers:{a:'A'}};
const getFileArrayFromGlobMock = (cwd, globList) => {
  loadData.glob = {cwd, globList};
  return [apiFile];
}

const api1Mock = {
  doGet() {
    return new HttpResponse({'X-MyHeader': 'none'}, {dog:1}, 200);
  },
  doPut({data}) { // eslint-disable-line no-unused-vars
    return;
  },
  doPost({data}) {}, // eslint-disable-line no-unused-vars
  doPatch({data}) {} // eslint-disable-line no-unused-vars
};

const api2Mock = {
  doGet({id, req}) { // eslint-disable-line no-unused-vars
    req.usageLog.info('Testing');
    return;
  },
  doPut({id, data}) { // eslint-disable-line no-unused-vars
    throw new HttpError(404);
  },
  doDelete({id}) { // eslint-disable-line no-unused-vars
    return new Promise(() => {
      throw new HttpError(404, MOCK_HEADERS);
    });
  }
};

const mockApp = {
  get(u, ...mw) {
    loadData.app.get.push({u, mw});
  },
  put(u, ...mw) {
    loadData.app.put.push({u, mw});
  },
  post(u, ...mw) {
    loadData.app.post.push({u, mw});
  },
  delete(u, ...mw) {
    loadData.app.delete.push({u, mw});
  },
  patch(u, ...mw) {
    loadData.app.patch.push({u, mw});
  },
  options(u, ...mw) {
    loadData.app.options.push({u, mw});
  },
  use(u, ...mw) {
    loadData.app.use.push({u, mw});
  }
}

const apiMockList = {
  './test/mockapi/api1': api1Mock,
  './test/mockapi/api2/(id)': api2Mock,
  './a': api2Mock,
  './dogs/a': api2Mock
}

const mocks = {
  '@sp/omega-lib': {
    getFileArrayFromGlob: getFileArrayFromGlobMock
  },
  './apiLoader': () => {
    return src => apiMockList[src]
  },
  './UsageLog': MockUsageLog
};

const apiSystem = proxyquire('./apiSystem', mocks);

describe('apiSystem tests', function() {
  let resEndCalled = false;
  let resJsonCalled = false;
  let headers = [];
  let status;
  let json;
  const res = {
    locals: {},
    json(val) {
      resJsonCalled = true;
      json = val;
      return this;
    },
    set(val) {
      headers.push(val);
      return this;
    },
    status(val) {
      status = val;
      return this;
    },
    end() {
      resEndCalled = true;
    }
  };

  beforeEach(() => {
    apiFile = 'test/mockapi/api1.js';
    resJsonCalled = false;
    resEndCalled = false;
    headers = [];
    status = undefined;
    json = undefined;
    loadData = {
      app: {
        get: [],
        put: [],
        post: [],
        delete: [],
        patch: [],
        options: [],
        use: []
      },
      glob: null
    };
  });

  afterEach(() => {
  });

  it('should be a function', function() {
    expect(apiSystem).to.be.an('function');
  });

  it('should init', function() {
    var apiUri = '/api';
    var apiFolder = 'test/mockapi';
    apiSystem(mockApp, appPath, {apiFolder, apiUri});
    var temp = path.join(appPath, apiFolder);
    expect(loadData.glob.cwd).to.equal(temp);
    expect(loadData.app.get.length, 'app.get').to.equal(1);
    expect(loadData.app.put.length, 'app.put').to.equal(1);
    expect(loadData.app.post.length, 'app.post').to.equal(1);
    expect(loadData.app.delete.length, 'app.delete').to.equal(1);
    expect(loadData.app.patch.length, 'app.patch').to.equal(1);
    expect(loadData.app.use.length, 'app.use').to.equal(2);
  });

  it('should init with standard config', function() {
    var apiUri = '/api';
    var apiFolder = 'test/mockapi';
    apiFile = 'test/mockapi/api1.js';
    apiSystem(mockApp, appPath, {apiFolder, apiUri});
    var temp = path.join(appPath, apiFolder);
    expect(loadData.glob.cwd).to.equal(temp);
  });

  it('should provide proper call-through for doGet - no id', function() {
    var req = {
      body: undefined,
      params: undefined,
      originalUrl: '/api/test/mockapi/api1'
    };
    var apiUri = '/api';
    var apiFolder = 'test/mockapi';
    apiFile = 'test/mockapi/api1.js';
    apiSystem(mockApp, appPath, {apiFolder, apiUri});
    var temp = path.join(appPath, apiFolder);
    expect(loadData.glob.cwd).to.equal(temp);
    return loadData.app.get[0].mw[0](req, res).then(() => {
      expect(resEndCalled, 'resEndCalled').to.equal(false);
      expect(resJsonCalled, 'resJsonCalled').to.equal(true);
      expect(json, 'json').to.eql({dog:1});
      expect(status, 'status').to.equal(200);
      expect(headers, 'headers').to.eql([{'X-MyHeader': 'none'}]);
    });
  });

  it('should provide proper call-through for doGet - with id', function() {
    var req = {
      body: undefined,
      params: {id:4},
      originalUrl: '/api/test/mockapi/api2/4'
    };
    var apiUri = '/api';
    var apiFolder = 'test/mockapi';
    apiFile = 'test/mockapi/api2/(id).js';
    apiSystem(mockApp, appPath, {apiFolder, apiUri});
    return loadData.app.get[0].mw[0](req, res).then(() => {
      expect(resEndCalled).to.equal(true);
      expect(status).to.equal(204);
      expect(req.usageLog.testData.critical).to.eql([]);
      expect(req.usageLog.testData.error).to.eql([]);
      expect(req.usageLog.testData.warn).to.eql([]);
      expect(req.usageLog.testData.info).to.eql(['Testing']);
      expect(req.usageLog.testData.debug).to.eql([]);
    });
  });

  it('should provide proper call-through for deleteItem', function() {
    var req = {
      body: undefined,
      params: {id:4},
      originalUrl: '/api/test/mockapi/api2/4'
    };
    var apiUri = '/api';
    var apiFolder = 'test/mockapi';
    apiFile = 'test/mockapi/api2/(id).js';
    apiSystem(mockApp, appPath, {apiFolder, apiUri});
    return loadData.app.delete[0].mw[0](req, res).then(() => {
      expect(headers).to.eql([MOCK_HEADERS.headers]);
      expect(json.error).to.equal(true);
      expect(json.status).to.equal(404);
      expect(status).to.equal(404);
    });
  });

  it('should provide proper call-through for OPTIONS', function() {
    var req = {
      body: undefined,
      params: {id:4},
      originalUrl: '/api/test/mockapi/api2/4'
    };
    var apiUri = '/api';
    var apiFolder = 'test/mockapi';
    apiFile = 'test/mockapi/api2/(id).js';
    apiSystem(mockApp, appPath, {apiFolder, apiUri});
    return loadData.app.options[0].mw[0](req, res).then(() => {
      const expectedHeaders = {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'Authorization, Content-Length, Content-Type, Cookie, X-Requested-With',
        'Access-Control-Allow-Methods': 'DELETE, GET, OPTIONS, PUT',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'Content-Length'
      };

      expect(headers).to.eql([expectedHeaders]);
      expect(resEndCalled).to.equal(true, '`res.end` was not called');
      expect(json).to.equal(undefined, 'Invalid send value');
      expect(status).to.equal(204, '`res.status` was called and should not have been.');
    });
  });

  it('should properly handle unsupported verbs', function() {
    var req = {
      body: undefined,
      params: {id:4},
      originalUrl: '/api/test/mockapi/api2/4'
    };
    var apiUri = '/api';
    var apiFolder = 'test/mockapi';
    apiFile = 'test/mockapi/api2/(id).js';
    apiSystem(mockApp, appPath, {apiFolder, apiUri});
    return loadData.app.post[0].mw[0](req, res).then(() => {
      expect(resJsonCalled).to.equal(true);
      expect(json.message).to.equal('Method Not Allowed');
      expect(json.status).to.equal(405);
      expect(json.url).to.equal(req.originalUrl);
      expect(status).to.equal(405);
      expect(headers).to.eql([{Allow: 'DELETE, GET, OPTIONS, PUT'}]);
    }).catch(ex => {
      throw new Error('Threw error and should not have.\n'+ex.stack);
      //expect(ex).to.be.an.instanceof(HttpError);
      //expect(ex.headers).to.eql({Allow: 'DELETE, GET, OPTIONS, PUT'});
    })
  });

  it('should properly handle HttpError', function() {
    var req = {
      body: undefined,
      params: {id:4},
      originalUrl: '/api/test/mockapi/api2/4'
    };
    var apiUri = '/api';
    var apiFolder = 'test/mockapi';
    apiFile = 'test/mockapi/api2/(id).js';
    apiSystem(mockApp, appPath, {apiFolder, apiUri});
    return loadData.app.put[0].mw[0](req, res).then(() => {
      expect(status).to.equal(404);
      expect(json.error).to.equal(true);
      expect(json.title).to.equal('Server Error');
      expect(json.status).to.equal(404);
      expect(json.message).to.equal('Not Found');
      expect(json.url).to.equal('/api/test/mockapi/api2/4');
    }).catch(ex => { // eslint-disable-line no-unused-vars
      throw new Error('Should not have throw error.');
    });
  });
});

// TODO: Add test to validate the function `sortApis`
// TODO: Add test to validate the function `requireApi` not returning an `Object`.
// TODO: Add test(s) to validate the auth features of the APIs
*/
