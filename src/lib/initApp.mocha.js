/* eslint-env mocha */
const expect = require('chai').expect;
const realOmegaLib = require('@sp/omega-lib');
const proxyquire = require('proxyquire').noCallThru();
const deepDirs = {
  './testing-dist': ['myFile.js','one/otherFile.js']
}
let assets = {
  script: {
    head: ['script-head'],
    body: ['script-body']
  },
  css: {
    head: ['css-head'],
    body: ['css-body']
  }
};

const processAssetsStubs = () => ({
  processScripts: () => 'processScriptsFn',
  processStyles: () => 'processStylesFn',
  processMeta: 'processMetaFn'
});

const readDeepDirsStubs = (srcPath) => deepDirs[srcPath] || [];

const APP_NAME = 'my-test-app';
const stubs = {
  './calcAssets': (moduleFormat, listOfAssets) => { // eslint-disable-line no-unused-vars
    assets.script.head = `${moduleFormat}/script-head`;
    assets.script.body = `${moduleFormat}/script-body`;
    assets.css.head = 'css-head';
    assets.css.body = 'css-body';
    return assets
  },
  './processAssets': processAssetsStubs,
  '@sp/omega-lib': {
    readDeepDirs: readDeepDirsStubs,
    Db: realOmegaLib.Db
  },
  '\\a\\package.json': {name:APP_NAME},
  '/a/package.json': {name:APP_NAME}
}

const initApp = proxyquire('./initApp', stubs);

var apiSetVals = {};
const appMock = {
  set: (key, val) => {
    apiSetVals[key] = val;
  },
  locals: {}
}

describe('initApp tests', () => {
  let realCwd;

  after(() => {
    process.cwd = realCwd;
  });

  before(() => {
    realCwd = process.cwd;
    process.cwd = () => '/a'
  });

  beforeEach(() => {
    apiSetVals = {};
    appMock.locals = {};
    assets = {
      script: {
        head: [],
        body: []
      },
      css: {
        head: [],
        body: []
      }
    };
  });

  it('should init', () => {
    expect(initApp).to.be.a('function');
  });

  it('should set app info', () => {
    let options = {
      favicon: 'myFavIcon'
    };
    var staticPaths = ['./testing-dist'];

    var retFn = initApp(appMock, staticPaths, options);
    expect(retFn).to.be.a('function');
    expect(apiSetVals.appName).to.equal(APP_NAME);
    expect(appMock.locals.appName).to.equal(APP_NAME);
    expect(appMock.locals.defaultFavicon).to.equal(options.favicon);
  });

  it('should set use default icon', () => {
    let options = {};
    var staticPaths = ['./testing-dist'];

    initApp(appMock, staticPaths, options);
    expect(appMock.locals.defaultFavicon).to.equal('/brand/img/favicon.ico');
  });

  it('should set res info', () => {
    let options = {
      favicon: 'myFavIcon'
    };
    var staticPaths = ['./testing-dist'];
    var retFn = initApp(appMock, staticPaths, options);

    const req = {
      requestId: 1,
      cookies: {
        'auth_tkt': 'none'
      },
      accepts() {},
      protocol: 'https',
      hostname: 'www.dogfood.com',
      method: 'GET',
      originalUrl: '/myurl',
      path: '/myurl',
      headers: {
        accept: ''
      },
      query: {}
    }

    const res = {
      locals: {
        browserNeeds: {
          module: 'CJS'
        }
      },
      on(key, cb) { // eslint-disable-line no-unused-vars
        // do nothing
      }
    };

    retFn(req, res, () => {
      expect(Object.keys(res.locals).length).to.equal(11);
      expect(res.locals.url).to.eql(`${req.protocol}://${req.hostname}${req.path}`);
      expect(res.locals.assets).to.eql({});
      expect(res.locals.calcAssets.script.head).to.equal('CJS/script-head');
      expect(res.locals.calcAssets.script.body).to.equal('CJS/script-body');
      expect(res.locals.calcAssets.css.head).to.equal('css-head');
      expect(res.locals.calcAssets.css.body).to.equal('css-body');
      expect(res.locals.locale).to.equal('en-US');
      expect(res.locals.page).to.eql({});
      expect(res.locals.process.meta).to.equal('processMetaFn');
      expect(res.locals.process.scripts).to.equal('processScriptsFn');
      expect(res.locals.process.styles).to.equal('processStylesFn');
      expect(res.locals._layoutFile).to.equal(true);
    })
  });


  it('should set res info using default module path', () => {
    let options = {
      favicon: 'myFavIcon'
    };
    var staticPaths = ['./testing-dist'];
    var retFn = initApp(appMock, staticPaths, options);

    const req = {
      requestId: 1,
      cookies: {
        'auth_tkt': 'none'
      },
      accepts() {},
      method: 'GET',
      originalUrl: '/myurl',
      headers: {
        accept: ''
      },
      query: {}
    }

    const res = {
      locals: {
      },
      on(key, cb) { // eslint-disable-line no-unused-vars
        // do nothing
      }
    };

    retFn(req, res, () => {
      expect(Object.keys(res.locals).length).to.equal(10);
      expect(res.locals.calcAssets.script.head).to.equal('mjs/script-head');
      expect(res.locals.calcAssets.script.body).to.equal('mjs/script-body');
      expect(res.locals.calcAssets.css.head).to.equal('css-head');
      expect(res.locals.calcAssets.css.body).to.equal('css-body');
    })
  });
});

// TODO: Add test that emulates the dispatch of the 'finish' event on `res`
// TODO: Add test to validate call of `initAppFn` with success
// TODO: Add test to validate call of `initAppFn` with failure
// TODO: Add test to validate call of `initReqFn` with success
// TODO: Add test to validate call of `initReqFn` with failure
