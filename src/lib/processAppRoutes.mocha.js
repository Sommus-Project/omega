/* eslint-env mocha */
const expect = require('chai').expect;
const proxyquire = require('proxyquire').noCallThru();
var modules = {};
var files;
const stubs = {
  '@sp/omega-lib': {
    getFileArrayFromGlob: (appPath, fileList) => files // eslint-disable-line no-unused-vars
  },
  '../../demo/one.js': app => {
    modules.one = Object.assign({}, app, {one:1});
  },
  '../../demo/two.js': app => {
    modules.two = Object.assign({}, app, {two:2});
  },
  '../../demo/three.js': app => {
    modules.three = Object.assign({}, app, {three:3});
  },
  '../../demo/four.js': {}
}

const processAppRoutes = proxyquire('./processAppRoutes', stubs);

describe('processAppRoutes tests', () => {
  beforeEach(() => {
    files = [
      'demo/one.js',
      'demo/two.js',
      'demo/three.js'
    ];
    modules = {};
  });

  it('should init', () => {
    expect(processAppRoutes).to.be.a('function');
  });

  it('should process proper files', () => {
    var app = {isApp:true};
    var appPath = process.cwd();
    var fileList = '**/*.js';

    processAppRoutes(app, appPath, {}, fileList);
    expect(modules.one).to.eql({isApp:true,one:1});
    expect(modules.two).to.eql({isApp:true,two:2});
    expect(modules.three).to.eql({isApp:true,three:3});
  });

  it('should handle bad require file', () => {
    var app = {isApp:true};
    var appPath = process.cwd();
    var fileList = '**/*.js';
    files = [
      'demo/four.js'
    ];

    function doIt() {
      processAppRoutes(app, appPath, fileList);
    }

    expect(doIt).to.throw(ReferenceError, `Unable to load the route module ../../${files[0]}. It does not export the route function.`)
  });
});
