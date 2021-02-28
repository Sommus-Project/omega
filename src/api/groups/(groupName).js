/* eslint-env omega/api */
// API file: (groupName)
// Source File: src/api/groups/(groupName).js
// Generated on: 7/19/2019, 11:41:21 AM
const InvalidActionError = require('./directoryService/errors/InvalidActionError');

//*****************************
// API Functions
//
/**
 * @api {get} /api/groups/:groupName Get (groupName)
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
  const group = await ds.getGroup(groupName);
  if (group) {
    return group;
  }

  throw404(req.path, `The group "${groupName}" does not exist.`);
}
doGet.auth = ['READ_GROUPS'];

/**
 * @api {delete} /api/groups/:groupName Delete (groupName)
 * @apiGroup Groups
 * @apiDescription FIXME Description
 * @apiPermissions (role) FIXME 'conf-read'
 * @apiParam (path) groupName FIXME Param description.
 * @apiRequestValue <204> (path) groupName FIXME Value.
 * @apiRequestExample <204> FIXME Success Request Title
 * @apiResponseExample <204> FIXME Success Reponse Title
 */
async function doDelete({ groupName, req }) { // eslint-disable-line no-unused-vars
  const { domain } = req.user;
  const ds = req.dirService(domain);
  try {
    await ds.deleteGroup(groupName);
  }

  catch (ex) {
    // If the group was not found then just return
    if (ex.message === 'NOT_FOUND' || ex.code === 32) {
      return;
    }

    if (ex instanceof InvalidActionError) {
      throw new HttpError(403, ex.additional);
    }
    else {
      throw ex;
    }
  }
}
doDelete.auth = ['DELETE_GROUPS'];

apimodule.exports = { doGet, doDelete };