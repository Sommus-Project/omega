function error404Handler(req, res, next) {
  next({
    status: 404,
    title: 'This page cannot be found',
    message: 'Recheck the url or contact your website administrator.'
  });
}

module.exports = error404Handler;
