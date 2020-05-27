const CACHE_DURATION = 1000 * 60 * 2; // Two minute cache duration;
const { GROUP_ROLES } = require('./roles');
const { xml2json } = require('xml2json-light');
const { getUserId } = require('../model/user/userAndGroupId');
const tempUserCache = {};

function clearCache () {
  const now = Date.now();

  Object.entries(tempUserCache).forEach(
    ([key, val]) => {
      if (val.time < now) {
        delete tempUserCache[key];
      }
    }
  );
}

const interval = setInterval(clearCache, 1000 * 30); // Start our cache cleaning routine.

function getRolesFromGroups (groups) {
  return Object.keys(groups.reduce((listOfRoles, group) => {
    if (group.substr(0, 16) === 'searchappliance_') {
      const newRoles = GROUP_ROLES[group.replace('searchappliance_', '')] || [];
      newRoles.forEach(
        newRole => {
          listOfRoles[newRole] = 1;
        }
      );
    }
    return listOfRoles;
  }, {})).sort();
}

function assignUser (user, userData) {
  // Protect Properties: Make them read only
  Object.defineProperties(user, {
    username: { enumerable: true, value: userData.username },
    name: { enumerable: true, value: userData.name },
    provider: { enumerable: true, value: userData.provider },
    groups: { enumerable: true, value: userData.groups },
    roles: { enumerable: true, value: userData.roles },
    dbid: { enumerable: true, value: userData.dbid },
    uuid: { enumerable: true, value: userData.uuid }
  });
}

class User {
  constructor () {
    this.groups = [];
    this.roles = [];
  }

  init (req, token) {
    const newUserData = {
      username: null,
      name: null,
      provider: null,
      groups: [],
      roles: [],
      dbid: null,
      uuid: null
    };

    if (!token) {
      assignUser(this, newUserData);
      return Promise.resolve(false);
    }

    // Try to get user from cache
    const cachedUser = tempUserCache[token];
    if (cachedUser) {
      return cachedUser.promise.then((userData) => assignUser(this, userData));
    }

    Object.defineProperty(this, '_token', { enumerable: false, value: token });
    const db = req.db && req.db.mysql;

    const returnPromise = req.rest.get(`${req.getServerStr('admin_portal_ui')}/appliance/profile`).send().then(
      userData => {
        if (userData.ok) {
          const { user } = xml2json(userData.body);

          newUserData.username = user.username;
          newUserData.name = user.name;
          newUserData.provider = user.provider;

          const promises = [];
          promises[0] = req.rest.get(`${req.getServerStr('admin_portal_ui')}/appliance/profile/groups`).send().then(
            groupData => {
              let userGroups = [];

              if (groupData && groupData.ok) {
                let { groups } = xml2json(groupData.body);
                if (!groups || !groups.group) {
                  groups = { group: [] };
                }

                userGroups = ((Array.isArray(groups.group)) ? groups.group : [groups.group]).sort();
              }

              newUserData.groups = userGroups;
              newUserData.roles = getRolesFromGroups(userGroups);
            }
          );

          if (db) {
            promises[1] = getUserId(db, newUserData.username, newUserData.provider).then(
              info => {
                newUserData.dbid = info.id;
                newUserData.uuid = info.uuid;
              }
            ).catch(
              err => {
                newUserData.dbid = null;
                newUserData.uuid = null;
                console.error('Unable to get used id from database:', err.stack);
              }
            );
          }

          return Promise.all(promises).then(() => {
            assignUser(this, newUserData);
            return newUserData;
          });
        }

        if (userData.status !== 419) {
          console.error(`Error(${userData.status}): Unable to initialize the 'user' object. Possible server error.`);
        }

        delete tempUserCache[token];
        return false;
      }
    ).catch(
      ex => {
        console.error(`${ex} - Unable to initialize the 'user' object. Probable server error.\n${ex.stack}`);
        delete tempUserCache[token];
        return false;
      }
    );

    // Add to cache
    tempUserCache[token] = {
      promise: returnPromise,
      time: Date.now() + CACHE_DURATION
    };

    return returnPromise;
  }

  get loggedIn () {
    return !!this.username;
  }

  inGroup (group) {
    return this.groups.includes(group);
  }

  inRole (chkRoles) {
    if (!Array.isArray(chkRoles)) {
      chkRoles = [chkRoles]; // eslint-disable-line no-param-reassign
    }

    return chkRoles.some(role => this.roles.includes(role));
  }

  invalidate () {
    delete tempUserCache[this._token];
  }

  isUser (username, provider) {
    return (this.username === username && this.provider === provider);
  }

  toString () {
    return `${this.username}@${this.provider}`;
  }
}

Object.defineProperty(User, 'cacheInterval', { value: interval });

module.exports = User;
