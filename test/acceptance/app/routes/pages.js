module.exports = (app, options) => { // eslint-disable-line no-unused-vars
  app.get('/', renderPage('home'));
}

function renderPage(page) {
  return function (req, res) {
    res.render(page);
  }
}
