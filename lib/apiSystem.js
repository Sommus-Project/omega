const API_FILES = '**/!(*.mocha).js';
const DEFAULT_ID_KEY = '/:id';
const HTTP_STATUS_NO_CONTENT = 204;
const HTTP_STATUS_UNAUTHORIZED = 401;
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
  doPatch: 'PATCH',
  getList: 'GET',
  getItem: 'GET',
  putItem: 'PUT',
  postItem: 'POST',
  deleteItem: 'DELETE',
  patchItem: 'PATCH'
}
const debug = require('debug')('Omega:apiSystem');
const path = require('path').posix;
const apiDocs = require('./apiDocs.js');
const apiLoader = require('./apiLoader.js');
const HttpError = require('./HttpError.js');
const HttpResponse = require('./HttpResponse.js');
const UsageLog = require('./UsageLog');
const {getFileArrayFromGlob} = require('@imat/omegalib');
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

function init(app, appPath, config) {
  const baseFolder = config.apiFolder;
  const apiFolder = path.join(appPath, baseFolder);
  const apiUri = `${config.apiUri}/`;
  const requireApi = apiLoader(apiFolder, apiUri);
  debug(`Initialize: folder(${baseFolder}) - uri(${apiUri})`);

  app.use(apiUri+'*',
    (req, res, next) => {
      debug(`\nEndpoint accessed: (${req.method}) ${req.originalUrl}`);
      next();
    }
  )

  /* istanbul ignore if */
  if (config.apiDocs) {
    app.get(config.apiUri, apiDocs({apiFolder}));
  }

  getFileArrayFromGlob(apiFolder, API_FILES).sort(sortApis).forEach(item => {
    // Set up REST endpoint routes in the express system for each REST endpoint file found.
    const modPath = item.replace('.js', '');
    const uri = apiUri+modPath.replace(/\(([^\)]+)\)/g, (key, val) => `:${val}`);
    const apiFilePath = `./${modPath}`;
    const apiComponent = requireApi(apiFilePath);
    if (typeof apiComponent !== 'object') {
      debug(`REST endpoint file failed to export valid object: ${apiFilePath}`);
      throw new Error('Your REST endpoint file must export an object.')
    }
    const keys = Object.keys(apiComponent);

    debug(`\nLinking REST endpoints for ${apiFilePath}`);
    debug(`Url: ${uri} - [${keys.join(', ')}]`);
    app.options(uri, apiCaller(OPTIONS, `(OPTIONS) ${uri}`, keys));
    // When we are on version 4.x uncomment these lines
    // app.get(uri, apiCaller(apiComponent.doGet, `(GET) ${uri}`, keys));
    // app.put(uri, apiCaller(apiComponent.doPut, `(PUT) ${uri}`, keys));
    // app.post(uri, apiCaller(apiComponent.doPost, `(POST) ${uri}`, keys));
    // app.delete(uri, apiCaller(apiComponent.doDelete, `(DELETE) ${uri}`, keys));
    // app.patch(uri, apiCaller(apiComponent.doPatch, `(PATCH) ${uri}`, keys));
    // uncomment to here

    // When we are on version 4.x delete these lines
    const uriWithId = uri+DEFAULT_ID_KEY;
    /* istanbul ignore else */
    if (apiComponent.doGet) {
      app.get(uri, apiCaller(apiComponent.doGet, `(GET) ${uri}`, keys));
    }
    else {
      app.get(uri, apiCaller(apiComponent.getList, `(GET) ${uri}`, keys));
      app.get(uriWithId, apiCaller(apiComponent.getItem, `(GET) ${uriWithId}`, keys));
    }
    /* istanbul ignore else */
    if (apiComponent.doPut) {
      app.put(uri, apiCaller(apiComponent.doPut, `(PUT) ${uri}`, keys));
    }
    else {
      app.put(uriWithId, apiCaller(apiComponent.putItem, `(PUT) ${uriWithId}`, keys));
    }
    /* istanbul ignore else */
    if (apiComponent.doPost) {
      app.post(uri, apiCaller(apiComponent.doPost, `(POST) ${uri}`, keys));
    }
    else {
      app.post(uri, apiCaller(apiComponent.postItem, `(POST) ${uri}`, keys));
    }
    /* istanbul ignore else */
    if (apiComponent.doDelete) {
      app.delete(uri, apiCaller(apiComponent.doDelete, `(DELETE) ${uri}`, keys));
    }
    else {
      app.delete(uriWithId, apiCaller(apiComponent.deleteItem, `(DELETE) ${uriWithId}`, keys));
    }
    /* istanbul ignore else */
    if (apiComponent.doPatch) {
      app.patch(uri, apiCaller(apiComponent.doPatch, `(PATCH) ${uri}`, keys));
    }
    else {
      app.patch(uriWithId, apiCaller(apiComponent.patchItem, `(PATCH) ${uriWithId}`, keys));
    }
    // Delete to here
  });

  app.use(apiUri+'*',
    (req, res) => {
      sendError(req, res, new HttpError(404));
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
// verb function is supported. If it is then we return the correct REST endpoint.
// If it is not supported then return a function that generates a 405 HTTP response.
function apiCaller(handler, action, methodNames) {
  if (typeof handler === 'function') {
    return (req, res) => { // eslint-disable-line complexity
      debug(`Calling endpoint ${action} - [${req.originalUrl}]`);
      try {
        req.usageLog = new UsageLog(req);
      }

      catch(ex) {
        console.error("UsageLog failed to initialize.");
        console.error(ex.stack);
      }

      try {
        if (handler.deprecated) {
          res.setHeader('X-Api-Deprecated', handler.deprecated);
        }

        let isAllowed = true;
        if (handler.loggedIn === true) {
          if (!req.user.loggedIn) {
            throw new HttpError(HTTP_STATUS_UNAUTHORIZED, `Must be logged in to access REST endpoint [${action}].`);
          }
        }

        if (handler.auth) {
          if (typeof handler.auth === 'function') {
            throw new HttpError(HTTP_STATUS_SERVER_ERROR, 'Omega does not support API auth functions yet.');
          }
          else {
            isAllowed = req.user.inRole(handler.auth);
          }
        }

        if (!isAllowed) {
          throw new HttpError(HTTP_STATUS_FORBIDDEN, `No access to this REST endpoint "${action}"`);
        }

        // Setup the values being passed in through the URL and Posted data
        const params = {data: req.body, ...req.params, req};

        // Call the REST endpoint. Always use a promise no matter what is returned
        return Promise.resolve(handler(params)).then(
          sendResponse(req, res)
        ).catch(
          sendResponse(req, res)
        );
      }

      catch(ex) {
        debug(`Error calling REST endpoint ${action}\n${ex.stack}`);
        sendError(req, res, ex);
        return Promise.resolve(); // Must always return a Promise
      }
    }
  }

  return (req, res) => {
    // HTTP Response code 405 must return the `allow` header with the list of allowed verbs.
    debug(`Calling REST endpoint ${action} with unsupported verb.`);

    // Generate list of supported verbs
    var verbs = methodNames.reduce((acc, item) => {
      acc[VERB_LOOKUP[item]] = true;
      return acc;
    }, {OPTIONS:true});

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

module.exports = init;
