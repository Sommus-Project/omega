// Allow HTTPS without validatin the cert
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const fs = require('fs');
const os = require('os');
const https = require('https');
const http = require('http');
const HOST = '0.0.0.0';

const correctHost = str => str.replace('0.0.0.0', 'localhost');

module.exports = (app, distPath, config) => {
  const httpPort = config.httpPort;
  const httpsPort = config.httpsPort;

  return new Promise(
    resolve => {
      if (httpPort === false && httpsPort === false) {
        throw new Error('You can not set both the httpPort and httpsPort to false.');
      }

      if (httpPort !== false) {
        http.createServer(app).listen(httpPort, HOST, () => {
          let host = correctHost(`http://${HOST}:${httpPort}`);
          console.info(`Omega HTTP server running on "${host}" (Listening on ${HOST})`)
          if (httpsPort === false) {
            resolve();
          }
        });
      }

      if (httpsPort !== false) {
        const sslOptions = {
          key: fs.readFileSync(config.keyPath),
          cert: fs.readFileSync(config.certPath)
        };

        https.createServer(sslOptions, app).listen(httpsPort, HOST, () => {
          let host = correctHost(`https://${HOST}:${httpsPort}`);
          console.info(`Omega HTTPS server running on "${host}" (Listening on ${HOST})`)
          resolve();
        });
      }
    }
  );
}
