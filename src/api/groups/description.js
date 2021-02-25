/* eslint-env omega/api */
const path = require('path');

//*****************************
// API Functions
//
/**
 * @api {get} /api/groups/:groupName/description Get group description
 * @apiGroup Groups
 * @apiDescription Get the description for a specific group
 * @apiPermissions (role) 'group-edit'
 *
 * @apiRequestExample <200> FIXME Success Request Title
 * @apiResponseExample <200> FIXME Success Reponse Title
 * {
 *   FIXME RESPONSE
 * }
 */
async function doGet({ groupName, req }) {
  const { domain } = req.user;
  const ds = req.dirService(domain);
  const group = await ds.getGroup(groupName);
  if (!group) {
    throw404(path.pathname(req.path), 'Group not found');
  }

  return { description: group.description };
}
doGet.auth = ['group-edit'];

/**
 * @api {put} /api/groups/:groupName/description Set group description
 * @apiGroup Groups
 * @apiDescription Set the description for a specific group
 * @apiPermissions (role) 'group-edit'
 *
 * @apiRequestExample <201> FIXME Success Request Title
 * @apiResponseValue <201> (header) Location FIXME /api/groups
 * @apiResponseExample <201> FIXME Success Reponse Title
 */
async function doPut({ groupName, data, req }) { // eslint-disable-line no-unused-vars
  const { description } = data;
  if (typeof description !== 'string' || !description) {
    throw new HttpError(400, 'You must provide a group "description".');
  }

  const { domain } = req.user;
  const ds = req.dirService(domain);
  const group = await ds.getGroup(groupName);
  if (!group) {
    throw404(path.pathname(req.path), 'Group not found');
  }

  await ds.setGroupDescription(groupName, description);
}
doPut.auth = ['group-edit'];

apimodule.exports = { doGet, doPut };