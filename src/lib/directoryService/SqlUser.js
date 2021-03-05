const DSUser = require('./DSUser');
const types = require('../types');
const { /*errors, */HttpError } = require('../../..');
const { VALUE_MUST_BE, isBool, isDate, isNum, isStr } = types; // eslint-disable-line no-unused-vars
//const { AttributeError } = errors.NoEntityError;
const ATTR = {
  ADDRESS1: 'address1',
  ADDRESS2: 'address2',
  CITY: 'city',
  COUNTRY: 'country',
  DISABLED: 'disabled',
  EMAIL: 'email',
  FIRSTNAME: 'firstname',
  GROUPS: 'groups',
  LAST_LOGIN: 'last_login',
  LASTNAME: 'lastname',
  LOCKED: 'locked',
  MODIFIABLE: 'modifiable',
  PASSWORD_RETRY_COUNT: 'pwd_retry_count',
  PASSWORD: 'password',
  PASSWORD_EXPIRATION_WARNED: 'pwd_exp_warned',
  PROFILE_PICTURE: 'profile_picture',
  STATE: 'state',
  USERNAME: 'username',
  ZIP: 'zip'
};
const ADDRESS_FIELDS = ["address1", "address2", "city", "state", "country", "zip", "lat", "lng"];

const RETRY_COUNT = 3;
const ACCOUNT_INACTIVITY_LIMIT = 45;

const toSqlDate = data => data.toISOString().slice(0, 19).replace('T', ' ');

async function setDateAttr(requestor, user, attribute, date) {
  validateCanChange(user);

  if (!isDate(date)) {
    throw new TypeError(VALUE_MUST_BE.DATE);
  }

  await user.service.setAttr(requestor, user.id, { [attribute]: toSqlDate(date) });
}

