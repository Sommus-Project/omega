const API_FILES = '**/!(*.mocha).js';
const HTTP_STATUS_NO_CONTENT = 204;
const HTTP_STATUS_UNAUTHORIZED = 401; // Must include WWW-Authenticate header
const HTTP_STATUS_FORBIDDEN = 403;
const HTTP_STATUS_METHOD_NOT_ALLOWED = 405;
const HTTP_STATUS_SERVER_ERROR = 500;
const MESSAGE_SERVER_ERROR = 'An unknown server error has occured';
const OPTIONS = 'OPTIONS';
const TITLE_SERVER_ERROR = 'Server Error';
const VERB_LOOKUP = {
  doGet: 'GET',
  doPut: 'PUT',
  doPost: 'POST',
  doDelete: 'DELETE',
  doPatch: 'PATCH'
}
const debug = require('debug')('Omega:apiSystem');
const path = require('path').posix;
const apiDocs = require('./apiDocs.js');
const apiFixStack = require('./apiFixStack');
const apiLoader = require('./apiLoader.js');
const HttpError = require('./HttpError.js');
const HttpResponse = require('./HttpResponse.js');
const UsageLog = require('./UsageLog');
const {getFileArrayFromGlob} = require('@sp/omega-lib');
const getVerbList = verbs => Object.keys(verbs).sort().join(', ');

// Make sure that the API files are loaded in an order that will allow them to get called
// especially when they are a child path.
// For example:
// `/api/dogs/bark.js` must load before `/api/dogs/(id).js` so that the
// endpoint `/api/dogs/bark[doGet]` can be called as well as `/api/dogs/:id[doGet]`
function sortApis(a, b) {
  const aPath = path.dirname(a);
  const bPath = path.dirname(b);
  const aStd = a.replace(/\./g, '/');
  const bStd = b.replace(/\./g, '/');

  if (aPath !== bPath) {
    if (bPath+'.js' === a) {
      return 1;
    }

    if (aPath+'.js' === b) {
      return -1
    }
  }

  if (aStd < bStd) {
    return 1;
  }
  if (aStd > bStd) {
    return -1;
  }

  return 0;
}

function normalizeApiFolders(apiFolders, appPath) {
  return Object.entries(apiFolders).map(
    ([uri, folders]) => {
      if (!Array.isArray(folders)) {
        folders = [folders]; // eslint-disable-line no-param-reassign
      }

      uri = uri.slice(-1) === '/' ? uri : `${uri}/` // eslint-disable-line no-param-reassign

      const f = folders.reduce((acc, folder) => {
        const temp = path.isAbsolute(folder) ? folder : path.join(appPath, folder);
        if (!acc.includes(temp)) {
          acc.push(temp);
        }

        return acc;
      }, []);

      return { uri, folders: f };
    }
  );
}

function initApiSystem(app, { appPath, showApiDocs = true, apiFolders } = {}) {
  if (typeof appPath != 'string') {
    throw new TypeError(`apiSystem: Missing or invalid 'appPath' value.`);
  }
  if (typeof apiFolders != 'object' || Object.keys(apiFolders).length < 1) {
    throw new TypeError(`apiSystem: Missing or invalid 'apiFolders' value.`);
  }

  const apiEntries = normalizeApiFolders(apiFolders, appPath);

  apiEntries.forEach(
    ({uri: apiUri, folders}) => {
      /* istanbul ignore else */
      if (showApiDocs) {
        app.get(apiUri, apiDocs({ folders }));
      }

      folders.forEach(apiFolder => {
        const requireApi = apiLoader(apiFolder);
        debug(`Initialize: uri(${apiUri}) - folder(${apiFolder})`);

        const apiFiles = getFileArrayFromGlob(apiFolder, API_FILES).sort(sortApis);
        apiFiles.forEach(item => {
          // Set up endpoint routes in the express system for each endpoint file found.
          const debugFilePath = path.join(apiFolder, item);
          const modPath = item.replace('.js', '');
          const uri = apiUri + modPath.replace(/\(([^\)]+)\)/g, (key, val) => `:${val}`);
          const apiFilePath = `./${modPath}`;
          const apiComponent = requireApi(apiFilePath);
          if (typeof apiComponent !== 'object') {
            debug(`endpoint file failed to export valid object: ${apiFilePath}`);
            throw new Error('Your endpoint file must export an object.')
          }
          const keys = Object.keys(apiComponent);

          debug(`Url: ${uri} - [${keys.join(', ')}]`);
          app.options(uri, apiCaller(OPTIONS, `(OPTIONS) ${uri}`, keys, debugFilePath));
          app.get(uri, apiCaller(apiComponent.doGet, `(GET) ${uri}`, keys, debugFilePath));
          app.put(uri, apiCaller(apiComponent.doPut, `(PUT) ${uri}`, keys, debugFilePath));
          app.post(uri, apiCaller(apiComponent.doPost, `(POST) ${uri}`, keys, debugFilePath));
          app.delete(uri, apiCaller(apiComponent.doDelete, `(DELETE) ${uri}`, keys, debugFilePath));
          app.patch(uri, apiCaller(apiComponent.doPatch, `(PATCH) ${uri}`, keys, debugFilePath));
        });
      });
    }
  )
}

function sendError(req, res, ex) {
  var title = ex.title || TITLE_SERVER_ERROR;
  var status = ex.status || HTTP_STATUS_SERVER_ERROR;
  var message = ex.message || MESSAGE_SERVER_ERROR;
  var url = req.originalUrl;
  var data = ex.data;
  var stack = ex.stack;

  debug(`Endpoint ${req.originalUrl} responding with error: ${JSON.stringify({status,title,message,data})}`);

  if (typeof ex.headers === 'object') {
    res.set(ex.headers);
  }

  const err = {error: true, title, status, message, url, data};

  /* istanbul ignore if */
  if (res.locals.debugMode) {
    err.stack = stack;
  }

  res.status(status).json(err);
}

