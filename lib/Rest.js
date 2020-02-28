const realService = {
  http: require('http'),
  https: require('https')
};
const validProtocols = Object.keys(realService);
const debug = require('debug')('Omega:Rest');
const MockRestExpect = require('./test/MockRestExpect');
const MockRestRespond = require('./test/MockRestRespond');
const sharedAgent = require('./sharedAgent');
const APP_JSON = 'application/json';
const $private = new WeakMap();
const CONTENT_TYPE = 'Content-Type';
const METHOD = {
  DELETE: 'DELETE',
  GET: 'GET',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS',
  PATCH: 'PATCH',
  POST: 'POST',
  PUT: 'PUT'
};
const DATA_METHODS = [METHOD.POST,METHOD.PUT,METHOD.PATCH];

const two = num => `0${num}`.slice(-2);
const defProp = (obj, key, val) => Object.defineProperty(obj, key, {value:val, writable:false});
const urlEncode = val => Object.entries(val).map(([k,v])=>`${k}=${encodeURIComponent(v)}`).join('&');

// Log each request, how long it took and the response code.
function logRequest(req, res, startTime, requestId, trackingId) {
  const delta = Date.now() - startTime;
  const url = res.info.url
  const d = new Date(startTime);
  const dateStr = `${d.getFullYear()}/${two(d.getMonth()+1)}/${two(d.getDate())}`;
  const timeStr = `${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`;
  const size = res.headers['content-length'] || res.body.length || 0;
  console.info(`${dateStr}`, timeStr, '[endpoint]', `"${res.info.method} ${url}"`, res.statusCode, size, delta+'ms', `"${requestId}" "${trackingId||'-'}"`);
}

function destroySender(sender) {
  let p = $private.get(sender);
  p.cookies = {};
  p.headers = {};
}

class Sender {
  constructor(service, sendCB, responseCB, requestId, trackingId, method, uri, data = null) {
    // TODO: Break Headers out into its own class.
    const headers = {
      accept: APP_JSON
    };

    const p = {
      cookies: {},
      data,
      headers,
      method,
      requestId,
      responseCB,
      sendCalled: false,
      sendCB,
      service,
      trackingId,
      uri
    };

    $private.set(this, p);

    if (requestId !== '-') {
      this.setHeader('X-UI-Request-Id', requestId);
    }
  }

