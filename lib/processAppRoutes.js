const path = require('path');
const debug = require('debug')('Omega:processAppRoutes');
const {getFileArrayFromGlob} = require('@imat/omegalib');

function processAppRoutes(app, appPath, options, fileList) {
  debug('Initialize the app routes');

  getFileArrayFromGlob(appPath, fileList).forEach(
    item => {
      var relative = path.relative(__dirname, appPath).replace(/\\/g, '/');
      var modPath = `${relative}/${item}`;

      debug(`Processing route file: ${modPath}`);
      var loadedModule = require(modPath);
      if (typeof loadedModule !== 'function') {
        throw new ReferenceError (`Unable to load the route module ${modPath}. It does not export the route function.`);
      }
      loadedModule(app, options);
    }
  );
}

module.exports = processAppRoutes;
