/* eslint-env omega/api */
const VALID_USERNAME = /^.+$/i;

/**
 * @api {put} /api/account/name Set user name
 * @apiGroup Account
 * @apiDescription Set the name for the logged in user.
 * * This is done by calling `User.setName` of the user object that was obtained from `DirectoryService` for the logged in user.
 * @apiPermissions (user)
 * @apiParam (body) name the new name of the loggin in user.
 * @apiRequestValue <204> (cookie) session "valid session id"
 * @apiRequestExample <204> Change user name
 * {
 *   "name": "Iron Man"
 * }
 * @apiResponseExample <204> User name changed
 */
async function doPut({ data, req }) {
  const { name } = data;
  const { username, provider } = req.user;
  if (Object.keys(data).length !== 1 || !VALID_USERNAME.test(name)) {
    req.usageLog.info(`User ${username} send invalid parameters`);
    return new HttpError(400, 'Invalid parameters sent.');
  }

  const ds = req.dirService(provider);
  const user = ds.getUser(username);
  req.usageLog.info(`User ${username} changing their name to ${name}`);
  await user.setName(name);
}
doPut.loggedIn = true;

apimodule.exports = { doPut };