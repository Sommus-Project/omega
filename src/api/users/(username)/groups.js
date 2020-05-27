/* eslint-env omega/api */
// API file: groups
// Source File: src/api/users/(username)/groups.js
// Generated on: 7/19/2019, 10:34:33 AM
const path = require('path').posix;

/**
 * @api {get} /api/users/:username/groups Get user.groups
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
 */
async function doGet({ username, req }) { // eslint-disable-line no-unused-vars
  const { provider } = req.user;
  const ds = req.dirService(provider);
  let user;
  try {
    user = await ds.getUser(username);
  }

  catch (ex) {
    throw404(path.dirname(req.path), ex.message);
  }

  return user.groups;
}
doGet.auth = ['user-edit'];

/**
 * @api {put} /api/users/:username/groups Set user.groups
 * @apiGroup Users
 * @apiDescription FIXME Description
 * @apiPermissions (role) FIXME 'conf-read'
 * @apiParam (path) username FIXME Param description.
 * @apiRequestValue <201> (path) username FIXME Value.
 * @apiRequestExample <201> FIXME Success Request Title
 * @apiResponseValue <201> (header) Location FIXME /api/users/:username/groups
 * @apiResponseExample <201> FIXME Success Reponse Title
 */
async function doPut({ username, data, req }) { // eslint-disable-line no-unused-vars
  if (!data || !Array.isArray(data.groups) || data.groups.some(g => typeof g != 'string')) {
    throw new HttpError(400, { title: 'Groups must be an array of strings.' });
  }

  const { provider } = req.user;
  const ds = req.dirService(provider);
  let user;
  try {
    user = await ds.getUser(username);
  }

  catch (ex) {
    throw404(path.dirname(req.path), ex.message);
  }

  try {
    await user.setGroups(data.groups);
  }

  catch (ex) {
    throw new HttpError(400, { title: ex.message, data: { badGroup: ex.additional } });
  }
}
doPut.auth = ['user-edit'];

apimodule.exports = { doGet, doPut };