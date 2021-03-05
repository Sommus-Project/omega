/* eslint-env omega/api */
// API file: roles
// Source File: src/api/users/(username)/roles.js
// Generated on: 7/19/2019, 10:34:33 AM
const path = require('path').posix;

/**
 * @api {get} /api/users/:username/roles Get user.roles
 * @apiGroup Users
 * @apiDescription FIXME Description
 * @apiPermissions (role) FIXME 'READ_USERS'
 * @apiParam (path) username FIXME Param description.
 * @apiRequestValue <200> (path) username FIXME Value.
 * @apiRequestExample <200> FIXME Success Request Title
 * @apiResponseExample <200> FIXME Success Reponse Title
 * {
 *   FIXME RESPONSE
 * }
 */
async function doGet({ username, req }) { // eslint-disable-line no-unused-vars
  const ds = req.dirService;

  try {
    const user = await ds.getUser(username);
    return user.roles;
  }

  catch (ex) {
    throw404(path.dirname(req.path), ex.message);
  }

}
doGet.auth = ['READ_USERS'];

apimodule.exports = { doGet };