/* eslint-env omega/api */
// API file: (groupid)
// Source File: src/api/account/session.js
// Generated on: 7/19/2019, 11:41:21 AM
const SESSION_COOKIE = require('./SESSION_COOKIE');

//*****************************
// API Functions
//
/**
 * @api {get} /api/account/session Get session information
 * @apiGroup Account
 * @apiDescription Get the current session information.
 * > This call does *not* refresh the users session timeout
 * @apiPermissions (user)
 * @apiRequestExample <200> Success Request Session Data
 * @apiResponseExample <200> Session Data
 * {
 *   "expiresInSeconds": 1570810038626
 * }
 */
async function doGet({ req }) { // eslint-disable-line no-unused-vars
  const expiresInSeconds = await req.sessionManager.getRemainingTime(req.sessionId);
  return { expiresInSeconds };
}
doGet.loggedIn = true;
doGet.sessionTouch = false;

/**
 * @api {put} /api/account/session Reset the session expiration
 * @apiGroup Account
 * @apiDescription Reset the session expiration for the logged in user
 * @apiPermissions (user)
 * @apiParam (body) [renew=true] If `true` then renew the session.
 * @apiRequestExample <200> Renew the session
 * { "renew": true }
 * @apiResponseExample <200> Session Data
 * {
 *   "expires": 1570810038626
 * }
 */
async function doPut({ data, req }) { // eslint-disable-line no-unused-vars
  req.usageLog.info(`User ${req.user.username} reset session ${req.sessionId}`);
  await req.sessionManager.touchSession(req.sessionId);
  return await doGet({ req });
}
doPut.loggedIn = true;

/**
 * @api {delete} /api/account/session Delete the current session
 * @apiGroup Account
 * @apiDescription Delete the current session. This is the equivalent to a logout command.
 * @apiPermissions (user)
 * @apiRequestExample <204> Delete the session
 * @apiResponseExample <204> Session was deleted
 */
async function doDelete({ req }) { // eslint-disable-line no-unused-vars
  req.usageLog.info(`User ${req.user.username} logged out of session ${req.sessionId}`);
  await req.sessionManager.invalidateSession(req.sessionId);
  return new HttpResponse({
    'Set-Cookie': `${SESSION_COOKIE}=invalid; Max-Age=0; Path=/`
  });
}
doDelete.loggedIn = true;

apimodule.exports = { doGet, doPut, doDelete };