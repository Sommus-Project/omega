/* eslint-env omega/api */
// API file: users
// Source File: src/api/users.js
// Generated on: 7/19/2019, 10:34:05 AM
const EntityCreated = require('./EntityCreated');
const getRanges = require('./getRanges');

//*****************************
// API Functions
//
/**
 * @apiDefineGroup (Users) /api/users
 * User management. Connections through LDAP or other directory service systems.
 */

/**
 * @api {get} /api/users Get the list of users
 * @apiGroup Users
 * @apiDescription Get a list of users on this system based on the users provider/domain
 * @apiPermissions (role) 'user-edit'
 *
 * @apiRequestExample <200> Get list of users
 * @apiResponseExample <200> List of users
 * [
 *   {
 *     "username": "user1",
 *     "name": "User One",
 *     "disabled": false,
 *     "locked": false,
 *     ...
 *   },
 *   {
 *     "username": "anotheruser",
 *     "name": "Frank N Stein",
 *     "disabled": true,
 *     "locked": false,
 *     ...
 *   }
 *   ...
 * ]
 */
async function doGet({ req }) { // eslint-disable-line no-unused-vars
  const { provider } = req.user;
  const ds = req.dirService(provider);
  const resp = await ds.getUsers(getRanges(req.query));

  //if (req.query.dev !== 'deep') {
  resp.users = resp.users.map(user => ({
    disabled: user.disabled,
    locked: user.locked,
    modifiable: user.modifiable,
    name: user.name,
    passwordExpired: user.passwordExpired,
    provider,
    removable: user.removable,
    username: user.username
  }));
  //}

  return resp;
}
doGet.auth = ['user-edit'];

/**
 * @api {post} /api/users Create a new user
 * @apiGroup Users
 * @apiDescription Create a new user within the same provider/domain as the current user
 * @apiPermissions (role) 'user-edit'
 *
 * @apiRequestExample <201> Create a new user
 * {
 *   "username": "newuser",
 *   "name": "Paul Bunion",
 *   "password": "Lk*7yHH#^2LoWPO",
 *   "groups": [
 *     "searchappliance_search",
 *     "searchappliance_system"
 *   ]
 * }
 * @apiResponseValue <201> (header) Location /api/users/newuser
 * @apiResponseExample <201> User created
 * {
 *   "username": "newuser",
 *   "name": "Paul Bunion",
 *   "disabled": false,
 *   "locked": false,
 *   ...
 * }
 */
async function doPost({ data, req }) { // eslint-disable-line no-unused-vars
  const { provider } = req.user;
  const ds = req.dirService(provider);
  const { username, name, password, groups } = data;
  try {
    await ds.createUser(username, name, password, groups);
    return new EntityCreated(`${req.path}/${username}`, await ds.getUser(username));
  }

  catch (ex) {
    const options = {
      data: { code: ex.code, subCode: ex.subCode },
      title: ex.message
    }
    return new HttpError(400, options);
  }
}
doPost.auth = ['user-edit'];

apimodule.exports = { doGet, doPost };
