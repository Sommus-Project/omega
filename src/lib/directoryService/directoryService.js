const InvalidActionError = require('./errors/InvalidActionError');
const InvalidGroupError = require('./errors/InvalidGroupError');
const CACHE_TIMEOUT = 120000; // 2 Minutes
const ERRORS = {
  NOT_MODIFIABLE: 'NOT_MODIFIABLE',
  NOT_REMOVABLE: 'NOT_REMOVABLE',
  PROTECTED_GROUP_NAME: 'PROTECTED_GROUP_NAME'
};
const VALID_GROUP_NAME = /^[a-z][a-z0-9-_.]+$/i;
const cache = {};

// Cache clearing routine
// istanbul ignore next
let cacheInterval = setInterval(() => {
  const now = Date.now();
  Object.entries(cache).forEach(
    ([key, { expTime }]) => {
      if (expTime < now) {
        delete cache[key];
      }
    }
  );
}, 30000); // Check every 30 seconds

// The destroy function is ONLY for testing and must be called in the after function
// after(() => {
//   directoryService.destroy();
// })
// istanbul ignore next
function destroy() {
  if (cacheInterval) {
    clearInterval(cacheInterval);
    cacheInterval = null;
  }
}

function directoryService(config) {
  const dsList = {};

  if (config == null || typeof config != 'object') {
    throw new TypeError('config must be an object.')
  }

  // Generate the appropriate information based on the
  // set of providers that are passed in the config data.
  Object.entries(config).forEach(([providerName, pInfo]) => {
    dsList[providerName] = pInfo;
  });

  // Return a function that will return the appropriate DS functions
  // based on the passed in provider.
  return (provider) => {
    if (!dsList[provider]) {
      throw new ReferenceError(`Unknown provider [${provider}]`);
    }

    const { User, service } = dsList[provider];

    // Return the appropriate DS functions
    return {
      provider,
      // Check to see if the supplied username/password are valid.
      // ✓ 2021-02-23
      async authenticate(username, password) {
        return await service.authenticate(username, password);
      },

      async clearCache() {
        Object.keys(cache).forEach(key => delete cache[key]);
      },

      async clearUserFromCache(username) {
        var key = `${username}@${provider}`;
        if (cache[key]) {
          delete cache[key];
        }
      },

      // Create a group and attach the users to the new group.
      async createGroup(requestor, groupName, description, users = []) {
        this.validateGroupName(groupName);

        if (service.isProtectedGroup(groupName)) {
          throw new InvalidActionError(ERRORS.PROTECTED_GROUP_NAME, `The group name "${groupName}" is invalid. Group names must not start with "searchappliance_"`);
        }

        await service.createGroup(requestor, groupName, description);
        if (Array.isArray(users) && users.length > 0) {
          await this.setUsersForGroup(requestor, groupName, users, true)
        }
      },

      // ✓ 2021-02-23 - Seems to be finished
      async createUser(requestor, data, tempPassword = true) {
        return service.createUser(requestor, data, tempPassword);
      },

      async deleteGroup(requestor, groupName) {
        await service.delGroup(requestor, groupName);
        this.clearCache();
      },

      async deleteUser(requestor, username) {
        const user = await this.getUser(username)
        if (!user.removable) {
          throw new InvalidActionError(ERRORS.NOT_REMOVABLE, `The user "${username}" is not modifiable`);
        }

        this.clearUserFromCache(username);
        return service.delUser(requestor, username);
      },

      async getGroup(groupName) {
        return await service.getGroupByName(groupName);
      },

      async getGroupUsers(groupName, params) {
        const group = await this.getGroup(groupName);
        if (group == null) {
          return false;
        }

        return await service.getGroupUsers(groupName, params);
      },

      async getGroups(params) {
        return await service.getGroups(params);
      },

      async getUser(username) {
        var key = `${username}@${provider}`;
        //if (!cache[key]) {
          // If this user is not already in cache then created a new User object
          const user = new User(service);
          // Fill it with data from the appropriate service (LDAP, etc.)
          await user.init(username, provider);
          // Save this user in the cacke
          cache[key] = {
            expTime: Date.now() + CACHE_TIMEOUT,
            user
          };
        //}

        // Return the user from cache
        return cache[key].user;
      },

      async getUsers(params) {
        return await service.getUsers(params);
      },

      async setGroupDescription(requestor, groupName, description) {
        if (service.isProtectedGroup(groupName)) {
          throw new InvalidActionError(ERRORS.PROTECTED_GROUP_NAME, `The group "${groupName}" is protected. You can not change the description.`);
        }

        return await service.setGroupDescription(requestor, groupName, description);
      },

      // TODO: Broken
      async setUsersForGroup(requestor, groupName, memberList, isNewGroup) {
        this.validateIsExistingGroup(groupName);

        service.NONMODIFIABLE_USERS.some(user => {
          if (memberList.includes(user)) {
            throw new InvalidActionError(ERRORS.NOT_MODIFIABLE, `The user "${user}" is not modifiable`);
          }
        });

        const existingUsers = isNewGroup ? [] : (await service.getGroupUsers(groupName)).users;
        const membersToRemove = isNewGroup ? [] : existingUsers.filter(({ username }) => memberList.includes(username));
        const membersToAdd = isNewGroup ? memberList : memberList.filter(username => !existingUsers.includes(username));

        await service.setUsersForGroup(requestor, { groupName, add: membersToAdd, del: membersToRemove });

        // Clear the cache for all the users whose groups changed
        [...membersToRemove, ...membersToAdd].forEach(username => this.clearUserFromCache(username));
      },

      validateGroupName(group) {
        if (!VALID_GROUP_NAME.test(group)) {
          throw new InvalidGroupError(`The group name "${group}" is not properly formated. Group names must start with a letter and contain nothing but A-Z, 0-9, "-", "_" or "."`);
        }
      },

      async validateIsExistingGroup(groups) {
        const allGroups = (await this.getGroups()).groups.map(group => group.name);
        if (!Array.isArray(groups)) {
          groups = [groups]; // eslint-disable-line no-param-reassign
        }
        groups.forEach(groupName => {
          if (!allGroups.includes(groupName)) {
            throw new InvalidGroupError(`The group "${groupName}" is not a valid group.`);
          }
        });
      }
    };
  }
}

module.exports = directoryService;
module.exports.destroy = destroy;
module.exports.ERRORS = ERRORS;