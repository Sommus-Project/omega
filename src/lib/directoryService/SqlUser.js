const DSUser = require('./DSUser');
const types = require('../types');
const { errors, HttpError } = require('../../..');
const { VALUE_MUST_BE, isBool, isDate, isNum, isStr } = types;
const { AttributeError } = errors.NoEntityError;
const ATTR = {
  DISABLED: 'disabled',
  EMAIL: 'email',
  FIRSTNAME: 'firstname',
  GROUPS: '!groups',
  LAST_LOGIN: 'lastLogin',
  LASTNAME: 'lastname',
  LOCKED: 'locked',
  PASSWORD: 'password',
  PASSWORD_EXPIRATION_TIME: 'passwordExpirationTime',
  PASSWORD_RETRY_COUNT: 'passwordRetryCount',
  USERNAME: 'username'
};
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const RETRY_COUNT = 3;
const ACCOUNT_INACTIVITY_LIMIT = 45 * DAY;
const PASSWORD_MAX_AGE = 90 * DAY;

async function setDateAttr(user, attribute, date) {
  validateCanChange(user);
  if (!isDate(date)) {
    throw new TypeError(VALUE_MUST_BE.DATE);
  }

  await user.service.setAttr(user.id, attribute, date);
}

async function setPassword(user, password) {
  try {
    await user.service.setPassword(user.id, password);
  }

  catch (ex) {
    // TODO: Need to create an InvalidPassword error and use it here.
    const err = new AttributeError(ex.code, ex.message, ex.additional);
    throw err;
  }
}

function validateCanChange(user, errorMsg = 'Changing a root user is not permitted.') {
  if (user.id < 100) {
    throw new Error(errorMsg);
  }
}

class SqlUser extends DSUser {
  constructor(service, data = null) {
    if (service == null || typeof service !== 'object') {
      throw new TypeError('You must supply a service instance when instantiating the SqlUser object')
    }
    super();
    Object.defineProperty(this, 'service', { value: service }); // `this.service` is read only and non-enumerable

    if (data) {
      if (!data.username) {
        throw new TypeError(`The argument 'data.username' must be a valid string`);
      }

      if (!data.provider) {
        throw new TypeError(`The argument 'data.provider' must be a valid string`);
      }
      DSUser.initFromObj(this, data);
      super.init(data.username, data.provider);
    }
  }

  async changeGroups(changes) {
    // TODO: This has a ton of Logic needed to add and remove groups
    // Certain groups must work together and others must work apart.
    let groups = this.groups;
    const newGroups = changes.add;
    if (Array.isArray(newGroups)) {
      newGroups.forEach((newGroup) => {
        // TODO: Validate that all new groups are valid groups
        if (!groups.includes(newGroup)) {
          groups.push(newGroup);
        }
      });
    }

    const delGroups = changes.del;
    if (Array.isArray(delGroups)) {
      delGroups.forEach((newGroup) => {
        const idx = groups.indexOf(newGroup)
        if (idx !== -1) {
          groups.splice(idx, 1);
        }
      });
    }

    await this.setGroups(groups);
  }

  async init(username, provider) {
    if (!username) {
      throw new TypeError(`The argument 'username' must be a valid string`);
    }

    if (!provider) {
      throw new TypeError(`The argument 'provider' must be a valid string`);
    }

    const obj = await this.service.getUserById(username);
    if (obj == null) {
      throw new HttpError(404, "User not found");
    }
    DSUser.initFromObj(this, obj);
    super.init(username, provider);
  }

  async setDisabled(disabled) {
    validateCanChange(this, 'Disabling a root user is not permitted.');

    if (!isBool(disabled)) {
      throw new TypeError(VALUE_MUST_BE.BOOL);
    }

    if (disabled !== this.disabled) {
      await this.service.setAttr(this.id, ATTR.DISABLED, disabled);
      await super.setDisabled(disabled);
    }
  }

  async setGroups(groups) {
    if (!Array.isArray(groups)) {
      throw new TypeError(VALUE_MUST_BE.ARRAY_OF_STRINGS);
    }

    await this.service.setAttr(this.id, ATTR.GROUPS, groups);
    await super.setGroups(groups);
  }

  async setLastLogin(date) { // Only called by SSO?
    await setDateAttr(this, ATTR.LAST_LOGIN, date);
    await super.setLastLogin(date);
  }

  async setLocked(locked) {
    validateCanChange(this, 'Locking a root user is not permitted.');

    if (!isBool(locked)) {
      throw new TypeError(VALUE_MUST_BE.BOOL);
    }

    if (locked !== this.locked) {
      let lastLoginTime = new Date();
      if (locked) {
        lastLoginTime = new Date(lastLoginTime.valueOf() - ACCOUNT_INACTIVITY_LIMIT);
      }

      await this.setLastLogin(lastLoginTime);
      await this.setpasswordRetryCount(RETRY_COUNT);
      await super.setLocked(locked);
    }
  }

  async setFirstName(name) {
    validateCanChange(this);
    if (!isStr(name)) {
      throw new TypeError(VALUE_MUST_BE.STRING);
    }

    await this.service.setAttr(this.id, ATTR.FIRSTNAME, name);
    await super.setFirstName(name)
  }

  async setLastname(name) {
    validateCanChange(this);
    if (!isStr(name)) {
      throw new TypeError(VALUE_MUST_BE.STRING);
    }

    await this.service.setAttr(this.id, ATTR.LASTNAME, name);
    await super.setLastName(name)
  }

  async setPassword(newPassword, existingPassword) {
    let expTime;
    // MUST not call super.setPassword();
    if (existingPassword) {
      // User attempting to change their own password
      if (!(await this.service.authenticate(this.username, existingPassword))) {
        throw new Error('INVALID_EXISTING_PASSWORD');
      }
      await setPassword(this, newPassword);
      expTime = new Date(Date.now() + PASSWORD_MAX_AGE);
    }
    else {
      // Admin changing a user's password
      await setPassword(this, newPassword);
      await this.setpasswordRetryCount(0);
      expTime = new Date(0); // Expire this password
    }

    this.setPasswordExpirationTime(expTime);
  }

  async setPasswordExpirationTime(date) {
    await setDateAttr(this, ATTR.PASSWORD_EXPIRATION_TIME, date);
    await super.setPasswordExpirationTime(date);
  }

  async setpasswordRetryCount(retries) {
    validateCanChange(this);

    if (!isNum(retries)) {
      throw new TypeError(VALUE_MUST_BE.NUMBER);
    }

    if (retries !== this.retries) {
      await this.service.setAttr(this.id, ATTR.PASSWORD_RETRY_COUNT, retries);
      await super.setpasswordRetryCount(retries);
    }
  }
}

SqlUser.ATTR = ATTR;

module.exports = SqlUser;
