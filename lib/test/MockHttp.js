const HttpResponse = require('../HttpResponse');
const HttpError = require('../HttpError');
const EventEmitter = require('events');
let responses = [];
const HTTP_STATUS_SERVER_ERROR = 500;
const MESSAGE_SERVER_ERROR = 'An unknown server error has occured';
const TITLE_SERVER_ERROR = 'Server Error';

function convertError(resp, url) {
  var title = resp.title || TITLE_SERVER_ERROR;
  var status = resp.status || HTTP_STATUS_SERVER_ERROR;
  var message = resp.message || MESSAGE_SERVER_ERROR;
  var data = resp.data;

  return {error: true, title, status, message, url, data};
}

class MockClientResponse extends EventEmitter {
  constructor(response, url) {
    super();
    if (response instanceof HttpError) {
      const err = convertError(response, url);
      this.body = JSON.stringify(err);
      this.headers = response.headers;
      this.statusCode = response.status;
    }
    else if (response instanceof HttpResponse) {
      this.body = response.data;
      this.headers = response.headers;
      this.statusCode = response.status;
    }
    else {
      this.body = response;
    }

    if (this.body != null) {
      if (typeof this.body === 'object') {
        this.body = JSON.stringify(this.body);
      }
      else if (typeof this.body !== 'string') {
        this.body = this.body.toString();
      }
    }

    this.headers = this.headers || {};
    this.statusCode = this.statusCode || 200;

    process.nextTick(() => {
      let data = this.body;
      if (data != null) {
        if (data.length > 0) {
          this.emit('data', Buffer.from(data));
        }
      }

      this.emit('end');
    });
  }
}

class MockClientRequest extends EventEmitter {
  constructor(protocol, options, cb) {
    super();
    this.protocol = protocol;
    this.options = options;
    this.cb = cb;
    const port = options.port?`:${options.port}`:'';
    this.uri = `${protocol}://${options.host}${port}${options.path}`;
  }

  end() {
    if (responses.length === 0) {
      return this.cb(new MockClientResponse(new HttpError(404)), this.uri);
    }
    try {
      responses.some(
        resp => {
          if (this.options.method === resp.method) {
            let uriMatches = false;
            if (resp.uri instanceof RegExp) {
              uriMatches = resp.uri.test(this.uri);
            }
            else {
              uriMatches = resp.uri === this.uri;
            }

            if (uriMatches) {
              let returnData;
              if (typeof resp.response === 'function') {
                returnData = resp.response({
                  protocol: this.protocol,
                  options: this.options,
                  respObj: resp,
                  data: this.writtenData
                });
              }
              else {
                returnData = resp.response;
              }

              Promise.resolve(returnData).then(
                data => {
                  if (data === 'cause error') {
                    this.emit('error', {"errno":"ENOTFOUND","code":"ENOTFOUND","syscall":"getaddrinfo","hostname":"dlocalhost","host":"dlocalhost","port":443});
                  }
                  else {
                    this.cb(new MockClientResponse(data), this.uri);
                  }
                }
              );

              return true;
            }
          }

          this.cb(new MockClientResponse(new HttpError(500, `Reponse not found for ${this.method}:${this.uri}`), this.uri));
        }
      );
    }

    catch(ex) {
      this.emit('error', ex);
    }
  }

  write(data) {
    this.writtenData = data;
  }
}

class MockHttp {
  constructor(protocol) {
    this.protocol = protocol;
  }

  request(options, cb) {
    return new MockClientRequest(this.protocol, options, cb);
  }
}

function addResponse (method, uri, response) {
  if (typeof uri !== 'string' && !(uri instanceof RegExp)) {
    throw new TypeError('the `uri` must be a string or RegExp');
  }
  responses.push({method, uri, response});
}

function clear () {
  responses = [];
}

module.exports = MockHttp;
module.exports.addResponse = addResponse;
module.exports.clear = clear;
