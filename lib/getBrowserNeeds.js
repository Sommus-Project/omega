/*
 * If the `browserNeeds` cookie is not set then send a special html file
 * that checks for the polyfill needs of the browser and returns a new
 * `browserNeeds` cookie.
 *
 * The value of this cookie is a json object that descibes which polyfills
 * module format are needed.
 *
 * The module formats are 'MJS' for browsers that support module import,
 * 'CJS' for browsers that don't support module import but do support
 * `class` and `CJS5` for older browsers that don't even support `class`.
 */
const EXP_DAYS = 60; // 60 Days
const VERSION = 4;
const validFile = req => (req.accepts('text/css', 'application/json', 'html', 'xml', '*/*') === 'html') ;

function getBrowserNeeds(req, res, next) {
  const browserNeeds = JSON.parse(req.cookies.browserNeeds||'{"ver":0}');

  if (browserNeeds.ver < VERSION) {
    // browserNeeds.ver !== undefined && browserNeeds.ver < VERSION
    if (validFile(req)) {
      res.clearCookie('browserNeeds',{path:'/'});
      res.render('cookiesetter', {_layoutFile: false});
    }
    else {
      next();
    }
  }
  else {
    // browserNeeds.ver === undefined || browserNeeds.ver >= VERSION
    res.locals.browserNeeds = browserNeeds;

    // If the cookie does not have a version then we have a new cookie and must set the version and expiration.
    if (!browserNeeds.ver) {
      browserNeeds.ver = VERSION;
      let expires = new Date();
      expires.setDate(expires.getDate()+EXP_DAYS);
      res.cookie('browserNeeds', JSON.stringify(browserNeeds), {path:'/',expires,sameSite:true});
    }
    next();
  }
}

module.exports = getBrowserNeeds;
module.exports.VERSION = VERSION;
