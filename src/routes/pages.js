module.exports = (app, options) => { // eslint-disable-line no-unused-vars
  app.locals.appName = 'Test Omega App';
  app.get('/', renderPage('home'));
  app.get('/form', renderPage('form'));
}

function renderPage(page, cb) {
  return async (req, res) => {
    let data;

    if (cb) {
      data = await cb(page, req);
    }

    res.render(page, data);
  }
}