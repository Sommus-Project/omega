/* eslint-env omega/api */
// API file: groups
// Source File: src/api/groups.js
// Generated on: 7/19/2019, 11:41:11 AM
const getRanges = require('./getRanges');
const EntityCreated = require('./EntityCreated');
//*****************************
// API Functions
//
/**
 * @apiDefineGroup (Groups) /api/groups
 * FIXME: Add a description here
 * FIXME: Add any common properties here
 */


/**
 * @api {get} /api/groups Get groups
 * @apiGroup Groups
 * @apiDescription FIXME Description
 * @apiPermissions (role) FIXME 'READ_GROUPS'
 *
 * @apiRequestExample <200> FIXME Success Request Title
 * @apiResponseExample <200> FIXME Success Reponse Title
 * {
 *   FIXME RESPONSE
 * }
 *
 * @apiRequestExample <404> FIXME 404 Request Title
 * @apiResponseValue <404> (header) X-No-Entity FIXME /api/groups
 * @apiResponseExample <404> FIXME 404 Response Title
 * {
 *   "error": true,
 *   "title": "FIXME",
 *   "status": 404,
 *   "message": "Not Found",
 *   "url": "FIXME /api/groups"
 * }
 */
async function doGet({ req }) { // eslint-disable-line no-unused-vars
  const ds = req.dirService;
  const groups = await ds.getGroups(getRanges(req.query));
  return groups;
}
doGet.auth = ['READ_GROUPS'];

/**
 * @api {post} /api/groups Save new groups
 * @apiGroup Groups
 * @apiDescription FIXME Description
 * @apiPermissions (role) FIXME 'WRITE_GROUPS'
 *
 * @apiRequestExample <201> FIXME Success Request Title
 * @apiResponseValue <201> (header) Location FIXME /api/groups
 * @apiResponseExample <201> FIXME Success Reponse Title
 *
 * @apiRequestExample <404> FIXME 404 Request Title
 * @apiResponseValue <404> (header) X-No-Entity FIXME /api/groups
 * @apiResponseExample <404> FIXME 404 Response Title
 * {
 *   "error": true,
 *   "title": "FIXME",
 *   "status": 404,
 *   "message": "Not Found",
 *   "url": "FIXME /api/groups"
 * }
 */
async function doPost({ data, req }) { // eslint-disable-line no-unused-vars
  const { name, description, users } = data;
  const { id: requestor } = req.user;

  if (typeof name !== 'string' || !name) {
    throw new HttpError(400, 'You must provide a group "name".');
  }
  if (typeof description !== 'string' || !description) {
    throw new HttpError(400, 'You must provide a group "description".');
  }
  if (users != null && !Array.isArray(users)) {
    throw new HttpError(400, '"users" must be null or an array of usernames.');
  }

  const ds = req.dirService;

  try {
    const newGroup = await ds.createGroup(requestor, name, description, users);
    return new EntityCreated(`${req.path}/${name}`, newGroup);
  }

  catch (ex) {
    if (ex.additional) {
      throw new HttpError(400, ex.additional);
    }

    throw ex;
  }
}
doPost.auth = ['WRITE_GROUPS'];
/*
Types are
'bool'
'number'
'string'
['bool'|'number'|'string']
{
  <fieldname>: {
    type: '<type>',
    length: <number>,
    optional: true|false
  },
  ...
}
*/
doPost.params = {
  name: {
    type: 'string',
    length: 255
  },
  description: {
    type: 'string',
    length: 255
  },
  users: {
    type: ['number'],
    optional: true
  }
}


apimodule.exports = { doGet, doPost };
