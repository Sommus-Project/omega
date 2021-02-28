const InvalidActionError = require('./errors/InvalidActionError');
const InvalidGroupError = require('./errors/InvalidGroupError');
const CACHE_TIMEOUT = 120000; // 2 Minutes
const ERRORS = {
  NOT_MODIFIABLE: 'NOT_MODIFIABLE',
  NOT_REMOVABLE: 'NOT_REMOVABLE',
  EXISTING_GROUP_NAME: 'EXISTING_GROUP_NAME'
};
const VALID_GROUP_NAME = /^[a-z](?:[a-z-](?!-{2,}))+$/;
const userCache = {};

// Cache clearing routine
// istanbul ignore next
let cacheInterval = setInterval(() => {
  const now = Date.now();
  Object.entries(userCache).forEach(
    ([key, { expTime }]) => {
      if (expTime < now) {
        delete userCache[key];
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
  // set of domains that are passed in the config data.
  Object.entries(config).forEach(([domainName, pInfo]) => {
    dsList[domainName] = pInfo;
  });

  // Return a function that will return the appropriate DS functions
  // based on the passed in domain.
  return (domain) => {
    if (!dsList[domain]) {
      throw new ReferenceError(`Unknown domain [${domain}]`);
    }


    const { User, service } = dsList[domain];

    // Return the appropriate DS functions
    return {
      domain,
      // Check to see if the supplied username/password are valid.
      // ✓ 2021-02-23 - Finished
      async authenticate(username, password) {
        return await service.authenticate(username, password);
      },

      // ✓ 2021-02-27
      async clearCache() {
        Object.keys(userCache).forEach(key => delete userCache[key]);
      },

      // ------------------------------- NEED TO FINISH -------------------------------
      async clearUserFromCache(username) {
        var key = `${username}@${domain}`;
        if (userCache[key]) {
          delete userCache[key];
        }
      },

      // Create a group and attach the users to the new group.
      // ✓ 2021-02-27 - MOSTLY finished
      // TODO: Check to see if any of the users are not modifiable and throw error
      // ------------------------------- NEED TO FINISH -------------------------------
      async createGroup(requestor, groupName, description, users = []) {
        this.validateGroupName(groupName);

        if (await service.isExistingGroup(groupName)) {
          throw new InvalidActionError(ERRORS.EXISTING_GROUP_NAME, `The group name "${groupName}" already exists.`);
        }

        // TODO: Check to see if any of the users are not modifiable and throw error
        await service.createGroup(requestor, groupName, description, users);
      },

      // ✓ 2021-02-23 - Finished
      async createUser(requestor, data, tempPassword = true) {
        return service.createUser(requestor, data, tempPassword);
      },

      // ✓ 2021-02-23 - Finished
      async deleteGroup(requestor, groupName) {
        await service.delGroup(requestor, groupName);
        this.clearCache();
      },

      // ✓ 2021-02-23 - Finished
      async deleteUser(requestor, username) {
        const user = await this.getUser(username)
        if (!user.removable) {
          throw new InvalidActionError(ERRORS.NOT_REMOVABLE, `The user "${username}" is not modifiable`);
        }

        this.clearUserFromCache(username);
        return service.delUser(requestor, username);
      },

      // ✓ 2021-02-23 - Finished
      async getGroup(groupName) {
        return await service.getGroupByName(groupName);
      },

      // ✓ 2021-02-27 - Finished
      async getGroupUsers(groupName, params) {
        const group = await this.getGroup(groupName);
        if (group == null) {
          return false;
        }

        return await service.getGroupUsers(groupName, params);
      },

      // ✓ 2021-02-23 - Finished
      async getGroups(params) {
        return await service.getGroups(params);
      },

      // ✓ 2021-02-23 - Finished
      async getUser(username) {
        var key = `${username}@${domain}`;
        if (!userCache[key]) {
          // If this user is not already in userCache then created a new User object
          const user = new User(service);
          // Fill it with data from the appropriate service (LDAP, etc.)
          await user.init(username, domain);
          // Save this user in the cacke
          userCache[key] = {
            expTime: Date.now() + CACHE_TIMEOUT,
            user
          };
        }

        // Return the user from userCache
        return userCache[key].user;
      },

      // ✓ 2021-02-23 - Finished
      async getUsers(params) {
        return await service.getUsers(params);
      },

      // ✓ 2021-02-27 - Finished
      async setGroupDescription(requestor, groupName, description) {
        return await service.setGroupDescription(requestor, groupName, description);
      },

      // TODO: Broken
      // ------------------------------- NEED TO FINISH -------------------------------
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

      // ✓ 2021-02-27 - Finished
      validateGroupName(group) {
        if (!VALID_GROUP_NAME.test(group)) {
          throw new InvalidGroupError(`The group name "${group}" is not properly formated. Group names must start with a lowercase letter and contain nothing but lowercase letter or "-"`);
        }
      },

      // ------------------------------- NEED TO FINISH -------------------------------
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