function sendResponse(req, res, sendText = false) {
  return data => {
    if (data instanceof Error) {
      return sendError(req, res, data);
    }

    var resp = data;
    let status;

    if (data instanceof HttpResponse) {
      status = data.status;
      res.set(data.headers);
      resp = data.data;
    }

    debug(`Endpoint ${req.originalUrl} responding with value: ${status} ${JSON.stringify(resp)}`);

    if (resp == null) { // Use == and not === to compare for null and undefined only
      res.status(status || HTTP_STATUS_NO_CONTENT).end();
      return;
    }

    if (status) {
      res.status(status);
    }

    if (sendText) {
      res.send(resp).end();
    }
    else {
      res.json(resp);
    }
  }
}

// apiCaller is used to wrap the actual middleware and check to see if the requested
// verb function is supported. If it is then we return the correct endpoint.
// If it is not supported then return a function that generates a 405 HTTP response.
function apiCaller(handler, action, methodNames, debugFilePath) {
  if (typeof handler === 'function') {
    return (req, res) => { // eslint-disable-line complexity
      debug(`Calling endpoint ${action} - [${req.originalUrl}]`);
      try {
        req.usageLog = new UsageLog(req);
      }

      catch(ex) {
        console.error('--------------------------------------------------------------');
        console.error("UsageLog failed to initialize.");
        console.error(ex.stack);
        console.error('--------------------------------------------------------------');
      }

      try {
        const { deleted, locked, disabled, loggedIn } = req.user;
        let isAllowed = !(deleted || disabled);
        
        if (isAllowed) {
          if (handler.deprecated) {
            res.setHeader('X-Api-Deprecated', handler.deprecated);
          }

          if (handler.loggedIn === true) {
            if (!loggedIn) {
              req.usageLog.warn('Attempted to access enpoint that requires logged in user');
              throw new HttpError(HTTP_STATUS_UNAUTHORIZED, { title: `Must be logged in to access endpoint [${action}].`, headers: { 'WWW-Authenticate': 'Bearer' } });
            }
          }

          if (handler.auth) {
            if (typeof handler.auth === 'function') {
              throw new HttpError(HTTP_STATUS_SERVER_ERROR, 'Omega does not support API auth functions yet.');
            }
            else {
              if (!loggedIn) {
                req.usageLog.warn('Attempted to access enpoint that requires logged in user');
                throw new HttpError(HTTP_STATUS_UNAUTHORIZED, { title: `Must be logged in to access endpoint [${action}].`, headers: { 'WWW-Authenticate': 'Bearer' } });
              }
              if (locked) {
                isAllowed = false;
              }
              else {
                isAllowed = req.user.inRole(handler.auth);
              }
            }
          }
        }

        if (!isAllowed) {
          req.usageLog.warn('Attempted to access enpoint with insufficient rights');
          throw new HttpError(HTTP_STATUS_FORBIDDEN, `Unable to access to endpoint "${action}"`);
        }


        req.usageLog.info(`Accessing enpoint ${action}`);
        if (handler.sessionTouch !== false && req.dirService && req.sessionId) {
          req.dirService.touchSession(req.sessionId);
        }

        // Setup the values being passed in through the URL and Posted data
        const params = {data: req.body, ...req.params, req};

        // Call the endpoint. Always use a promise no matter what is returned
        return Promise.resolve(handler(params)).then(
          sendResponse(req, res)
        ).catch(
          ex => {
            req.usageLog.error(`Error calling endpoint ${action}: ${ex.message}`);
            ex.stack = apiFixStack(ex.stack, debugFilePath);
            sendError(req, res, ex);
          }
        );
      }

      catch(ex) {
        req.usageLog.error(`Error calling endpoint ${action}`);
        debug(`Error calling endpoint ${action}\n${ex.stack}`);
        sendError(req, res, ex);
        return Promise.resolve(); // Must always return a Promise?? TODO: Make sure this is true or delete it.
      }
    }
  }

  // Below is for handling the OPTIONS verb
  return (req, res) => {
    // HTTP Response code 405 must return the `allow` header with the list of allowed verbs.
    debug(`Calling endpoint ${action} with unsupported verb.`);

    // Generate list of supported verbs
    var verbs = methodNames.reduce((acc, item) => {
      acc[VERB_LOOKUP[item]] = true;
      return acc;
    }, {OPTIONS:true});

    // TODO: These headers need to be returned on all endpoint calls.
    if (handler === OPTIONS) {
      // This is for CORS pre-flight check
      let headers = {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'Authorization, Content-Length, Content-Type, Cookie, X-Requested-With',
        'Access-Control-Allow-Methods': getVerbList(verbs),
        'Access-Control-Allow-Origin': '*', // TODO: WARNING!!! This needs to be a valid hostname and not '*'
        'Access-Control-Expose-Headers': 'Content-Length'
      };

      return Promise.resolve(sendResponse(req, res, true)(new HttpResponse(headers)));
    }

    // Send the 405 status with allow headers
    let headers = {'Allow': getVerbList(verbs)};
    var err = new HttpError(HTTP_STATUS_METHOD_NOT_ALLOWED, {headers});
    sendError(req, res, err);
    return Promise.resolve(); // Must always return a Promise
  }
}

module.exports = initApiSystem;
