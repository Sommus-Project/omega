const debug = require('debug')('Omega:black-list-proxy');
const DEFAULT_TIMEOUT = 30000;
const getXForwardedForHeader = require('./getXForwardedForHeader');
const HttpError = require('./HttpError');
const isRegExp = require('./isRegExp');
const sharedAgent = require('./sharedAgent');
const transports = {
  http: require('http'),
  https: require('https')
};

// Proxy an endpoint with options
module.exports = (config = {}) => {
  const timeout = config.timeout || DEFAULT_TIMEOUT;

  return (req, res, next) => { // eslint-disable-line complexity
    if (!req.connection.encrypted) {
      debug('Not Encrypted - No proxy.');
      return next(); // Don't proxy if we are not on HTTPS
    }

    const proxyLookup = req.proxyLookup || config.proxyLookup;
    let proxyInfo = false;
    if (Array.isArray(proxyLookup)) {
      proxyLookup.some(info => {
        if (isRegExp(info.pathRe) && info.pathRe.test(req.originalUrl)) {
          if (info.proxy === false) {
            debug(`Proxy skip: ${req.originalUrl} => ${info.pathRe.toString()}`);
          }
          else {
            //debug(`Proxy hit: ${req.originalUrl} => ${info.pathRe.toString()}`);
          }
          proxyInfo = info.proxy;
          return true;
        }
      });
    }
    else {
      debug('No proxyLookup. Not proxying any file.');
    }

    if (proxyInfo === false) {
      return next(); // Do not proxy if this path should be skipped
    }

    const { originalUrl, method, headers } = req;
    const { protocol, hostname, port } = proxyInfo;
    const transport = transports[protocol];
    const agent = sharedAgent[protocol];
    debug(`Proxying URL (${req.originalUrl}) to ${protocol}://${hostname}:${port}${originalUrl}`);

    // Setup the options
    var options = {
      agent,
      headers: {...headers},
      hostname,
      method,
      path: originalUrl,
      protocol: `${protocol}:`,
      port
    };

    if (config.cookies === false) {
      delete options.headers.cookie; // Delete cookies if we are supposed to
    }
    
    // We need to set authuser and authtoken if they are in app.config.json and not already provided by the client
    if (config.token && config.username && !(options.headers.authtoken || options.headers.authuser)) {
      options.headers.authuser = config.username;
      options.headers.authtoken = config.token;
    }
    
    const xForwardedForHeader = getXForwardedForHeader(req)
    delete options.headers['x-forwarded-for'];
    options.headers['X-Forwarded-For'] = xForwardedForHeader;
    options.headers['X-Real-IP'] = xForwardedForHeader.split(',')[0];
    options.headers['X-Forwarded-Host'] = options.headers.host;
    delete options.headers.host; // Remove the host header

    /**
     * Hack for nginx backends where node, by default, sends no 'content-length' header if no data is sent
     * with the request and sets the 'transfer-encoding' to 'chunked'. Nginx will then send a 411 because 
     * the body contains a '0' which is the length of the chunk
     *
     *   GET /proxy
     *   transfer-encoding: chunked
     *
     *   0
     */
     /* istanbul ignore next */
    if (['POST', 'DELETE'].includes(options.method) && options.headers['transfer-encoding'] !== 'chunked') {
      options.headers['content-length'] = options.headers['content-length'] || '0';
    }

    debug('sending proxy request', {
      headers: options.headers,
      hostname:options.hostname,
      method: options.method,
      path: options.path,
      protocol: options.protocol,
      port: options.port
    });

    if (typeof config.preCallback === 'function') {
      config.preCallback(options, req);
    }

    // Make the request with the correct protocol
    var request = transport.request(options,
      proxyResp => {
        debug('got response');

        // The headers have already been sent so we can't actually respond to this request
        /* istanbul ignore next */
        if (res.headersSent) {
          res.end();
          return request.abort();
        }

        if (typeof config.postCallback === 'function') {
          config.postCallback(proxyResp, req, options);
        }

        /* istanbul ignore else */
        if (!res.headersSent) {
          // As per RFC-2616 Seciont 14.10:
          // We, as a proxy, must not forward the `connection` header
          delete proxyResp.headers.connection;

          /* istanbul ignore next */
          if (proxyResp.headers.location) {
            // Remove any hardcoded hostnames in they are not to another server
            // TODO: MGC: 07/12/2018 - Only remove if this is the current server hostname (Like: https://10.10.9.238)
            proxyResp.headers.location = proxyResp.headers.location.replace(/https\:\/\/[^/]+\//, '/');
          }

          // Send down the statusCode and headers
          debug('sending proxyResp head', proxyResp.statusCode, proxyResp.headers);
          res.writeHead(proxyResp.statusCode, proxyResp.headers);

          // Pipe the response
          debug('piping response');
          proxyResp.pipe(res);
        }
      }
    );

    // Handle any timeouts that occur
    /* istanbul ignore else */
    if (config.timeout !== false) {
      request.setTimeout(timeout,
        () => {
          // Clean up the socket
          request.setSocketKeepAlive(false);
          request.socket.destroy();

          // Mark this as a gateway timeout
          let msg = `Proxy for "${req.method} ${req.url}" timed out after ${timeout/1000} seconds`;
          debug(msg);
          res.status(504);
          next(new HttpError(504, {data: msg}));
        }
      );
    }

    // Pipe the client request upstream
    req.pipe(request);

    // Pass on our errors
    request.on('error',
      err => {
        debug(`Error for "${req.verb} ${req.url}"`, err);
        next(err);
      }
    );
  }
};