function validateCanChange(user, errorMsg = 'Changing a non-modifiable user is not permitted.') {
  if (user.modifiable) {
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

      DSUser.initFromObj(this, data);
      super.init(data.username);
    }
  }

  // ✓ 2021-03-02 - Finished
  async init(username) {
    if (!username) {
      throw new TypeError(`The argument 'username' must be a valid string`);
    }

    const obj = await this.service.getUserById(username);
    if (obj == null) {
      throw new HttpError(404, "User not found");
    }
    DSUser.initFromObj(this, obj);
    super.init(username);
  }

  // ✓ 2021-03-02 - 
  async setAddress( requestor, address ) {
    const address_id = await this.service.setAddress(requestor, this.id, this.address_id, address);
    await super.setAddress({ ...address, address_id });
  }

  // ✓ 2021-03-01 - Finished
  async setDisabled(requestor, disabled) {
    validateCanChange(this, 'Disabling a root user is not permitted.');

    if (!isBool(disabled)) {
      throw new TypeError(VALUE_MUST_BE.BOOL);
    }

    if (disabled !== this.disabled) {
      const attrs = { [ATTR.DISABLED]: disabled };
      if (!disabled) {
        attrs[ATTR.PASSWORD_RETRY_COUNT] = 0;
      }
      await this.service.setAttr(requestor, this.id, attrs);
      await super.setDisabled(disabled);
    }
  }

  // ------------------- NEEDS TO BE FINISHED -------------------
  async setGroups(requestor, groups) {
    // TODO: This needs to properly set the groups in the `user_groups` table
    if (!Array.isArray(groups)) {
      throw new TypeError(VALUE_MUST_BE.ARRAY_OF_STRINGS);
    }

    // Figure out:
    //   1. which groups stay the same
    //   2. which groups need to be removed
    //   3. which groups need to be added
    //await super.setGroups(groups);
  }

  // ✓ 2021-03-01 - Finished
  async setLastLogin(requestor) {
    // This is only to be called by the login function.
    // We need to indicate that the user has just logged in.
    const date = new Date();
    await setDateAttr(requestor, this, ATTR.LAST_LOGIN, date);
    super.setLastLogin(date);
  }

  // ✓ 2021-03-01 - Finished
  async setLocked(requestor, locked) {
    validateCanChange(this, 'Locking a root user is not permitted.');

    if (!isBool(locked)) {
      throw new TypeError(VALUE_MUST_BE.BOOL);
    }

    if (locked !== this.locked) {
      let lastLoginTime = new Date();
      let retryCount = 0;
      if (locked) {
        lastLoginTime.setDate(lastLoginTime.getDate() - ACCOUNT_INACTIVITY_LIMIT);
        retryCount = RETRY_COUNT;
      }

      try {
        await this.service.setAttr(requestor, this.id, {
          [ATTR.LAST_LOGIN]: toSqlDate(lastLoginTime),
          [ATTR.PASSWORD_RETRY_COUNT]: retryCount
        });

        await super.setLastLogin(lastLoginTime);
        await super.setpasswordRetryCount(retryCount);
        await super.setLocked(locked);
      }

      catch(ex) {
        console.error(ex.stack);
        throw ex;
      }
    }
  }

  // ✓ 2021-03-02 - Finished
  async setFirstname(requestor, name) {
    validateCanChange(this);
    if (!isStr(name)) {
      throw new TypeError(VALUE_MUST_BE.STRING);
    }

    await this.service.setAttr(requestor, this.id, {[ATTR.FIRSTNAME]: name});
    await super.setFirstname(name);
  }

  // ✓ 2021-03-02 - Finished
  async setLastname(requestor, name) {
    validateCanChange(this);
    if (!isStr(name)) {
      throw new TypeError(VALUE_MUST_BE.STRING);
    }

    await this.service.setAttr(requestor, this.id, {[ATTR.LASTNAME]: name});
    await super.setLastname(name);
  }

  // ✓ 2021-03-01 - Finished
  async setEmail(requestor, email) {
    if (requestor !== this.id) {
      validateCanChange(this);
    }

    if (!isStr(email)) {
      throw new TypeError(VALUE_MUST_BE.STRING);
    }

    await this.service.setAttr(requestor, this.id, {[ATTR.EMAIL]: email});
    await super.setEmail(email);
  }

  // ✓ 2021-03-01 - Finished
  async setName(requestor, {firstname, lastname} = {}) {
    if (requestor !== this.id) {
      validateCanChange(this);
    }

    if (!isStr(firstname) || !isStr(lastname)) {
      throw new TypeError(VALUE_MUST_BE.STRING);
    }

    await this.service.setAttr(requestor, this.id, {
      [ATTR.FIRSTNAME]: firstname,
      [ATTR.LASTNAME]: lastname
    });
    await super.setFirstname(firstname);
    await super.setLastname(lastname);
  }

  // ✓ 2021-03-01 - Finished
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
    }

    // Calling service.setPassword sets the password value, passwordExpirationTime and canChangePassword
    const resp = await this.service.setPassword(requestor, this.id, newPassword, forceChangeOnNextLogin);
    if (resp) {
      await super.setPasswordExpirationTime(resp.passwordExpirationTime);
      await super.setCanChangePassword(resp.canChangePassword);
      this.setLocked(requestor, false);
    }
    else {
      console.error(`Failed to get back a response from this.service.setPassword`);
    }
  }

  // ✓ 2021-03-02 - Finished
  async setCanChangePassword(requestor, date) {
    throw new Error('Unable to set this value.');
  }

  // ✓ 2021-03-02 - Finished
  async setPasswordExpirationTime(requestor, date) {
    throw new Error('Unable to set this value.');
  }

  // ✓ 2021-03-02 - Finished
  async setProfilePicture(requestor, profilePicture) {
    if (requestor !== this.id) {
      validateCanChange(this);
    }

    if (!isStr(profilePicture)) {
      throw new TypeError(VALUE_MUST_BE.STRING);
    }

    await this.service.setAttr(requestor, this.id, { [ATTR.PROFILE_PICTURE]: profilePicture });
    await super.setProfilePicture(profilePicture);
  }
}

SqlUser.ATTR = ATTR;

module.exports = SqlUser;
