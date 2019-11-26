const debug = require('debug')('Omega:errorHandler');
const SERVER_ERROR = 'The page you are looking for is temporarily unavailable.';

function errorHandler(error, req, res, next) { // eslint-disable-line complexity, no-unused-vars
  var err = error;
  if (typeof err !== 'object') {
    err = {
      status: 500,
      title: SERVER_ERROR,
      message: err
    }
  }

  var title = err.title || SERVER_ERROR;
  var status = err.status || 500;
  var message = err.message || 'Please try again later.';
  var url = req.url;
  var data = err.data;
  var stack = err.stack || '';

  res.status(status);

  var accept = req.accepts('json', 'html', 'xml', '*/*');

  if (accept === 'html' || accept === 'xml') {
    debug('Rendering html error page');
    res.render('errorpage', {title, status, message, url, data, stack}); // respond with html
  }
  else if (accept === 'json') {
    debug('Rendering JSON error object');
    res.json({error: true, title, status, message, url, data, stack}); // respond with json
  }
  else {
    debug('Rendering text error information');
    res.type('txt').send(`Title: ${title}\nStatus: ${status}\nMessage: ${message}\nData: ${data}\nStack Trace: ${stack}\nUrl: ${url}`); // default with text
  }

  res.end();
}


module.exports = errorHandler;
