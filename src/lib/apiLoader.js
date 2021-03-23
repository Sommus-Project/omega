const debug = require('debug')('Omega:apiLoader');
const fs = require('fs');
const path = require('path').posix;
const Module = require('module');
const {isFalse, isTrue} = require('@sp/omega-lib');
const HttpError = require('./HttpError.js');
const HttpResponse = require('./HttpResponse.js');
const {mergePatch, mergeData} = require('./mergePatch.js');
const throw404 = require('./throw404.js');
const args = 'apimodule, require, __dirname, __filename, throw404, HttpError, HttpResponse, isFalse, isTrue, mergeData, mergePatch';
const mainPaths = require.main.paths;
const fixPath = srcPath => srcPath.replace(/\\|[A-Z]\:[\/\\]/g, '/');
module.paths = mainPaths;


class MyModule extends Module {
  constructor(parent, apiFolder, apiRoot) {
    const id = path.join(apiFolder, 'fakeModule.js');
    super(id, parent);
    this.filename = id;
    this.apiPath = apiFolder;
    this.libPath = path.join(path.dirname(this.apiPath), 'lib');
    debug(`Loading the API module: ${apiFolder} - ${id} - ${parent.id}`);
    this.paths = [...parent.paths];
    this.exports = {};
    this.apiRoot = apiRoot;
  }

  require(fname, mockModules = {}, instrumenter = null) {
    if (!'./\\'.includes(fname[0])) {
      // If this is an external repo module then use the existing require.
      return super.require(fname);
    }

    // Force the require() statements used in API files to be relative to the './lib' folder
    const moduleRequire = libPath => (modname) => {
      debug(`API module: [${this.id}] is requiring ${modname}`);
      // Support the ability to return mocks of modules
      return mockModules[modname] || ('./\\'.includes(modname[0]) ? require.main.require(path.join(libPath, modname)) : require(modname));
    }

    const fPath = path.join(this.apiPath, fname+'.js');
    const modFilename = fixPath(path.resolve(fPath));
    const modDirname = path.dirname(modFilename);
    let src = fs.readFileSync(fPath, 'utf8');
    const fnSrc = instrumenter ? instrumenter(src, fPath) : src;

    // We create a new Function to protect against variable leakage, in or out.
    // JavaScript creates the new function from a clean scope meaning that no closure variables
    // from outside the function are available inside the funciton. The API code only has access
    // to `global` and the variables we pass in. It also prevents any naming collisions of
    // variables defined in the API code.
    try {
      let fn = new Function(args, fnSrc); // eslint-disable-line no-new-func
      fn(this, moduleRequire(this.libPath), modDirname, modFilename, throw404, HttpError, HttpResponse, isFalse, isTrue, mergeData, mergePatch);
    }

    catch(ex) {
      // If there was a problem loading the new file then show the error
      // DO NOT pass the exception along
      console.error(`\nFailed to load file '${fPath}'`);
      console.error(ex.message+'\n');
    }

    return this.exports;
  }
}

function init(apiFolder, apiRootUrl) {
  const myMod = new MyModule(module, fixPath(apiFolder), apiRootUrl);
  return (src, mockModules, instrumenter) => myMod.require(src, mockModules, instrumenter);
}

module.exports = init;
