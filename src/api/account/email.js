/* eslint-env omega/api */
// API file: email
// Source File: src/api/account/email.js
// Generated on: 7/19/2019, 10:34:33 AM
const path = require('path').posix;

/**
 * @api {get} /api/account/email Get user.email
 * @apiGroup Users
 * @apiDescription Get the 'email' for the specified user
 * @apiPermissions (role) 'READ_USERS'
 * @apiParam (path) username username of the user to read.
 * @apiRequestValue <200> (path) username johnsloan.
 * @apiRequestExample <200> Get email
 * @apiResponseExample <200> Value of the email
 * {
 *   email: "someone@example.com"
 * }
 */
async function doGet({ req }) { // eslint-disable-line no-unused-vars
  const { username } = req.user;
  const ds = req.dirService;
  const { email } = await ds.getUser(username);
  return { email };
}
doGet.loggedIn = true;

/**
 * @api {put} /api/account/email Set user.email
 * @apiGroup Users
 * @apiDescription Set the state of 'email' for the specified user
 * @apiPermissions (role) 'WRITE_USERS'
 * @apiParam (path) username username of the user to affect.
 * @apiRequestValue <204> (path) username jillsmith.
 * @apiRequestExample <204> Set state of email
 * @apiResponseExample <204>
 */
async function doPut({ data, req }) { // eslint-disable-line no-unused-vars
  const { username, id: requestor } = req.user;
  const ds = req.dirService;
  let user = await ds.getUser(username);

  try {
    await user.setEmail(requestor, data.email);
  }

  catch (ex) {
    throw new HttpError(400, { title: ex.message, data: `Unable to set 'email' for the user ${username}` });
  }
}
doPut.loggedIn = true;


apimodule.exports = { doGet, doPut };
