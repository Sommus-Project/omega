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
  const ranges = getRanges(req.query);
  const { provider } = req.user;
  const ds = req.dirService(provider);
  const resp = await ds.getUsers(ranges);
  return resp;
}
//doGet.auth = ['user-edit'];

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
  const { provider, id: requestor } = req.user;
  console.log(`requestor[${requestor}]`);
  const ds = req.dirService(provider);
  const { username = '', firstname = '', lastname = '', address1 = '', address2 = '', city = '', state = '', zip = '', country = '', email = '', password = '', groups = [] } = data;

  const errors = [];
  if (!username) {
    errors.push('"username" must be provided.');
  }
  if (!firstname) {
    errors.push('"firstname" must be provided.');
  }
  if (!lastname) {
    errors.push('"lastname" must be provided.');
  }
  if (!address1) {
    errors.push('"address1" must be provided.');
  }
  if (!city) {
    errors.push('"city" must be provided.');
  }
  if (!state) {
    errors.push('"state" must be provided.');
  }
  if (!zip) {
    errors.push('"zip" must be provided.');
  }
  if (!country) {
    errors.push('"country" must be provided.');
  }
  if (!email) {
    errors.push('"email" must be provided.');
  }
  if (!password) {
    errors.push('"password" must be provided.');
  }
  if (!groups) {
    errors.push('"groups" must be provided.');
  }

  if (errors.length > 0) {
    const options = {
      data: { errors },
      title: 'Invalid Parameters'
    }
    return new HttpError(400, options);
  }

  try {
    const newUserData = {
      username,
      firstname,
      lastname,
      address1,
      address2,
      city,
      state,
      zip,
      country,
      email,
      password,
      groups
    };
    await ds.createUser(requestor, newUserData, true);
    const newUser = await ds.getUser(username);
    return new EntityCreated(`${req.path}/${username}`, newUser);
  }

  catch (ex) {
    const options = {
      data: { code: ex.code, subCode: ex.subCode },
      title: ex.message
    }
    return new HttpError(400, options);
  }
}
//doPost.auth = ['user-edit'];

apimodule.exports = { doGet, doPost };