  send() {
    let p = $private.get(this);
    if (p.sendCalled) {
      throw new Error('You can not call `send` more than once.')
    }

    let data;
    p.sendingData = DATA_METHODS.includes(p.method);
    if (p.sendingData) {
      data = p.data;

      // Set the `Content-Type` to 'application/json'
      // If it is not already set
      this.setHeader(CONTENT_TYPE, APP_JSON, false);

      if (typeof data !== 'string') {
        if (data == null) {
          data = ''; // If null or undefined then set to an empty string
        }
        else if (typeof data === 'object') {
          if (this.getHeader(CONTENT_TYPE) === APP_JSON) {
            // Content type==='application/json': use JSON.stringify
            data = JSON.stringify(data);
          }
          else {
            // Otherwise use URL encoding
            data = urlEncode(data);
          }
        }
        else {
          data = data.toString();
        }
      }

      this.setHeader('Content-Length', data.length);
    }

    if (p.sendCB) {
      // Allow the application to set any needed headers or cookies
      p.sendCB(this);
    }

    let cookieValue = Object.keys(p.cookies).map(
      cookie => {
        let val = p.cookies[cookie];
        return `${cookie}=${val}`;
      }
    ).join('; ');

    this.setHeader('Cookie', cookieValue);
    this.setHeader('Date', (new Date()).toGMTString());

    p.sendCalled = true;

    return new Promise(
      (resolve, reject) => {
        const url = new URL(p.uri);
        const protocol = url.protocol.slice(0, -1);

        let options = {
          agent: sharedAgent[protocol],
          ca: false,
          host: url.hostname,
          hostname: url.hostname,
          headers: p.headers,
          method: p.method,
          path: url.pathname+url.search,
          port: url.port,
          rejectUnauthorized: false
        }

        const startTime = Date.now();
        debug(`Sending Rest request to ${p.uri}`);
        let req = p.service[protocol].request(options,
          res => {
            const responseBuffers = [];

            if (p.responseCB) {
              p.responseCB(res);
            }

            res.on('data', resData => {
              // TODO: Maybe I can respond as soon as I get my first set of data
              // or when `end` happens, whichever comes first.
              // And provide `json()`, `text()` and `blob()` functions that work like fetch
              responseBuffers.push(resData);
            });

            res.on('end', () => {
              res.buffer = Buffer.concat(responseBuffers);
              const responseString = res.buffer.toString('utf8');
              res.body = responseString;
              res.info = {
                method: p.method,
                url
              };
              logRequest(req, res, startTime, p.requestId, p.trackingId);

              const retVal = {
                buffer: Buffer.concat(responseBuffers),
                body: responseString,
                headers: res.headers,
                ok: res.statusCode < 300,
                request: options,
                status: res.statusCode
              }

              debug(`Response was ${res.statusCode}\n${responseString.substr(0,100)}...`);
              // Attempt to parse JSON
              try { retVal.json = JSON.parse(responseString); }
              catch(ex) { /*Nothing to do*/ }
              req = null; // Remove so we don't try to abort it later.
              resolve(retVal);
              destroySender(this);
            });
          }
        );

        if (p.sendingData) {
          req.write(data);
        }

        req.on("error", res => {
          res.statusCode = 502;
          res.headers = {};
          res.body = '';
          res.info = {
            method: p.method,
            url
          };
          debug(`Error: ${url}`);
          logRequest(p.req, res, startTime, p.requestId, p.trackingId);
          req = null; // Remove so we don't try to abort it later.
          reject(res);
          destroySender(this);
        });

        req.end();
      }
    );
  }

  setCookie(cookie, value, encode = true) {
    let p = $private.get(this);
    if (p.sendCalled) {
      throw new Error('You can not call `setCookie` after calling `send`.')
    }

    if (cookie == null) {
      throw new TypeError('You must pass a "key, value" pair into setCookie.')
    }

    if (value == null) {
      debug(`Removing cookie ${cookie}`);
      delete p.cookies[cookie];
    }
    else {
      debug(`Adding cookie ${cookie}=${value}`);
      p.cookies[cookie] = encode ? encodeURIComponent(value) : value;
    }
    return this;
  }

  getHeader(header) {
    let p = $private.get(this);
    const lKey = header.toLowerCase();
    return p.headers[lKey];
  }

  setHeader(header, value, replace = true) {
    let p = $private.get(this);
    if (p.sendCalled) {
      throw new Error('You can not call `setHeader` after calling `send`.')
    }

    if (header == null) { // eslint-disable-line no-eq-null, eqeqeq
      throw new TypeError('You must pass an object, or a "key, value" pair into setHeader.')
    }

    let obj = header;
    if (typeof header !== 'object') {
      obj = {[header]: value};
    }

    Object.entries(obj).forEach(
      ([key, val]) => {
        const lKey = key.toLowerCase();
        if (replace || !p.headers[lKey]) {
          if (val == null) {
            debug(`Removing header ${lKey}`);
            delete p.headers[lKey]; // Remove single new header
          }
          else {
            debug(`Adding header ${lKey}=${val}`);
            p.headers[lKey] = val.toString(); // Add single new header
          }
        }
      }
    );

    return this;
  }
}

class Rest {
  constructor(requestId) {
    const p = {requestId, service:realService};
    $private.set(this, p);
  }

  destroy() {
    $private.delete(this);
  }

  set trackingId(val) {
    const p = $private.get(this);
    p.trackingId = val;
  }

