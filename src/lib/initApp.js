const calcAssets = require('./calcAssets');
const debug = require('debug')('Omega:initApp');
const path = require('path').posix;
const processAssets = require('./processAssets');
const Rest = require('./Rest');
const {readDeepDirs, dbFactory} = require('@sp/omega-lib');

// initApp - Initialize the Express app object
function initApp(app, staticPaths, options) {
  const packagePath = path.join(process.cwd(), 'package.json');
  let pkg = require(packagePath);
  // Get the list of assets in the static folder.
  // This list is used for glob entries in the EJS files.
  const listOfAssets = staticPaths.reduce((acc, staticPath) => ([...acc, ...readDeepDirs(staticPath)]), []).sort();

  debug('Set up app.locals.');
  app.set('appName', pkg.name);
  app.locals.appName = pkg.name;
  app.locals.defaultFavicon = options.favicon || '/brand/img/favicon.ico';
  app.locals.uiVersion = pkg.version;
  /* istanbul ignore if */
  if (options.devmode) {
    app.locals.uiVersion += ' - Development';
  }

  // Begin: Temporary hack for backwards compatability
  app.locals.appVersion = app.locals.uiVersion;
  // End: Temporary hack for backwards compatability

  callInitAppFn(app, options);

  return (req, res, next) => { // eslint-disable-line complexity
    debug('Set up res.locals for EJS pages.');
    const {processScripts, processStyles, processMeta} = processAssets(options.cacheBuster);
    const browserNeeds = res.locals.browserNeeds || {};
    const accepts = req.accepts('json', 'html', 'xml', '*/*');
    debug(req.method, req.originalUrl, req.headers.accept, `[${accepts}]`);

    if (options.db) {
      req.db = Object.entries(options.db).reduce(
        (obj, [key, dbOptions]) => {
          debug(`Set up req.db[${key}] for EJS pages and API calls.`);
          obj[key] = dbFactory(key, dbOptions);
          return obj;
        }, {}
      );
    }

    debug('Set up req.rest for EJS pages and API calls.');
    req.rest = new Rest(req.requestId);
    res.on('finish', () => {
      // Allow the application to do some cleanup after the response is sent.
      if (typeof options.reqFinishedFn === 'function') {
        options.reqFinishedFn(req, res, options);
      }

      debug('Cleaning up req.rest and closing req.db');
      req.rest.destroy(); // Clean up the Rest object that is no longer needed.
      delete req.rest;

      if (req.db) {
        Object.entries(req.db).forEach(
          ([key, obj]) => {
            if (obj.close) {
              obj.close(); // Close the active DB session.
            }

            delete req.db[key];
          }
        );

        delete req.db;
      }
    });

    res.locals.url = `${req.protocol}://${req.hostname}${req.path}`;
    res.locals.assets = {
      head: {
        css: [],
        js: []
      },
      css: [],
      js: []
    }; // The `assets` object for the EJS files
    res.locals.calcAssets = calcAssets(browserNeeds.module || 'mjs', listOfAssets);
    res.locals.locale = 'en-US'; // TODO: Set this to the correct locale
    res.locals.page = {}; // The `page` object for the EJS files
    res.locals.debugMode = typeof req.query.debug === 'string';
    res.locals.debugKeys = (req.query.debug||'').split(',').map(k=>k.trim().toLowerCase());
    res.locals.devMode = options.devmode || (req.query.debug === 'dev');
    res.locals.process = {
      meta: processMeta,
      scripts: processScripts(res),
      styles: processStyles(res)
    };

    res.locals._layoutFile = true;
    if (typeof options.initReqFn === 'function') {
      // Call the init code. Always use a promise
      var promise = Promise.resolve(options.initReqFn(req, res, options));

      promise.then(() => {
        next();
      }).catch(ex => {
        debug(`Your \`options.initReqFn\` function failed\n${ex.stack}`);
        let err = Error('Your `options.initReqFn` function failed.');
        err.originalError = ex;
        throw err;
      });
    }
    else {
      next();
    }
  }
}

function callInitAppFn(app, options) {
  if (typeof options.initAppFn === 'function') {
    try {
      // Allow an app to configure thing before setting up routes
      debug('calling initAppFn');
      options.initAppFn(app, options);
    }

    catch(ex) {
      console.error(ex.stack);
      let err = Error('Your `options.initAppFn` function failed\n');
      err.originalError = ex;
      throw err;
    }
  }
}

module.exports = initApp
