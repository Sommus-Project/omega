/* eslint-env omega/api */
// API file: users
// Source File: src/api/groups/(groupName)/users.js
// Generated on: 7/19/2019, 11:41:28 AM
const getRanges = require('./getRanges');
const path = require('path');
const InvalidActionError = require('./directoryService/errors/InvalidActionError');

//*****************************
// API Functions
//
/**
 * @api {get} /api/groups/:groupName/users Get users
 * @apiGroup Groups
 * @apiDescription FIXME Description
 * @apiPermissions (role) FIXME 'conf-read'
 * @apiParam (path) groupName FIXME Param description.
 * @apiRequestValue <200> (path) groupName FIXME Value.
 * @apiRequestExample <200> FIXME Success Request Title
 * @apiResponseExample <200> FIXME Success Reponse Title
 * {
 *   FIXME RESPONSE
 * }
 */
async function doGet({ groupName, req }) { // eslint-disable-line no-unused-vars
  const { domain } = req.user;
  const ds = req.dirService(domain);

  const users = await ds.getGroupUsers(groupName, getRanges(req.query));
  if (users) {
    return users;
  }

  throw404(path.dirname(req.path), `The group "${groupName}" does not exist.`);
}
doGet.auth = ['group-edit'];

/**
 * @api {put} /api/groups/:groupName/users Set users for the group
 * @apiGroup Groups
 * @apiDescription Set users for the group
 * @apiPermissions (role) 'group-edit'
 * @apiParam (path) groupName FIXME Param description.
 * @apiRequestValue <201> (path) groupName FIXME Value.
 * @apiRequestExample <201> FIXME Success Request Title
 * @apiResponseValue <201> (header) Location FIXME /api/groups/:groupName/users
 * @apiResponseExample <201> FIXME Success Reponse Title
 */
async function doPut({ groupName, data, req }) { // eslint-disable-line no-unused-vars
  const { domain } = req.user;
  const ds = req.dirService(domain);
  const { users } = data;

  if (!Array.isArray(users)) {
    throw new HttpError(400, '"users" must be passed in as an array');
  }

  try {
    await ds.setUsersForGroup(groupName, users);
  }

  catch (ex) {
    // If the group was not found then just return
    if (ex.message === 'NOT_FOUND' || ex.message === 'INVALID_GROUP' || ex.code === 32) {
      throw404(path.dirname(req.path), ex.additional);
    }

    if (ex instanceof InvalidActionError) {
      throw new HttpError(403, ex.additional);
    }
    else {
      throw ex;
    }
  }
}
doPut.auth = ['group-edit'];

apimodule.exports = { doGet, doPut };