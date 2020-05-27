const _private = new WeakMap();
const NO_SET_IN_BASE = 'Can not set values in the base object.';

class DSUser {
  constructor() {
    const initialDate = new Date(0);
    const initialState = {
      disabled: true,
      dn: '',
      gidNumber: 0,
      groups: [],
      lastLogin: initialDate,
      locked: true,
      modifiable: false,
      name: '',
      passwordAllowChangeTime: initialDate,
      passwordExpirationTime: initialDate,
      passwordRetryCount: 0,
      passwordExpWarned: false,
      provider: '',
      removable: false,
      username: ''
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

  get dn() {
    return _private.get(this).dn;
  }

  get groups() {
    return [..._private.get(this).groups];
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

  get locked() {
    return _private.get(this).locked;
  }

  get modifiable() { // Read Only
    return _private.get(this).modifiable;
  }

  get name() {
    return _private.get(this).name;
  }

  get passwordAllowChangeTime() {
    return _private.get(this).passwordAllowChangeTime;
  }

  get passwordExpirationTime() {
    return _private.get(this).passwordExpirationTime;
  }

  get passwordExpired() { // Derived/Read Only
    return (_private.get(this).passwordExpired.valueOf() < Date.now());
  }

  get passwordExpWarned() {
    return _private.get(this).passwordExpWarned;
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

  async setDisabled(disabled) {
    _private.get(this).disabled = disabled;
    if (disabled) {
      await clearSession(this.username, this.provider);
    }
  }

  async setGroups(groups) {
    if (!Array.isArray(groups)) {
      throw new TypeError('The incoming value must be an array of strings.');
    }
    _private.get(this).groups = [...groups];
  }

  async setLastLogin(date) { // Only called by SSO?
    _private.get(this).lastLogin = date;
  }

  async setLocked(locked) {
    _private.get(this).locked = locked;
    if (locked) {
      await clearSession(this.username, this.provider);
    }
  }

  async setName(name) {
    _private.get(this).name = name
  }

  async setPassword(/*password, oldPassword*/) { // Write Only
    throw new Error(NO_SET_IN_BASE); // You MUST override setPassword and not call super.setPassword();
  }

  async setPasswordAllowChangeTime(date = new Date()) {
    _private.get(this).passwordAllowChangeTime = date;
  }

  async setPasswordExpirationTime(date) {
    _private.get(this).passwordExpirationTime = date;
    if (date.valueOf() < Date.now()) {
      await clearSession(this.username, this.provider);
    }
  }

  async setPasswordExpWarned(warned) {
    _private.get(this).passwordExpWarned = warned;
  }

  async setpasswordRetryCount(retries) {
    _private.get(this).passwordRetryCount = retries;
  }

  toJSON() {
    const p = _private.get(this);
    const { disabled, locked, modifiable, name, provider, removable, username, passwordExpired } = p;
    const groups = [...p.groups];

    return { disabled, groups, locked, modifiable, name, provider, removable, username, passwordExpired };
  }

  get username() { // Readonly
    return _private.get(this).username;
  }
}

async function clearSession(username, provider) {
  if (typeof DSUser.purgeSession === 'function') {
    await DSUser.purgeSession(username, provider);
  }
}

DSUser.purgeSession = null;

module.exports = DSUser;
