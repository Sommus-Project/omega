/* eslint-env omega/api */
const NoEntityError = require('./directoryService/errors/NoEntityError');

//*****************************
// API Functions
//
/**
 * @api {get} /api/users/:username Get (username)
 * @apiGroup Users
 * @apiDescription FIXME Description
 * @apiPermissions (role) FIXME 'conf-read'
 * @apiParam (path) username FIXME Param description.
 * @apiRequestValue <200> (path) username FIXME Value.
 * @apiRequestExample <200> FIXME Success Request Title
 * @apiResponseExample <200> FIXME Success Reponse Title
 * {
 *   FIXME RESPONSE
 * }
 * @apiRequestValue <404> (path) username FIXME Value.
 * @apiRequestExample <404> FIXME 404 Request Title
 * @apiResponseValue <404> (header) X-No-Entity FIXME /api/users/:username
 * @apiResponseExample <404> FIXME 404 Response Title
 * {
 *   "error": true,
 *   "title": "FIXME",
 *   "status": 404,
 *   "message": "Not Found",
 *   "url": "FIXME /api/users/:username"
 * }
 */
async function doGet({ username, req }) { // eslint-disable-line no-unused-vars
  const { provider } = req.user;
  const ds = req.dirService(provider);

  try {
    return await ds.getUser(username);
  }

  catch (ex) {
    if (ex instanceof NoEntityError) {
      throw404(req.path, `User ${username} not found.`);
    }

    throw ex;
  }
}
doGet.auth = ['user-edit'];

/**
 * @api {delete} /api/users/:username Delete user
 * @apiGroup Users
 * @apiDescription Delete the specified user
 * @apiPermissions (role) 'user-edit'
 *
 * @apiRequestValue <204> (path) username some-user
 * @apiRequestExample <204> Delete existing user
 * @apiResponseExample <204> User deleted
 *
 * @apiRequestValue <404> (path) username aaron_3265
 * @apiRequestExample <404> Try to delete non-existant user
 * @apiResponseValue <404> (header) X-No-Entity /api/users/aaron_3265
 * @apiResponseExample <404> Error Response
 * {
 *   "error": true,
 *   "title": "Server Error",
 *   "status": 404,
 *   "message": "Not Found",
 *   "url": "/api/users/aaron_3265"
 * }
 */
async function doDelete({ username, req }) { // eslint-disable-line no-unused-vars
  const { provider } = req.user;
  const ds = req.dirService(provider);
  if (username === req.user.username) {
    throw new HttpError(400, 'You can not delete yourself.');
  }

  try {
    await ds.deleteUser(username);
  }

  catch (ex) {
    // We do not respond with 404 if the user is not found.
  }
}
doDelete.auth = ['user-edit'];

apimodule.exports = { doGet, doDelete };