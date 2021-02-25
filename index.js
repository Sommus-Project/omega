(() => {
  const [major, minor] = process.versions.node.split('.').map(num => Number(num));
  if (major < 14 || major === 14 && minor < 10) {
    console.error('\n\nOmega apps require node version 14.10.0 or newer.\n\n');
    process.exit(1);
  }
})();

console.time('Total startup time');
const APP_PATH = process.cwd().replace(/(?:^[a-zA-Z]:)?\\/g, '/');
const fs = require('fs');
const path = require('path').posix;
// Load env vars if there is a file called '_env.js'
// in the root folder of the applicaiton
const envFilePath = path.join(APP_PATH, '_env.js');
if (fs.existsSync(envFilePath)) {
  const env = require(envFilePath);
  Object.entries(env).forEach(([key, value]) => {
    process.env[key] = value;
  });
}
const apiSystem = require('./dist/lib/apiSystem');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const debug = require('debug')('Omega');
const directoryService = require('./dist/lib/directoryService/directoryService');
const DSUser = require('./dist/lib/directoryService/DSUser');
const SESSION_COOKIE = require('./dist/lib/SESSION_COOKIE');
const SessionManager = require('./dist/lib/SessionManager/SessionManager');
const systemPages = require('./dist/lib/systemPages');
const ejsMate = require('ejs-mate');
const error404Handler = require('./dist/lib/error404Handler');
const errorHandler = require('./dist/lib/errorHandler');
const express = require('express');
const forceSecure = require('./dist/lib/forceSecure');
const getBrowserNeeds = require('./dist/lib/getBrowserNeeds');
const getServerInfo = require('./dist/lib/getServerInfo');
const initApp = require('./dist/lib/initApp');
const isRegExp = require('./dist/lib/isRegExp');
const isString = require('./dist/lib/isString');
const logNameGenerator = require('./dist/lib/logNameGenerator');
const morgan = require('morgan'); // Request logging
const omegalib = require('@sp/omega-lib');
const {isFalse, isTrue, makePathIfNeeded} = omegalib;
const processAppRoutes = require('./dist/lib/processAppRoutes');
const proxy = require('./dist/lib/black-list-proxy');
const startup = require('./dist/lib/startup');
const rfs = require('rotating-file-stream');
const statusMonitor = require('express-status-monitor')({path: '/system/some_status_page_that_is_hard_to_find.blah'});
const {nanoid} = require('nanoid');
const __folder = __dirname.replace(/(?:^[a-zA-Z]:)?\\/g, '/');
const { version: omegaVersion } = require('./package.json');
const OMEGA_API_PATH = path.join(__folder, 'dist/api');
console.log(`OMEGA_API_PATH:[${OMEGA_API_PATH}]`);

// Do not skip any request to the API path. Skip logging on all other calls if it is not an error response.
const logSkipFn = (req, res) => (req.originalUrl.startsWith('/api')) ? false : res.statusCode < 400;
//const mwDebug = (info) => (req, res, next) => {debug(req.originalUrl+' - '+info); next();};

const MINUTE = 60000;
const HOUR = 60*MINUTE;
const DAY = 24*HOUR;
const MAXAGE = 30*DAY;
const DEFAULT_OPTIONS = {
  apiFolders: {
    '/api': ['dist/api', OMEGA_API_PATH]
  },
  appHeaders: [],
  appPath: APP_PATH,
  appRoutes: 'dist/routes/!(*.mocha).js',
  brandFolder: 'brand',
  cacheBuster: 0,
  certPath: path.join(__folder, 'defaultCerts/cert.pem'),
  db: {},
  disableLogging: false,
  excludeSystemFiles: false,
  fileLimit: '1mb',
  httpPort: 3000,
  httpsPort: 3001,
  keyPath: path.join(__folder, 'defaultCerts/key.pem'),
  logFileName: false,
  logFormat: 'omega',
  logPath: '../logs/node',
  logSkipFn: false,
  maxLogFileSize: '500M',
  providers: {},
  proxyHost: '',
  proxyPort: 443,
  proxyTimeout: 30000,
  redirectFn: null,
  serverName: `Omega/${omegaVersion}`,
  sessionManager: { memory: 20 },
  showApiDocs: true,
  staticFolder: 'dist/static',
  token: '',
  username: '',
  useProxy: false,
  viewFolder: 'dist/views'
};
const STATIC_FOLDER_HIT_RE = /^\/([mc]?js|css|brand|img|fonts)\/.*$/;

