const _private = new WeakMap();
const NO_SET_IN_BASE = 'Can not set values in the base object.';

class DSUser {
  constructor() {
    const initialDate = new Date(0);
    const initialState = {
      address1: '',
      address2: '',
      city: '',
      country: '',
      disabled: true,
      email: '',
      firstname: '',
      groups: [],
      id: 0,
      lastLogin: initialDate,
      lastname: '',
      locked: true,
      modifiable: false,
      passwordExpirationTime: initialDate,
      passwordRetryCount: 0,
      profilePicture: '',
      provider: '',
      removable: false,
      state: '',
      username: '',
      zip: ''
    }
    _private.set(this, initialState);
  }

  static authenticate(/*uid, password*/) {
    throw new ReferenceError(`Subclasses of DSUser must override the function 'static authenticate(uid, password)'`);
  }

  async changeGroups(/*changes*/) {
    throw new Error(NO_SET_IN_BASE); // You MUST override changeGroups and not call super.addGroups();
  }

  get disabled() {
    return _private.get(this).disabled;
  }

  get email() {
    return _private.get(this).email;
  }

  get firstname() {
    return _private.get(this).firstname;
  }

  get groups() {
    return [..._private.get(this).groups];
  }

  get id() {
    return _private.get(this).id;
  }

  init(uid, provider = 'default') {
    const p = _private.get(this);
    if (p.username !== uid) {
      throw new Error(`User object incorrectly instantiated. '${p.username}' should have been '${uid}'`);
    }

    p.provider = provider;
  }

  static initFromObj(dsUser, userInfo) {
    const p = _private.get(dsUser);
    if (p) {
      Object.entries(userInfo).forEach(([key, value]) => (p[key] = value));
    }
  }

  get lastLogin() {
    return _private.get(this).lastLogin;
  }

  get lastname() {
    return _private.get(this).lastname;
  }

  get locked() {
    return _private.get(this).locked;
  }

  get passwordExpirationTime() {
    return _private.get(this).passwordExpirationTime;
  }

  get passwordExpired() { // Derived/Read Only
    return (_private.get(this).passwordExpirationTime.valueOf() < Date.now());
  }

  get passwordRetryCount() {
    return _private.get(this).passwordRetryCount;
  }

  get provider() { // Readonly
    return _private.get(this).provider;
  }

  get removable() { // Readonly
    return _private.get(this).removable;
  }

  get username() { // Readonly
    return _private.get(this).username;
  }

  async setDisabled(disabled) {
    _private.get(this).disabled = disabled;
    if (disabled) {
      await clearSession(this.username, this.provider);
    }
  }

  async setEmail(email) {
    _private.get(this).email = email;
  }

  async setFirstname(firstname) {
    _private.get(this).firstname = firstname;
  }

  async setGroups(groups) {
    if (!Array.isArray(groups)) {
      throw new TypeError('The incoming value must be an array of strings.');
    }
    _private.get(this).groups = [...groups];
  }

  async setId(id) {
    throw new Error(NO_SET_IN_BASE); // You MUST override id and not call super.setId();
  }

  async setLastLogin(date) { // Only called by SSO?
    throw new Error(NO_SET_IN_BASE); // You MUST override lastLogin and not call super.setLastLogin();
  }

  async setLastame(lastname) {
    _private.get(this).lastname = lastname
  }

  async setLocked(locked) {
    _private.get(this).locked = locked;
    if (locked) {
      await clearSession(this.username, this.provider);
    }
  }

  async setPassword(/*password, oldPassword*/) { // Write Only
    throw new Error(NO_SET_IN_BASE); // You MUST override setPassword and not call super.setPassword();
  }

  async setPasswordExpirationTime(date) {
    _private.get(this).passwordExpirationTime = date;
    if (date.valueOf() < Date.now()) {
      await clearSession(this.username, this.provider);
    }
  }

  async setpasswordRetryCount(retries) {
    _private.get(this).passwordRetryCount = retries;
  }

  toJSON() {
    const p = _private.get(this);
    const { address1, address2, city, country, disabled, email, firstname, id, lastLogin, lastname, locked, modifiable, passwordExpirationTime, passwordRetryCount, profilePicture, provider, removable, state, username, zip, canChangePassword, deleted, passwordExpirationWarned, roles } = p;
    //const { disabled, email, firstname, id, lastname, locked, provider, removable, username } = p;
    const groups = p.groups ? [...p.groups] : undefined;

    return {
      id, username, provider, firstname, lastname, email, disabled, lastLogin, locked, modifiable, removable, deleted,
      passwordExpirationTime, passwordRetryCount, canChangePassword, passwordExpirationWarned, passwordExpired: this.passwordExpired, 
      address1, address2, city, state, zip, country, profilePicture, groups, roles
    };
  }
}

async function clearSession(username, provider) {
  if (typeof DSUser.purgeSession === 'function') {
    await DSUser.purgeSession(username, provider);
  }
}

DSUser.purgeSession = null;
module.exports = DSUser;
