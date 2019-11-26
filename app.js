(() => {
  const [major, minor] = process.versions.node.split('.').map(num => Number(num));
  if (major < 10 || major === 10 && minor < 10) {
    console.error('\n\nOmega apps require node version 10.10.0 or newer.\n\n');
    process.exit(1);
  }
})();

console.time('Total startup time');
const apiSystem = require('./lib/apiSystem');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const debug = require('debug')('Omega');
const systemPages = require('./lib/systemPages');
const ejsMate = require('ejs-mate');
const error404Handler = require('./lib/error404Handler');
const errorHandler = require('./lib/errorHandler');
const express = require('express');
const forceSecure = require('./lib/forceSecure');
const fs = require('fs');
const getBrowserNeeds = require('./lib/getBrowserNeeds');
const getServerInfo = require('./lib/getServerInfo');
const initApp = require('./lib/initApp');
const isRegExp = require('./lib/isRegExp');
const isString = require('./lib/isString');
const logNameGenerator = require('./lib/logNameGenerator');
const morgan = require('morgan'); // Request logging
const omegalib = require('@imat/omegalib');
const {isFalse, isTrue, makePathIfNeeded} = omegalib;
const path = require('path').posix;
const processAppRoutes = require('./lib/processAppRoutes');
const proxy = require('./lib/black-list-proxy');
const startup = require('./lib/startup');
const rfs = require('rotating-file-stream');
const statusMonitor = require('express-status-monitor')({path: '/system/some_status_page_that_is_hard_to_find.blah'});
const nanoidGenerate = require('nanoid/generate');
const NANO_KEY = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const __folder = __dirname.replace(/\\|[A-Z]\:[\\\/]/gi, '/');
const { version: omegaVersion } = require('./package.json');

// Do not skip any request to the API path. Skip logging on all other calls if it is not an error response.
const logSkipFn = (req, res) => (req.originalUrl.startsWith('/api')) ? false : res.statusCode < 400;
//const mwDebug = (info) => (req, res, next) => {debug(req.originalUrl+' - '+info); next();};

const MINUTE = 60000;
const HOUR = 60*MINUTE;
const DAY = 24*HOUR;
const MAXAGE = 30*DAY;
const DEFAULT_OPTIONS = {
  apiDocs: true,
  apiFolder: 'api',
  apiUri: '/api',
  appHeaders: [],
  appPath: process.cwd().replace(/\\/g, '/'),
  appRoutes: 'routes/!(*.mocha).js',
  brandFolder: 'brand',
  cacheBuster: 0,
  certPath: path.join(__folder, 'defaultCerts/cert.pem'),
  db: {},
  disableLogging: false,
  fileLimit: '1mb',
  httpPort: 3000,
  httpsPort: 3001,
  keyPath: path.join(__folder, 'defaultCerts/key.pem'),
  logFileName: false,
  logFormat: 'imat', // IMAT extended Apache style HTTP Request logging
  logPath: '../logs/node',
  logSkipFn: false,
  maxLogFileSize: '500M',
  proxyHost: '10.10.9.238',
  proxyPort: 443,
  proxyTimeout: 30000,
  redirectFn: null,
  serverName: `Omega/${omegaVersion}`,
  staticFolder: 'static',
  token: '',
  username: '',
  useProxy: false,
  viewFolder: 'views'
};
const STATIC_FOLDER_HIT_RE = /^\/([mc]?js|css|brand|img|fonts)\/.*$/;

morgan.format('imat', `:remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" ":req[x-forwarded-for]" ":requestId" ":sessionId" ":response-time ms"`);
morgan.token('requestId', req => `${req.requestId}-${process.pid}-${req.remoteAddr}-${req.requestSize}`);
morgan.token('sessionId', req => req.cookies.auth_tkt);

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
  options.appPath = options.appPath.replace(/\\/g, '/');

  const appPath = options.appPath; // Root Path of the app using this code
  const brandStatic = path.join(appPath, options.brandFolder); // 3rd Party brand folder.
  const appStatic = path.join(appPath, options.staticFolder); // Application's `static` folder.
  const appViews = path.join(appPath, options.viewFolder); // Application's `views` folder.
  const omegaStatic = path.join(__folder, 'static'); // Omega's `static`folder.
  const sharedViews = path.join(__folder, 'sharedViews'); // Omega's `views` folder.
  const appRoutes = options.appRoutes; // Application's `routes` files (globby).
  const views = [appViews];
  if(appViews !== sharedViews) {
    views.push(sharedViews);
  }

  //********************************************************************************
  // Setup Express Application
  const app = express();
  // "statusMonitor" Must be first middleware
  app.use(statusMonitor);
  // Disable the `x-powered-by: Express` header
  app.set('x-powered-by', false);
  // Enable X-Forwarded-For headers from 127.0.0.1 to be used for the originating IP 
  app.set('trust proxy', 'loopback');

  // 2019/09/06 - The next two lines are deprecated and need to be removed soon
  app.locals.proxyHost = options.proxyHost;
  app.locals.proxyPort = options.proxyPort;

  //********************************************************************************
  // Initialize variables for each request
  app.use((req, res, next) => {
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

    // Generate a new Request ID for each request
    req.requestId = nanoidGenerate(NANO_KEY, 20);

    req.requestSize = req.socket.bytesRead;
    // TODO: This may need to change to utilize the X-Real-IP header if set.
    req.remoteAddr = req.ip || req._remoteAddress || (req.connection && req.connection.remoteAddress) || undefined;
    next();
  });

  //********************************************************************************
  // Process cookies
  app.use(cookieParser());

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
  apiSystem(app, appPath, options);

  //********************************************************************************
  // Provide system pages
  app.get('/system', systemPages.home);
  app.get('/system/node/npm', systemPages.npm);
  app.get('/system/node/status', systemPages.status);

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
module.exports.apiIdToInt = require('./lib/apiIdToInt');
module.exports.attrEsc = require('./lib/attrEsc');
module.exports.copyFiles = omegalib.copyFiles;
module.exports.dbFactory = omegalib.dbFactory;
module.exports.deleteFolderRecursive = omegalib.deleteFolderRecursive;
module.exports.endsInSlash = omegalib.endsInSlash;
module.exports.getFileArrayFromGlob = omegalib.getFileArrayFromGlob;
module.exports.getHeader = require('./lib/getHeader');
module.exports.getXForwardedForHeader = require('./lib/getXForwardedForHeader');
module.exports.HttpError = require('./lib/HttpError');
module.exports.HttpResponse = require('./lib/HttpResponse');
module.exports.HTTPS_STATUS = require('./lib/HTTPS_STATUS');
module.exports.isFalse = isFalse;
module.exports.isRegExp = isRegExp;
module.exports.isString = isString;
module.exports.isTrue = isTrue;
module.exports.loadJsonFile = omegalib.loadJsonFile;
module.exports.makePathIfNeeded = omegalib.makePathIfNeeded;
module.exports.mergeData = require('./lib/mergePatch').mergeData;
module.exports.mergeConfigFile = require('./lib/mergeConfigFile');
module.exports.mergePatch = require('./lib/mergePatch').mergePatch;
module.exports.removeFiles = omegalib.removeFiles;
module.exports.Rest = require('./lib/Rest');
module.exports.SEVERITY_LEVEL = require('./lib/SEVERITY_LEVEL');
module.exports.test = {
  loadapi: require('./lib/test/loadapi'),
  UsageLog: require('./lib/test/MockUsageLog')
};
module.exports.throw404 = require('./lib/throw404');
module.exports.UsageLog = require('./lib/UsageLog');
module.exports.validateApiFiles = omegalib.validateApiFiles;