morgan.format('omega', `:remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" ":req[x-forwarded-for]" ":requestId" ":sessionId" ":response-time ms"`);
morgan.token('requestId', req => `${req.requestId}-${process.pid}-${req.remoteAddr}-${req.requestSize}`);
morgan.token('sessionId', req => req.sessionId);

function serverRedir(serverList) {
  return (req, res, next) => {
    const serverRedirs = Object.keys(serverList);
    if (serverRedirs.includes(req.hostname)) {
      const url = `https://${serverList[req.hostname]}${req.originalUrl}`
      res.redirect(301, url);
    }
    else {
      next();
    }
  }
}

function initOmega(config = {}) { //eslint-disable-line complexity
  console.time('Initialization time');
  if (typeof config !== 'object') {
    throw new TypeError('`config` must be an object or null.');
  }

  debug('Omega app initialization started.');

  const options = Object.assign({}, DEFAULT_OPTIONS, config);
  options.appPath = options.appPath.replace(/(?:^[a-zA-Z]:)?\\/g, '/');
  console.log(`options.appPath:[${options.appPath}]`)

  const appPath = options.appPath; // Root Path of the app using this code
  const brandStatic = path.join(appPath, options.brandFolder); // 3rd Party brand folder.
  const appStatic = path.join(appPath, options.staticFolder); // Application's `static` folder.
  const appViews = path.join(appPath, options.viewFolder); // Application's `views` folder.
  const omegaStatic = path.join(__folder, 'dist/static'); // Omega's `static`folder.
  const sharedViews = path.join(__folder, 'dist/sharedViews'); // Omega's `views` folder.
  const appRoutes = options.appRoutes; // Application's `routes` files (globby).
  const views = [appViews];
  if(appViews !== sharedViews) {
    views.push(sharedViews);
  }

  //********************************************************************************
  // Setup Session Management
  const sessionManager = new SessionManager(options.sessionManager);
  DSUser.purgeSession = sessionManager.invalidateUser.bind(sessionManager);
  const dirService = directoryService(options.domains);

  //********************************************************************************
  // Setup Express Application
  const app = express();
  app.use(statusMonitor); // "statusMonitor" Must be first middleware
  app.set('x-powered-by', false); // Disable the `x-powered-by: Express` header
  app.set('trust proxy', 'loopback');// Enable X-Forwarded-For headers from 127.0.0.1 to be used for the originating IP 

  //********************************************************************************
  // Initialize variables for each request
  app.use((req, res, next) => {
    req.dirService = dirService;
    req.sessionManager = sessionManager;
    req.requestId = nanoid(); // Generate a new Request ID for each request

    if (options.serverName) {
      // Set the server name
      res.setHeader('Server', options.serverName);
    }
    if (options.appHeaders) {
      Object.entries(options.appHeaders).forEach(
        ([header, value]) => {
          res.setHeader(header, value);
        }
      );
    }

    // Set variables for getting server info based on current proxy values.
    const temp = getServerInfo(options.serverLookup);
    req.getServerInfo = temp.getServerInfo;
    req.getServerStr = temp.getServerStr;
    req.requestSize = req.socket.bytesRead;

    // TODO: This may need to change to utilize the X-Real-IP header if set.
    req.remoteAddr = req.ip || req._remoteAddress || (req.connection && req.connection.remoteAddress) || undefined;
    next();
  });

  //********************************************************************************
  // Process cookies
  app.use(cookieParser(), (req, res, next) => { //eslint-disable-line no-unused-vars
    req.sessionId = req.cookies[SESSION_COOKIE]; // Save the sessionId in the request
    next();
  });

  //********************************************************************************
  // Check to see if the user has set or cleared the
  // `trackProxy` cookie or Query param
  app.use((req, res, next) => {
    const trackProxyQ = req.query.trackProxy;
    const trackProxyC = isTrue(req.cookies.trackProxy);
    req.trackProxy = false;
    if (trackProxyC) {
      if (!isFalse(trackProxyQ)) {
        req.trackProxy = true;
      }
    }
    else {
      if (isTrue(trackProxyQ)) {
        req.trackProxy = true;
      }
    }

    if (trackProxyC !== req.trackProxy) {
      res.cookie('trackProxy', req.trackProxy, { httponly:true });
    }

    next();
  });

  //********************************************************************************
  // Set up access logging
  if (!options.disableLogging) {
    const logOptions = {};
    if (options.logFileName) {
      debug('Creating log files in', options.logPath);
      makePathIfNeeded(options.logPath);

      logOptions.stream = rfs(logNameGenerator(options.logFileName), {
        compress: 'gzip', // Compress older files
        interval: '1d', // rotate daily
        path: options.logPath,
        size: options.maxLogFileSize
      });
    }

    if (typeof options.logSkipFn === 'function') {
      logOptions.skip = options.logSkipFn;
    }
    else if (options.logSkipFn === true) {
      logOptions.skip = logSkipFn;
    }

    app.use(morgan(options.logFormat, logOptions));
  }

  //********************************************************************************
  // Redirect old paths to new paths
  if (options.redirectFn) {
    options.redirectFn(app);
  }

  //********************************************************************************
  // Set up for Proxy calls
  if (options.useProxy) {
    const proxyOptions = {
      hostname: options.proxyHost,
      port: options.proxyPort,
      preCallback: options.proxyPreCallback,
      postCallback: options.proxyPostCallback,
      proxyLookup: options.proxyLookup,
      timeout: options.proxyTimeout,
      token: options.token,
      username: options.username
    };
    const proxyMW = proxy(proxyOptions);
    app.set('proxyMW', proxyMW);
    app.use(proxyMW);
  }

  //********************************************************************************
  // Get the browser needs for modules and polyfills.
  app.get('*', getBrowserNeeds);

  //********************************************************************************
  // Do any required server redirects
  if (options.redirect && options.redirect.server) {
    app.use(serverRedir(options.redirect.server));
  }

  //********************************************************************************
  // Make sure we are hitting HTTPS and not HTTP
  if (options.httpsPort !== false) {
    app.use(forceSecure(options.httpsPort));
  }

  //********************************************************************************
  // Set up the static folders
  // First is for branding overrides "/brand/*"
  // Second is the application static folder "/*" (Currently limited to "/src/*", "/img/*", "/brand/*" and "/js/*")
  // Third is the omega static folders "/*" (Currently limited to "/src/*", "/img/*", "/brand/*" and "/js/*")
  const staticOptions = {maxAge: MAXAGE};
  if (brandStatic && brandStatic !== appStatic && fs.existsSync(brandStatic)) {
    debug(`Attaching branding static folder: ${brandStatic}`);
    app.use('/brand', express.static(brandStatic, staticOptions)); // serve static assets from brand `static` folder
  }

  const staticPaths = [appStatic];
  debug(`Attaching app static folder: ${appStatic}`);
  app.use(express.static(appStatic, staticOptions)); // serve static assets from applications `static` folder
  if (appStatic !== omegaStatic) {
    staticPaths.push(omegaStatic);
    debug(`Attaching omega static folder: ${omegaStatic}`);
    app.use(express.static(omegaStatic, staticOptions)); // serve static assets from Omega's `static` folder
  }

  //********************************************************************************
  // If the file SHOULD have been handled by `express.static` and was not
  // then fail with 404 immediatly.
  app.use((req, res, next) => {
    if (req.method === "GET" && STATIC_FOLDER_HIT_RE.test(req.originalUrl)) {
      debug('Static file 404');
      return error404Handler(req, res, next);
    }

    next();
  });

  //********************************************************************************
  // Set up EJS
  app.engine('ejs', ejsMate);
  app.set('views', views);
  app.set('view engine', 'ejs');

  //********************************************************************************
  // Initialize the rest of the app
  app.use(bodyParser.json({limit: options.fileLimit,strict:false}));
  app.use(bodyParser.urlencoded({extended: true, limit: options.fileLimit}));
  app.use(initApp(app, staticPaths, options));

  //********************************************************************************
   // Include any routes from app
  processAppRoutes(app, appPath, options, appRoutes);

  //********************************************************************************
  // Include any API files from the app
  if (options.apiFolders) {
    const apiOptions = {
      appPath,
      apiFolders: options.apiFolders,
      showApiDocs: options.showApiDocs
    };

    apiSystem(app, apiOptions);
  }

  //********************************************************************************
  // Provide system pages
  if (!options.excludeSystemFiles) {
    app.get('/system', systemPages.home);
    app.get('/system/node/npm', systemPages.npm);
    app.get('/system/node/status', systemPages.status);
  }

  //********************************************************************************
  // Error Handling
  app.use(error404Handler);
  app.use(errorHandler);

  //********************************************************************************
  // Provide the start function
  app.start = () => {
    debug('Starting Omega app.');
    startup(app, omegaStatic, options).then(() => console.timeEnd('Total startup time'));
  }
  console.timeEnd('Initialization time');
  return app;
}

