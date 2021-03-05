/* eslint-env omega/api */
// API file: address
// Source File: src/api/users/(username)/address.js
// Generated on: 7/19/2019, 10:34:33 AM
const path = require('path').posix;

/**
 * @api {get} /api/users/:username/address Get user.address
 * @apiGroup Users
 * @apiDescription Get the 'address' for the specified user
 * @apiPermissions (role) 'READ_USERS'
 * @apiParam (path) username username of the user to read.
 * @apiRequestValue <200> (path) username johnsloan.
 * @apiRequestExample <200> Get address
 * @apiResponseExample <200> Value of the address
 * {
 *   "address1": "5 Avenue Anatole France",
 *   "address2": "",
 *   "city": "Paris",
 *   "state": "",
 *   "zip": "75005",
 *   "country": "France",
 *   "lat": "48.85817191352806",
 *   "lng": "2.2945088277244645",
 * }
 */
async function doGet({ username, req }) {
  const ds = req.dirService;

  try {
    return (await ds.getUser(username)).address;
  }

  catch (ex) {
    throw404(path.dirname(req.path), ex.message);
  }
}
doGet.auth = ['READ_USERS'];

/**
 * @api {put} /api/users/:username/address Set user.address
 * @apiGroup Users
 * @apiDescription Set the state of 'address' for the specified user
 * @apiPermissions (role) 'WRITE_USERS'
 * @apiParam (path) username username of the user to affect.
 * @apiRequestValue <204> (path) username jillsmith.
 * @apiRequestExample <204> Set state of address
 * @apiResponseExample <204>
 */
async function doPut({ username, data, req }) { // eslint-disable-line no-unused-vars
  const { id: requestor } = req.user;
  const ds = req.dirService;
  let user;
  try {
    user = await ds.getUser(username);
  }

  catch (ex) {
    throw404(path.dirname(req.path), ex.message);
  }

  try {
    await user.setAddress(requestor, data);
  }

  catch (ex) {
    throw new HttpError(400, { title: ex.message, data: `Unable to set 'address' for the user ${username}` });
  }
}
doPut.auth = ['WRITE_USERS'];


apimodule.exports = { doGet, doPut };
