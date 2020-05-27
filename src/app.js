const omega = require('..');

const config = {
  apiFolders: {
    '/api': ['api']
  },
  providers: {}
}

const app = omega(config);
app.start();