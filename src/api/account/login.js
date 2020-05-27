/* eslint-env omega/api */

const SESSION_COOKIE = require('./SESSION_COOKIE');

//*****************************
// API Functions
//
/**
 * @apiDefineGroup (Account) /api/account
 * Functionality to log a user in and out, find out information about the logged in user,
 * their account and session; and ability to change account properties
 */

/**
 * @api {post} /api/account/login Log user in
 * @apiGroup Account
 * @apiDescription Log a user in by calling `DirectoryService.authenticate`
 * * If successful call `SessionManger.createSession` to create a new session
 * for the logged in user. Respond with a cookie that uses this session id.
 * * If the user entered the wrong `username` or `password`, or if the user account
 * is `locked` or `disabled` then respond with an HTTP 401.
 * @apiPermissions (none)
 * @apiParam (body) username the username of the user loggin in.
 * @apiParam (body) password the password of the user loggin in.
 * @apiParam (body) [provider="default"] the provider of the user loggin in.
 * @apiRequestExample <200> Logged in
 * {
 *   "username": "dogbert",
 *   "password": "WalleyIsMyFriend123$"
 * }
 * @apiResponseExample <200> User object for logged in user
 * {
 *   "username": "dogbert",
 *   "locked": true,
 *   "name": "Dogbert the Dog"
 *   ...
 * }
 * @apiRequestExample <401> Invalid username or password
 * {
 *   "username": "dogbert",
 *   "password": "<badpassword>"
 * }
 * @apiResponseExample <401> Invalid credentials error object.
 * {
 *   "error": true,
 *   "title": "Server Error",
 *   "status": 401,
 *   "message": "Unauthorized",
 *   "url": "/api/account/login",
 *   "data": {
 *     "code": 49,
 *     "subCode": "INVALID_CREDENTIALS",
 *     "reason": "Invalid credentials during a bind operation."
 *   }
 * }
 */
async function doPost({ data, req }) { // eslint-disable-line no-unused-vars
  // TODO: If logged in then clear previous session
  const { username, password, provider = 'default' } = data;
  const ds = req.dirService(provider);
  try {
    await ds.authenticate(username, password);
    req.usageLog.info(`User ${username} logged in.`);
    const sessionId = await req.sessionManager.createSession(username, provider);
    const headers = {
      'set-cookie': `${SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; Secure;`
    };

    const thereIsANextStep = false;
    if (thereIsANextStep) {
      const step = 'Do the next step';
      headers['X-Next-Step'] = step;
      return new HttpError(401, {
        data: { code: 0, reason: step },
        headers
      });
    }

    const user = await ds.getUser(username);
    return new HttpResponse(headers, user);
  }

  catch (ex) {
    req.usageLog.info(`User ${username} failed to log in.`);
    if (ex instanceof ReferenceError) {
      req.usageLog.info(`500 Error - ${ex.message}`);
      return new HttpError(500, ex.message);
    }

    req.usageLog.info(`401 Error - ${ex.subCode}:${ex.message}`);
    return new HttpError(401, {
      data: {
        code: ex.code,
        subCode: ex.subCode,
        reason: ex.message
      }
    });
  }
}
doPost.description = {
  apiGroup: 'Account',
  label: 'Log user in',
  description: `Log a user in by calling \`DirectoryService.authenticate\`.
If successful call \`SessionManger.createSession\` to create a new session for the logged in user.Respond with a cookie that uses this session id.
If the user entered the wrong \`username\` or \`password\`, or if the user account is \`locked\` or \`disabled\` then respond with an HTTP 401.`,
  requestParams: {
    body: [
      {
        name: 'username',
        type: 'string',
        description: 'The username of the user loggin in',
        required: true
      },
      {
        name: 'password',
        type: 'string',
        description: 'The password of the user loggin in',
        required: true
      },
      {
        name: 'provider',
        type: 'string',
        defaultValue: 'default',
        description: 'The provider of the user loggin in'
      }
    ]
  },
  responseCodes: [200, 401],
  examples: {
    200: {
      request: {
        title: 'Log in',
        data: {
          body: {
            "username": "dogbert",
            "password": "WalleyIsMyFriend123$"
          }
        }
      },
      response: {
        title: 'User object for logged in user',
        data: {
          body: {
            "username": "dogbert",
            "locked": true,
            "name": "Dogbert the Dog",
            "...": "..."
          },
          headers: {
            "set-cookie": "sessionid=js93jajdhfh38mnap93ancnaowzmgoa; Path=/; HttpOnly; Secure;"
          }
        }
      }
    },
    401: {
      request: {
        title: 'Invalid username or password',
        data: {
          body: {
            "username": "dogbert",
            "password": "<badpassword>"
          }
        }
      },
      response: {
        title: 'Invalid credentials error object',
        data: {
          body: {
            "error": true,
            "title": "Server Error",
            "status": 401,
            "message": "Unauthorized",
            "url": "/api/account/login",
            "data": {
              "code": 49,
              "subCode": "INVALID_CREDENTIALS",
              "reason": "Invalid credentials during a bind operation."
            }
          }
        }
      }
    }
  }
}

apimodule.exports = { doPost };
