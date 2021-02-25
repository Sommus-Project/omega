/* eslint-env omega/api */
// API file: groups
// Source File: src/api/users/(username)/disabled.js
// Generated on: 7/19/2019, 10:34:33 AM
const path = require('path').posix;

/**
 * @api {get} /api/users/:username/disabled Get user.disabled
 * @apiGroup Users
 * @apiDescription Get the state of 'disabled' for the specified user
 * @apiPermissions (role) 'WRITE_USERS'
 * @apiParam (path) username username of the user to read.
 * @apiRequestValue <200> (path) username johnsloan.
 * @apiRequestExample <200> Get disabled
 * @apiResponseExample <200> State of disabled
 * {
 *   disabled: true
 * }
 */
async function doGet({ username, req }) { // eslint-disable-line no-unused-vars
  const { domain } = req.user;
  const ds = req.dirService(domain);
  let user;
  try {
    user = await ds.getUser(username);
  }

  catch (ex) {
    throw404(path.dirname(req.path), ex.message);
  }

  return { disabled: user.disabled };
}
doGet.auth = ['WRITE_USERS'];

/**
 * @api {put} /api/users/:username/disabled Set user.disabled
 * @apiGroup Users
 * @apiDescription Set the state of 'disabled' for the specified user
 * @apiPermissions (role) 'WRITE_USERS'
 * @apiParam (path) username username of the user to affect.
 * @apiRequestValue <204> (path) username jillsmith.
 * @apiRequestExample <204> Set state of disabled
 * @apiResponseExample <204> State of disabled set
 */
async function doPut({ username, data, req }) { // eslint-disable-line no-unused-vars
  const { domain } = req.user;
  const ds = req.dirService(domain);
  let user;
  try {
    user = await ds.getUser(username);
  }

  catch (ex) {
    throw404(path.dirname(req.path), ex.message);
  }

  try {
    await user.setDisabled(data.disabled || false);
  }

  catch (ex) {
    throw new HttpError(400, { title: ex.message, data: `Unable to set 'disabled' for the user ${username}` });
  }
}
doPut.auth = ['WRITE_USERS'];


apimodule.exports = { doGet, doPut };