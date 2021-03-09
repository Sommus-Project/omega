const omega = require('..');
const SqlUser = require('./lib/directoryService/SqlUser');
const SqlService = require('./lib/directoryService/SqlService');
const SQL_CONFIG = require('./lib/SQL_CONFIG');
const APP_TITLE = 'Sample Omega App';
console.info(`\x1B]0;${APP_TITLE}\x07\x1B[95m${APP_TITLE}\x1B[0m`);

async function initAppFn(app, options) { // eslint-disable-line no-unused-vars
  /*
  const versionInfo = omega.loadJsonFile('../data/appliance/version_info.json');
  if (versionInfo) {
    app.locals.appCopyright = versionInfo.copyright;
    app.locals.appVersion = `${versionInfo.major}.${versionInfo.minor}.${versionInfo.sp}`;
  }
  */
}

async function initReqFn(req, res, options) { // eslint-disable-line no-unused-vars
  // BEGIN OPTIONAL CODE
  // If we need to transfer the session cookie into ALL rest calls
  // The we need this code.
  const sessionId = req.cookies[req.SESSION_COOKIE];
  if (sessionId) {
    req.rest.onSend(sender => {
      // Set session id for all calls to `req.rest`
      sender.setCookie('SESSION_COOKIE', sessionId, false);
    });
  }
  // END OPTIONAL CODE
}

const config = {
  apiFolder: 'dist/api',
  appRoutes: 'dist/routes/!(*.mocha).js',
  db: {
    mysql: SQL_CONFIG
  },
  httpPort: process.env.PORT || 5000,
  httpsPort: process.env.PORTS || 5001,
  initAppFn,
  initReqFn,
  directoryService: {
    User: SqlUser,
    service: SqlService({db:SQL_CONFIG})
  },
  staticFolder: 'dist/static',
  viewFolder: 'dist/views'
};

async function runApp() {
  const app = omega(config);
  app.start();
  console.log("Omega started");
}

runApp();