module.exports = initOmega;
module.exports.apiIdToInt = require('./dist/lib/apiIdToInt');
module.exports.attrEsc = require('./dist/lib/attrEsc');
module.exports.asyncForEach = require('./dist/lib/asyncForEach'); // Combine this and asyncSome into asyncArray
module.exports.asyncSome = require('./dist/lib/asyncSome'); // Combine this and asyncForEach into asyncArray
module.exports.copyFiles = omegalib.copyFiles;
module.exports.dbFactory = omegalib.dbFactory;
module.exports.deleteFolderRecursive = omegalib.deleteFolderRecursive;
module.exports.DSUser = DSUser;
module.exports.endsInSlash = omegalib.endsInSlash;
module.exports.errors = {
  AttributeError: require('./dist/lib/directoryService/errors/AttributeError'),
  AuthenticationError: require('./dist/lib/directoryService/errors/AuthenticationError'),
  InvalidActionError: require('./dist/lib/directoryService/errors/InvalidActionError'),
  InvalidGroupError: require('./dist/lib/directoryService/errors/InvalidGroupError'),
  NoEntityError: require('./dist/lib/directoryService/errors/NoEntityError')
};
module.exports.getFileArrayFromGlob = omegalib.getFileArrayFromGlob;
module.exports.getHeader = require('./dist/lib/getHeader');
module.exports.getXForwardedForHeader = require('./dist/lib/getXForwardedForHeader');
module.exports.HttpError = require('./dist/lib/HttpError');
module.exports.HttpResponse = require('./dist/lib/HttpResponse');
module.exports.HTTPS_STATUS = require('./dist/lib/HTTPS_STATUS');
module.exports.isFalse = isFalse;
module.exports.isRegExp = isRegExp;
module.exports.isString = isString;
module.exports.isTrue = isTrue;
module.exports.loadJsonFile = omegalib.loadJsonFile;
module.exports.makePathIfNeeded = omegalib.makePathIfNeeded;
module.exports.mergeData = require('./dist/lib/mergePatch').mergeData;
module.exports.mergeConfigFile = require('./dist/lib/mergeConfigFile');
module.exports.mergePatch = require('./dist/lib/mergePatch').mergePatch;
module.exports.OMEGA_API_PATH = OMEGA_API_PATH;
module.exports.removeFiles = omegalib.removeFiles;
module.exports.Rest = require('./dist/lib/Rest');
module.exports.SEVERITY_LEVEL = require('./dist/lib/SEVERITY_LEVEL');
module.exports.sortWithoutCase = require('./dist/lib/sortWithoutCase');
module.exports.test = {
  loadapi: require('./dist/lib/test/loadapi'),
  UsageLog: require('./dist/lib/test/MockUsageLog')
};
module.exports.throw404 = require('./dist/lib/throw404');
module.exports.twodigits = require('./dist/lib/twodigits');
module.exports.types = require('./dist/lib/types');
module.exports.UsageLog = require('./dist/lib/UsageLog');
module.exports.validateApiFiles = omegalib.validateApiFiles;
