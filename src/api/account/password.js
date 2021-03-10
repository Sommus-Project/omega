/* eslint-env omega/api */
const ONLY_ONE_SESSION_PER_USER = process.env.ONLY_ONE_SESSION_PER_USER === 'true';

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
  if (Object.keys(data).length !== 2 || !newPassword || !existingPassword) {
    req.usageLog.info(`User ${username} send invalid parameters`);
    return new HttpError(400, 'Invalid parameters sent.');
  }

  const ds = req.dirService;
  const user = await ds.getUser(username);
  req.usageLog.info(`User ${username} changing their own password`);
  await user.setPassword(requestor, newPassword, existingPassword);
  const sessionId = await ds.createSession(username, ONLY_ONE_SESSION_PER_USER);
  const { SESSION_COOKIE } = req;
  const headers = {
    'set-cookie': `${SESSION_COOKIE}=${sessionId}; Path=/; SameSite=Strict; HttpOnly; Secure;`
  };

  user.setLastLogin(user.id);
  return new HttpResponse(headers);
}
doPut.loggedIn = true;

apimodule.exports = { doPut };
