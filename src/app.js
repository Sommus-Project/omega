const omega = require('..');
const SqlUser = require('./lib/directoryService/SqlUser');
const SqlService = require('./lib/directoryService/SqlService');
const SQL_CONFIG = require('./lib/SQL_CONFIG');
//const User = require('./lib/User');
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
  req.user = { provider: 'default', id: 1 };
  /*
  const sid = req.cookies[SESSION_COOKIE] || 1;
  if (sid) {
    req.rest.onSend(sender => {
      // Set session id for all calls to `req.rest`
      sender.setCookie(SESSION_COOKIE, `"${sid}"`, false);
    })
  }

  try {
    // Create a new User object
    var user = new User();
    await user.init(req, sid)

    // Save the user object for use by the rest of the app.
    req.user = user;
    res.locals.user = user;
  }

  catch (ex) {
    console.error(ex.stack);
  }
  */
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
  providers: {
    default: {
      User: SqlUser,
      service: SqlService(({db:SQL_CONFIG}))
    }
  },
  staticFolder: 'dist/static',
  viewFolder: 'dist/views'
};

async function runApp() {
  console.log("app: init omega");
  const app = omega(config);
  console.log("app: start omega");
  app.start();
  console.log("app: Finished");
}

runApp();
