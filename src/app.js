const omega = require('..');
const SqlUser = require('./lib/directoryService/SqlUser');
const SqlService = require('./lib/directoryService/SqlService');
const SQL_CONFIG = require('./lib/SQL_CONFIG');
const User = require('./lib/User');
const jwt = require('./lib/jwt');
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
  // BEGIN TODO: Move this block into regular Omega
  const { SESSION_COOKIE = 'session' } = req;
  res.locals.user = req.user = new User();
  const sessionToken = req.cookies[SESSION_COOKIE];
  if (sessionToken) {
    req.rest.onSend(sender => {
      // Set session id for all calls to `req.rest`
      sender.setCookie(SESSION_COOKIE, sessionToken, false);
    })

    try {
      const decoded = await jwt.verify(sessionToken);
      await req.user.init(req, decoded); // Initialize the user based on who is logged in.
    }

    catch (ex) {
      console.error(ex.stack);
    }
  }

  console.info(`User ${req.user.loggedIn ? 'is' : 'is not'} logged in.`);
  // END TODO
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
  domains: {
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
