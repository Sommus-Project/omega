const debug = require('debug')('Omega:forceSecure');
const DEFAULT_HTTPS_PORT = 443;
const RUN_ENV = process.env.RUN_ENV || 'DEV';

function forceSecure(httpsPort, clientRedirect = true) {
  return (req, res, next) => {
    if (httpsPort === true && RUN_ENV === 'PROD') {
      if (req.headers['x-forwarded-proto'] !== 'https') {
        debug('forcing a server-side redirect to https.')
        return res.redirect(`https://${req.hostname}${req.originalUrl}`);
      }
    }

    if (httpsPort === true || req.connection.encrypted) {
      next();
    }
    else {
      const port = (httpsPort === DEFAULT_HTTPS_PORT) ? '' : `:${httpsPort}`;

      if (clientRedirect) {
        debug('forcing a client-side redirect to https.')
        const html = `<html><body><script>
  var req = document.location;
  var port = '${port}';
  var url = 'https://'+req.hostname+port+req.pathname+req.search+req.hash;
  window.location = url;
</script></body></html>`;
        res.send(html).end();
      }
      else {
        debug('forcing a server-side redirect to https.')
        res.redirect(`https://${req.hostname}${port}${req.originalUrl}`);
      }
    }
  }
}

module.exports = forceSecure;
