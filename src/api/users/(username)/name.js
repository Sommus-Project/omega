/* eslint-env omega/api */
// API file: name
// Source File: src/api/users/(username)/name.js
// Generated on: 7/19/2019, 10:34:33 AM
const path = require('path').posix;

/**
 * @api {get} /api/users/:username/name Get user.name
 * @apiGroup Users
 * @apiDescription Get the 'name' for the specified user
 * @apiPermissions (role) 'user-edit'
 * @apiParam (path) username username of the user to read.
 * @apiRequestValue <200> (path) username johnsloan.
 * @apiRequestExample <200> Get name
 * @apiResponseExample <200> State of name
 * {
 *   name: true
 * }
 */
async function doGet({ username, req }) { // eslint-disable-line no-unused-vars
  const { provider } = req.user;
  const ds = req.dirService(provider);

  try {
    const user = await ds.getUser(username);
    return {name: user.name};
  }

  catch (ex) {
    throw404(path.dirname(req.path), ex.message);
  }
}
doGet.auth = ['user-edit'];

/**
 * @api {put} /api/users/:username/name Set user.name
 * @apiGroup Users
 * @apiDescription Set the state of 'name' for the specified user
 * @apiPermissions (role) 'user-edit'
 * @apiParam (path) username username of the user to affect.
 * @apiRequestValue <204> (path) username jillsmith.
 * @apiRequestExample <204> Set state of name
 * @apiResponseExample <204> State of name set
 */
async function doPut({ username, data, req }) { // eslint-disable-line no-unused-vars
  const { provider } = req.user;
  const ds = req.dirService(provider);
  let user;
  try {
    user = await ds.getUser(username);
  }

  catch(ex) {
    throw404(path.dirname(req.path), ex.message);
  }

  try {
    await user.setName(data.name);
  }

  catch (ex) {
    throw new HttpError(400, { title: ex.message, data: `Unable to set 'name' for the user ${username}` });
  }
}
doPut.auth = ['user-edit'];


apimodule.exports = { doGet, doPut };
