const DSUser = require('./DSUser');
const types = require('../types');
const { /*errors, */HttpError } = require('../../..');
const { VALUE_MUST_BE, isBool, isDate, isNum, isStr } = types;
//const { AttributeError } = errors.NoEntityError;
const ATTR = {
  ADDRESS1: 'address1',
  ADDRESS2: 'address2',
  CAN_CHANGE_PASSWORD: 'canChangePassword',
  CITY: 'city',
  COUNTRY: 'country',
  DISABLED: 'disabled',
  EMAIL: 'email',
  FIRSTNAME: 'firstname',
  GROUPS: 'groups',
  LAST_LOGIN: 'lastLogin',
  LASTNAME: 'lastname',
  LOCKED: 'locked',
  MODIFIABLE: 'modifiable',
  PASSWORD_EXPIRATION_TIME: 'passwordExpirationTime',
  PASSWORD_RETRY_COUNT: 'passwordRetryCount',
  PASSWORD: 'password',
  PASSWORD_EXPIRATION_WARNED: 'passwordExpirationWarned',
  PROFILE_PICTURE: 'profilePicture',
  STATE: 'state',
  USERNAME: 'username',
  ZIP: 'zip'
};
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const RETRY_COUNT = 3;
const ACCOUNT_INACTIVITY_LIMIT = 45 * DAY;

async function setDateAttr(requestor, user, attribute, date) {
  validateCanChange(user);

  if (!isDate(date)) {
    throw new TypeError(VALUE_MUST_BE.DATE);
  }

  await user.service.setAttr(requestor, user.id, attribute, date);
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

      if (!data.domain) {
        throw new TypeError(`The argument 'data.domain' must be a valid string`);
      }
      DSUser.initFromObj(this, data);
      super.init(data.username, data.domain);
    }
  }

  async changeGroups(requestor, changes) {
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

    await this.setGroups(requestor, groups);
  }

  async init(username, domain = 'default') {
    if (!username) {
      throw new TypeError(`The argument 'username' must be a valid string`);
    }

    if (!domain) {
      throw new TypeError(`The argument 'domain' must be a valid string`);
    }

    const obj = await this.service.getUserById(username);
    if (obj == null) {
      throw new HttpError(404, "User not found");
    }
    DSUser.initFromObj(this, obj);
    super.init(username, domain);
  }

  async setDisabled(requestor, disabled) {
    validateCanChange(this, 'Disabling a root user is not permitted.');

    if (!isBool(disabled)) {
      throw new TypeError(VALUE_MUST_BE.BOOL);
    }

    if (disabled !== this.disabled) {
      await this.service.setAttr(requestor, this.id, ATTR.DISABLED, disabled);
      await super.setDisabled(disabled);
    }
  }

  // TODO: This needs to properly set the groups in the `user_groups` table
  async setGroups(requestor, groups) {
    if (!Array.isArray(groups)) {
      throw new TypeError(VALUE_MUST_BE.ARRAY_OF_STRINGS);
    }

    await this.service.setAttr(requestor, this.id, ATTR.GROUPS, groups);
    await super.setGroups(groups);
  }

  async setLastLogin(requestor, date) { // Only called by SSO?
    await setDateAttr(requestor, this, ATTR.LAST_LOGIN, date);
    await super.setLastLogin(date);
  }

  async setLocked(requestor, locked) {
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
      await this.setpasswordRetryCount(requestor, RETRY_COUNT);
      await super.setLocked(locked);
    }
  }

  async setFirstName(requestor, name) {
    validateCanChange(this);
    if (!isStr(name)) {
      throw new TypeError(VALUE_MUST_BE.STRING);
    }

    await this.service.setAttr(requestor, this.id, ATTR.FIRSTNAME, name);
    await super.setFirstName(name)
  }

  async setLastname(requestor, name) {
    validateCanChange(this);
    if (!isStr(name)) {
      throw new TypeError(VALUE_MUST_BE.STRING);
    }

    await this.service.setAttr(requestor, this.id, ATTR.LASTNAME, name);
    await super.setLastName(name)
  }

  async setName(requestor, {firstname, lastname} = {}) {
    validateCanChange(this);
    if (!isStr(firstname) || !isStr(lastname)) {
      throw new TypeError(VALUE_MUST_BE.STRING);
    }

    await this.service.setAttr(requestor, this.id, ATTR.FIRSTNAME, firstname);
    await super.setFirstName(firstname)
    await this.service.setAttr(requestor, this.id, ATTR.LASTNAME, lastname);
    await super.setFirstName(lastname)
  }

  async setPassword(requestor, newPassword, existingPassword) {
    // MUST not call super.setPassword();
    let forceChangeOnNextLogin = false;

    if (existingPassword) {
      // User attempting to change their own password
      const authenticated = await this.service.authenticate(this.username, existingPassword);
      if (!authenticated) {
        throw new Error('INVALID_EXISTING_PASSWORD');
      }
    }
    else {
      // Admin changing a user's password
      forceChangeOnNextLogin = true;
      await this.setpasswordRetryCount(requestor, 0);
    }

    // Calling service.setPassword sets the password value, passwordExpirationTime and canChangePassword
    const resp = await this.service.setPassword(requestor, this.id, newPassword, forceChangeOnNextLogin);
    if (resp) {
      await super.setPasswordExpirationTime(resp.passwordExpirationTime);
      await super.setCanChangePassword(resp.canChangePassword);
    }
    else {
      console.error(`Failed to get back a response from this.service.setPassword`);
    }
  }

  async setCanChangePassword(requestor, date) {
    // TODO: Should this be allowed? Or do I remove it.
    await setDateAttr(requestor, this, ATTR.CAN_CHANGE_PASSWORD, date);
    await super.setCanChangePassword(date);
  }

  async setPasswordExpirationTime(requestor, date) {
    // TODO: Should this be allowed? Or do I remove it.
    await setDateAttr(requestor, this, ATTR.PASSWORD_EXPIRATION_TIME, date);
    await super.setPasswordExpirationTime(date);
  }

  async setpasswordRetryCount(requestor, retries) {
    validateCanChange(this);

    if (!isNum(retries)) {
      throw new TypeError(VALUE_MUST_BE.NUMBER);
    }

    if (retries !== this.retries) {
      await this.service.setAttr(requestor, this.id, ATTR.PASSWORD_RETRY_COUNT, retries);
      await super.setpasswordRetryCount(retries);
    }
  }
}

SqlUser.ATTR = ATTR;

module.exports = SqlUser;
