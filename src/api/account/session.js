/* eslint-env omega/api */
// API file: (groupid)
// Source File: src/api/account/session.js
// Generated on: 7/19/2019, 11:41:21 AM

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
  const ds = req.dirService;
  const expiresInSeconds = await ds.getRemainingSessionTime(req.sessionId);
  return { expiresInSeconds };
}
doGet.loggedIn = true;
doGet.sessionTouch = false;

/**
 * @api {delete} /api/account/session Delete the current session
 * @apiGroup Account
 * @apiDescription Delete the current session. This is the equivalent to a logout command.
 * @apiPermissions (user)
 * @apiRequestExample <204> Delete the session
 * @apiResponseExample <204> Session was deleted
 */
async function doDelete({ req }) { // eslint-disable-line no-unused-vars
  const { SESSION_COOKIE } = req;
  const ds = req.dirService;
  req.usageLog.info(`User ${req.user.username} logged out of session ${req.sessionId}`);
  await ds.invalidateSession(req.sessionId);
  return new HttpResponse({
    'Set-Cookie': `${SESSION_COOKIE}=invalid; Max-Age=0; Path=/`
  });
}
doDelete.loggedIn = true;

apimodule.exports = { doGet, doDelete };