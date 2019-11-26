const omega = require('../../../app');

function initAppFn(app, options) {
  app.locals.appName = "Testing app";
}

function initReqFn(req, res, options) {
  res.setHeader('X-Sample-App', 'true');
  res.locals.originalUrl = req.originalUrl;
}

const config = {
  appPath: __dirname,
  httpPort: 5080,
  httpsPort: 5443,
  initAppFn,
  initReqFn,
  useProxy: false
};

const app = omega(config);
app.start();
