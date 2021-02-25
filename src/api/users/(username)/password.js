/* eslint-env omega/api */
// API file: password
// Source File: src/api/users/(username)/password.js
// Generated on: 7/19/2019, 10:34:33 AM
const path = require('path').posix;

/**
 * @api {put} /api/users/:username/password Set user.password
 * @apiGroup Users
 * @apiDescription Set the state of 'password' for the specified user
 * @apiPermissions (role) 'WRITE_USERS'
 * @apiParam (path) username userpassword of the user to affect.
 * @apiRequestValue <204> (path) username jillsmith.
 * @apiRequestExample <204> Set state of password
 * @apiResponseExample <204> State of password set
 */
async function doPut({ username, data, req }) { // eslint-disable-line no-unused-vars
  const { domain, id: requestor } = req.user;
  const ds = req.dirService(domain);
  let user;
  try {
    user = await ds.getUser(username);
  }

  catch (ex) {
    throw404(path.dirname(req.path), ex.message);
  }

  try {
    await user.setPassword(requestor, data.password);
  }

  catch (ex) {
    throw new HttpError(400, { title: ex.message, data: `Unable to set 'password' for the user ${username}` });
  }
}
doPut.auth = ['WRITE_USERS'];


apimodule.exports = { doPut };