  onResponse(responseCB) {
    const p = $private.get(this);
    p.responseCB = responseCB;
  }

  onSend(sendCB) {
    const p = $private.get(this);
    p.sendCB = sendCB;
  }

  getSender(method, uri, data) {
    if (typeof uri !== 'string' || uri.length < 1) {
      throw new TypeError('You must provide the `uri` as a string.');
    }

    const url = new URL(uri);
    const protocol = url.protocol.slice(0, -1);
    if (!validProtocols.includes(protocol)) {
      throw new RangeError(`The protocol provided (protocol) is not supported. Supported protocols are: ${validProtocols.join(', ')}`);
    }

    const {service, sendCB, responseCB, requestId, trackingId} = $private.get(this);
    debug(`Rest call ${method}, ${uri}`);
    return new Sender(service, sendCB, responseCB, requestId, trackingId, method, uri, data);
  }

  delete(uri) {
    return this.getSender(METHOD.DELETE, uri);
  }

  get(uri) {
    return this.getSender(METHOD.GET, uri);
  }

  head(uri) {
    return this.getSender(METHOD.HEAD, uri);
  }

  options(uri) {
    return this.getSender(METHOD.OPTIONS, uri);
  }

  patch(uri, data) {
    return this.getSender(METHOD.PATCH, uri, data);
  }

  post(uri, data) {
    return this.getSender(METHOD.POST, uri, data);
  }

  put(uri, data) {
    return this.getSender(METHOD.PUT, uri, data);
  }
}

defProp(Rest, 'METHOD', METHOD);

function getPrevCall(requests, method, uri, data) {
  return requests.filter(r => r.method === method && r.uri === uri && r.data === data)[0];
}

class MockRest extends Rest {
  constructor(requestId = '-') {
    super(requestId);
    const p = $private.get(this);
    const MockHttp = require('./test/MockHttp');
    p.service = {
      http: new MockHttp('http'),
      https: new MockHttp('https')
    };
    p.clear = MockHttp.clear;
    p.expect = [];
    p.requests = [];
    defProp(this, 'expect', MockRestExpect(p));
    defProp(this, 'respond', MockRestRespond());
  }

  static get privateMap() {
    return $private;
  }

  afterEach() {
    const p = $private.get(this);
    return new Promise(
      (resolve, reject) => {
        if (p.expect.length === 0) {
          return resolve();
        }

        let accessedTimes = 0;
        let requiredTimes = 0;
        p.expect.forEach(
          expected => {
            requiredTimes = expected.times;
            const found = p.requests.some(
              req => {
                accessedTimes = 0;
                if (expected.method === req.method) {
                  let uriMatches = false;
                  if (expected.uri instanceof RegExp) {
                    uriMatches = expected.uri.test(req.uri);
                  }
                  else {
                    uriMatches = expected.uri === req.uri;
                  }

                  if (uriMatches) {
                    if (expected.data === req.data) {
                      accessedTimes = req.times;
                      return expected.times === req.times;
                    }
                  }
                }
              }
            );

            if (!found && requiredTimes !== accessedTimes) {
              return reject(new Error(`Expected URL[${expected.uri}] was accessed ${accessedTimes} times and should have been accessed ${requiredTimes} times.`));
            }

            resolve();
          }
        );
      }
    );
  }

  beforeEach() {
    return new Promise(
      (resolve) => {
        const p = $private.get(this);
        p.expect = [];
        p.requests = [];
        this.clearResponses();
        resolve();
      }
    );
  }

  clearResponses() {
    const p = $private.get(this);
    p.clear();
  }

  getSender(method, uri, data) {
    const p = $private.get(this);
    var prevCall = getPrevCall(p.requests, method, uri, data);
    if (!prevCall) {
      p.requests.push({method, uri, data, times:1});
    }
    else {
      prevCall.times++;
    }
    return super.getSender(method, uri, data);
  }
}

defProp(Rest, 'mock', MockRest);

module.exports = Rest;
