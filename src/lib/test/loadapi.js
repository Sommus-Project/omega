// This routine loads an API file for testing with mocha.
// In includes the ability to:
// 1) Instrument the code using NYC to provide coverage reporting, if NYC is available
// 2) Allow Mocking of files that the API may load via require
const path = require('path');
const apiLoader = require('../apiLoader');
const fixPath = src => src.replace(/\\|[A-Z]\:[\\\/]/g, '/');
const cwd = fixPath(process.cwd());
let instrumenter;
try {
  const NYC = require('nyc');
  const nyc = new NYC();
  instrumenter = nyc.instrumenter();
}

catch(_) {
  // DO NOTHING.
  // If NYC is not installed then we will not attempt to instrument the code
}

function loadapi(apiFolder, ___dirname) {
  const apiRoot = path.posix.join(cwd, apiFolder); // Root path of the API folder for testing.
  const testDir = path.posix.relative(apiRoot, fixPath(___dirname)); // Relative path of this testing folder.
  const apiquire = apiLoader(apiRoot, '/api'); // Create the API loader

  return (src, mockModules = {}) => {
    const fixedSrc = `./${path.posix.join(testDir, src)}`; // Fix the path to the API file we are lodaing.

    // If NYC loaded then we will attempt to use it for our API loaded files.
    if (instrumenter) {
      return apiquire(fixedSrc, mockModules, (srcCode, srcName) => {
        // Calculate the appropriate path name for NYC to use in the instrumenter
        const nycName = path.resolve(path.relative(cwd, srcName)).replace(/\//g, path.sep);
        // Return the instrumented code to be executed
        return instrumenter.instrumentSync(srcCode, nycName)
      });
    }

    // If we don't use NYC then just load the API.
    return apiquire(fixedSrc, mockModules);
  }
}

module.exports = loadapi;
