/* eslint-env omega/api */

const SESSION_COOKIE = require('./SESSION_COOKIE');

/**
 * @api {post} /api/account/logout Log user out
 * @apiGroup Account
 * @apiDescription Log the user out by removing their session information from `SessionManager`.
 * @apiPermissions (user)
 * @apiRequestExample <204> Log user out
 * @apiResponseValue <204> (header) Set-Cookie session=invalid; Max-Age=0; Path=/
 * @apiResponseExample <204> Config File List
 */
async function doPost({ req }) {
  await req.sessionManager.invalidateSession(req.sessionId);
  req.usageLog.info(`User logged out of session ${req.sessionId}`);
  return new HttpResponse({
    'Set-Cookie': `${SESSION_COOKIE}=invalid; Max-Age=0; Path=/`
  });
}
doPost.loggedIn = true;

apimodule.exports = { doPost };