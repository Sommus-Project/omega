/* eslint-env omega/api */
// API file: locked
// Source File: src/api/users/(username)/locked.js
// Generated on: 7/19/2019, 10:34:33 AM
const path = require('path').posix;

/**
 * @api {get} /api/users/:username/locked Get user.locked
 * @apiGroup Users
 * @apiDescription Get the state of 'locked' for the specified user
 * @apiPermissions (role) 'READ_USERS'
 * @apiParam (path) username username of the user to read.
 * @apiRequestValue <200> (path) username johnsloan.
 * @apiRequestExample <200> Get locked
 * @apiResponseExample <200> State of locked
 * {
 *   locked: true
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

  return { locked: user.locked };
}
doGet.auth = ['READ_USERS'];

/**
 * @api {put} /api/users/:username/locked Set user.locked
 * @apiGroup Users
 * @apiDescription Set the state of 'locked' for the specified user
 * @apiPermissions (role) 'WRITE_USERS'
 * @apiParam (path) username username of the user to affect.
 * @apiRequestValue <204> (path) username jillsmith.
 * @apiRequestExample <204> Set state of locked
 * @apiResponseExample <204> State of locked set
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
    await user.setLocked(data.locked || false);
  }

  catch (ex) {
    throw new HttpError(400, { title: ex.message, data: `Unable to set 'locked' for the user ${username}` });
  }
}
doPut.auth = ['WRITE_USERS'];


apimodule.exports = { doGet, doPut };