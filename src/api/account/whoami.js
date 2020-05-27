/* eslint-env omega/api */

/**
 * @api {get} /api/account/whoami Who am I
 * @apiGroup Account
 * @apiDescription Get information about the logged in user.
 * @apiPermissions (user)
 * @apiRequestValue <200> (cookie) imat-session "valid session id"
 * @apiRequestExample <200> Who am I
 * @apiResponseExample <200> User information
 * {
 *   "username": "someuser",
 *   "provider": "default",
 *   "session_expires": 1570810038626,
 *   "name": "Some user",
 *   "uuid": "123e4567-e89b-42d3-a456-556642440000"
 *   "removable": true,
 *   "modifiable": true,
 *    ...
 * }
 *
 * @apiRequestExample <401> User not logged in
 * @apiResponseExample <401> Must be logged in
 * {
 *   "error": true,
 *   "title": "Must be logged in to access REST endpoint [GET:/api/account/whoami].",
 *   "status": 401,
 *   "message": "Unauthorized",
 *   "url": "/api/account/whoami"
 * }
 */
async function doGet({ req }) {
  return req.user;
}
doGet.loggedIn = true;

apimodule.exports = { doGet };