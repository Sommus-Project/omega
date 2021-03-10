/* eslint-env omega/api */
async function doGet({ req }) {
  const { username } = req.user;
  const ds = req.dirService;
  const { profilePicture } = await ds.getUser(username);
  return { profilePicture };
}
doGet.loggedIn = true;

async function doPut({ data, req }) {
  const { username, id: requestor } = req.user;
  const ds = req.dirService;
  let user = await ds.getUser(username);

  try {
    await user.setProfilePicture(requestor, data.profilePicture);
  }

  catch (ex) {
    throw new HttpError(400, { title: ex.message, data: `Unable to set 'profilePicture' for the user ${username}` });
  }
}
doPut.loggedIn = true;

apimodule.exports = { doGet, doPut };
