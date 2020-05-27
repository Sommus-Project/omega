const http = require('http');
const https = require('https');

let httpAgent;
let httpsAgent;
const config = {
  keepAlive: true,
  keepAliveMsecs: 120000,
  maxSockets: 128
};

const sharedAgent = {
  get http() {
    httpAgent = httpAgent || new http.Agent(config);
    return httpAgent;
  },
  get https() {
    httpsAgent = httpsAgent || new https.Agent(config);
    return httpsAgent;
  },
  get maxSockets() {
    return config.maxSockets;
  },
  set maxSockets(max) {
    if (typeof max !== 'number' || max < 1 || max > 3999) {
      throw new TypeError('Invalid value for the maximum sockets.')
    }

    config.maxSockets = max;
    // istanbul ignore else
    if (httpAgent) {
      httpAgent.destroy();
      httpAgent = null;
    }
    // istanbul ignore else
    if (httpsAgent) {
      httpsAgent.destroy();
      httpsAgent = null;
    }
  }
}

module.exports = sharedAgent;
