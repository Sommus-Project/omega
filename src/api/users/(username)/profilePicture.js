/* eslint-env omega/api */
// API file: profilePicture
// Source File: src/api/users/(username)/profilePicture.js
// Generated on: 7/19/2019, 10:34:33 AM
const path = require('path').posix;

/**
 * @api {get} /api/users/:username/profilePicture Get user.profilePicture
 * @apiGroup Users
 * @apiDescription Get the 'profilePicture' for the specified user
 * @apiPermissions (role) 'READ_USERS'
 * @apiParam (path) username username of the user to read.
 * @apiRequestValue <200> (path) username johnsloan.
 * @apiRequestExample <200> Get profilePicture
 * @apiResponseExample <200> Value of the profilePicture
 * {
 *   "profilePicture": "https://www.something/someimg.jpg"
 * }
 */
async function doGet({ username, req }) {
  const { domain } = req.user;
  const ds = req.dirService(domain);

  try {
    const { profilePicture } = await ds.getUser(username);
    return { profilePicture };
  }

  catch (ex) {
    throw404(path.dirname(req.path), ex.message);
  }
}
doGet.auth = ['READ_USERS'];

/**
 * @api {put} /api/users/:username/profilePicture Set user.profilePicture
 * @apiGroup Users
 * @apiDescription Set the state of 'profilePicture' for the specified user
 * @apiPermissions (role) 'WRITE_USERS'
 * @apiParam (path) username username of the user to affect.
 * @apiRequestValue <204> (path) username jillsmith.
 * @apiRequestExample <204> Set state of profilePicture
 * @apiResponseExample <204>
 */
async function doPut({ username, data, req }) {
  const { domain, id: requestor } = req.user;
  const ds = req.dirService(domain);
  let user;
  try {
    user = await ds.getUser(username);
  }

  catch (ex) {
    throw404(path.dirname(req.path), ex.message);
  }

  try {
    console.log(`----------------- Setting the profilePicture on the user`);
    console.log(data.profilePicture);
    await user.setProfilePicture(requestor, data.profilePicture);
  }

  catch (ex) {
    throw new HttpError(400, { title: ex.message, data: `Unable to set 'profilePicture' for the user ${username}` });
  }
}
doPut.auth = ['WRITE_USERS'];

apimodule.exports = { doGet, doPut };
