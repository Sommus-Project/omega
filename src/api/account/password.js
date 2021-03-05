/* eslint-env omega/api */

/**
 * @api {put} /api/account/password Set user password
 * @apiGroup Account
 * @apiDescription Set logged in user password
 * @apiPermissions (user)
 * @apiParam (body) newPassword the new password for the loggin in user.
 * @apiParam (body) existingPassword the existing password of the loggin in user.
 * @apiRequestExample <204> Change user password
 * @apiResponseExample <204> User password changed
 */
async function doPut({ data, req }) {
  const { username, id: requestor } = req.user;
  const { newPassword, existingPassword } = data;
  console.log(data);
  if (Object.keys(data).length !== 2 || !newPassword || !existingPassword) {
    req.usageLog.info(`User ${username} send invalid parameters`);
    return new HttpError(400, 'Invalid parameters sent.');
  }

  const ds = req.dirService;
  const user = await ds.getUser(username);
  req.usageLog.info(`User ${username} changing their own password`);
  const resp = await user.setPassword(requestor, newPassword, existingPassword);
  console.log(resp);
}
doPut.loggedIn = true;

apimodule.exports = { doPut };
