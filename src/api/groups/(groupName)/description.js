/* eslint-env omega/api */
const path = require('path');

//*****************************
// API Functions
//
/**
 * @api {get} /api/groups/:groupName/description Get group description
 * @apiGroup Groups
 * @apiDescription Get the description for a specific group
 * @apiPermissions (role) 'READ_GROUPS'
 *
 * @apiRequestExample <200> FIXME Success Request Title
 * @apiResponseExample <200> FIXME Success Reponse Title
 * {
 *   FIXME RESPONSE
 * }
 */
async function doGet({ groupName, req }) {
  console.log({ groupName });
  const { domain } = req.user;
  console.log({ domain });
  const ds = req.dirService(domain);
  const group = await ds.getGroup(groupName);
  console.log({ group });
  if (!group) {
    throw404(path.dirname(req.path), 'Group not found');
  }

  return { description: group.description };
}
doGet.auth = ['READ_GROUPS'];

/**
 * @api {put} /api/groups/:groupName/description Set group description
 * @apiGroup Groups
 * @apiDescription Set the description for a specific group
 * @apiPermissions (role) 'WRITE_GROUPS'
 *
 * @apiRequestExample <201> FIXME Success Request Title
 * @apiResponseValue <201> (header) Location FIXME /api/groups
 * @apiResponseExample <201> FIXME Success Reponse Title
 */
async function doPut({ groupName, data, req }) { // eslint-disable-line no-unused-vars
  const { description } = data;
  const { id: requestor } = req.user;
  if (typeof description !== 'string' || !description) {
    throw new HttpError(400, 'You must provide a group "description".');
  }

  const { domain } = req.user;
  const ds = req.dirService(domain);
  try {  
    await ds.setGroupDescription(requestor, groupName, description);
  }

  catch(ex) {
    if (ex.message === 'NOT_FOUND') {
      throw404(path.dirname(req.path), 'Group not found');
    }

    console.error(ex.stack);
    throw new HttpError(500, ex.message);
  }
}
doPut.auth = ['WRITE_GROUPS'];
doPut.params = {
  groupName: {
    type: 'string',
    length: 255
  },
  description: {
    type: 'string',
    length: 255
  }
}

apimodule.exports = { doGet, doPut };