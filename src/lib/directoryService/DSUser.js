const _private = new WeakMap();
const NO_SET_IN_BASE = 'Can not set values in the base object.';

class DSUser {
  constructor() {
    const initialDate = new Date(0);
    const initialState = {
      address_id: null,
      address1: '',
      address2: '',
      canChangePassword: initialDate,
      city: '',
      country: '',
      disabled: true,
      email: '',
      firstname: '',
      groups: [],
      id: 0,
      lastLogin: initialDate,
      lastname: '',
      lat: '',
      lng: '',
      locked: true,
      modifiable: false,
      passwordExpirationTime: initialDate,
      passwordRetryCount: 0,
      profilePicture: '',
      domain: '',
      removable: false,
      state: '',
      username: '',
      zip: ''
    }
    _private.set(this, initialState);
  }

  // ✓ 2021-03-02 - Finished
  static authenticate(/*uid, password*/) {
    throw new ReferenceError(`Subclasses of DSUser must override the function 'static authenticate(uid, password)'`);
  }

  // ✓ 2021-03-02 - Finished
  init(uid, domain = 'default') {
    const p = _private.get(this);
    if (p.username !== uid) {
      throw new Error(`User object incorrectly instantiated. '${p.username}' should have been '${uid}'`);
    }

    p.domain = domain;
  }

  static initFromObj(dsUser, userInfo) {
    const p = _private.get(dsUser);
    if (p) {
      Object.entries(userInfo).forEach(([key, value]) => (p[key] = value));
    }
  }

  get address_id() { // Readonly
    return _private.get(this).address_id;
  }

  // ✓ 2021-03-02 - Finished
  get address() { // Readonly
    const { address1, address2, city, state, zip, country, lat, lng } = _private.get(this);
    return { address1, address2, city, state, zip, country, lat, lng };
  }

  // ✓ 2021-03-02 - Finished
  get address1() { // Readonly
    return _private.get(this).address1;
  }

  // ✓ 2021-03-02 - Finished
  get address2() { // Readonly
    return _private.get(this).address2;
  }

  // ✓ 2021-03-02 - Finished
  get city() { // Readonly
    return _private.get(this).city;
  }

  // ✓ 2021-03-02 - Finished
  get country() { // Readonly
    return _private.get(this).country;
  }

  // ✓ 2021-03-02 - Finished
  get disabled() { // Readonly
    return _private.get(this).disabled;
  }

  // ✓ 2021-03-02 - Finished
  get domain() { // Readonly
    return _private.get(this).domain;
  }

  // ✓ 2021-03-02 - Finished
  get email() { // Readonly
    return _private.get(this).email;
  }

  // ✓ 2021-03-02 - Finished
  get firstname() { // Readonly
    return _private.get(this).firstname;
  }

  // ✓ 2021-03-02 - Finished
  get groups() { // Readonly
    return [..._private.get(this).groups];
  }

  // ✓ 2021-03-02 - Finished
  get id() { // Readonly
    return _private.get(this).id;
  }

  // ✓ 2021-03-02 - Finished
  get lastLogin() { // Readonly
    return _private.get(this).lastLogin;
  }

  // ✓ 2021-03-02 - Finished
  get lastname() { // Readonly
    return _private.get(this).lastname;
  }

  get lat() { // Readonly
    return _private.get(this).lat;
  }

  get lng() { // Readonly
    return _private.get(this).lng;
  }

  // ✓ 2021-03-02 - Finished
  get locked() { // Readonly
    return _private.get(this).locked;
  }

  // ✓ 2021-03-02 - Finished
  get canChangePassword() { // Readonly
    return _private.get(this).canChangePassword;
  }

  // ✓ 2021-03-02 - Finished
  get passwordExpirationTime() { // Readonly
    return _private.get(this).passwordExpirationTime;
  }

  // ✓ 2021-03-02 - Finished
  get passwordExpired() { // Derived/Read Only
    return (_private.get(this).passwordExpirationTime.valueOf() < Date.now());
  }

  // ✓ 2021-03-02 - Finished
  get passwordRetryCount() { // Readonly
    return _private.get(this).passwordRetryCount;
  }

  // ✓ 2021-03-02 - Finished
  get profilePicture() { // Readonly
    return _private.get(this).profilePicture;
  }

  // ✓ 2021-03-02 - Finished
  get removable() { // Readonly
    return _private.get(this).removable;
  }

  // ✓ 2021-03-03 - Finished
  get roles() { // Readonly
    return _private.get(this).roles;
  }

  // ✓ 2021-03-02 - Finished
  get state() { // Readonly
    return _private.get(this).state;
  }

  // ✓ 2021-03-02 - Finished
  get username() { // Readonly
    return _private.get(this).username;
  }

  // ✓ 2021-03-02 - Finished
  get zip() { // Readonly
    return _private.get(this).zip;
  }

  // ✓ 2021-03-02 - Finished
  async setAddress(address) {
    const { address_id, address1, address2, city, state, zip, country, lat, lng } = address;
    _private.get(this).address_id = address_id;
    _private.get(this).address1 = address1;
    _private.get(this).address2 = address2;
    _private.get(this).city = city;
    _private.get(this).state = state;
    _private.get(this).zip = zip;
    _private.get(this).country = country;
    _private.get(this).lat = lat;
    _private.get(this).lng = lng;
  }

  // ✓ 2021-03-02 - Finished
  async setDisabled(disabled) {
    _private.get(this).disabled = disabled;
    if (disabled) {
      await clearSession(this.username, this.domain);
    }
  }

  // ✓ 2021-03-02 - Finished
  async setEmail(email) {
    _private.get(this).email = email;
  }

  // ✓ 2021-03-02 - Finished
  async setFirstname(firstname) {
    _private.get(this).firstname = firstname;
  }

  async setGroups(groups) {
    if (!Array.isArray(groups)) {
      throw new TypeError('The incoming value must be an array of strings.');
    }
    _private.get(this).groups = [...groups];
  }

  // ✓ 2021-03-02 - Finished
  async setId(id) { // eslint-disable-line no-unused-vars
    throw new Error(NO_SET_IN_BASE); // You MUST override id and not call super.setId();
  }

  // ✓ 2021-03-02 - Finished
  async setLastLogin(date) {
    _private.get(this).lastLogin = date;
  }

  // ✓ 2021-03-02 - Finished
  async setLastname(lastname) {
    _private.get(this).lastname = lastname
  }

  // ✓ 2021-03-02 - Finished
  async setLocked(locked) {
    _private.get(this).locked = locked;
    if (locked) {
      await clearSession(this.username, this.domain);
    }
  }

  // ✓ 2021-03-02 - Finished
  async setPassword(/*password, oldPassword*/) { // Write Only
    throw new Error(NO_SET_IN_BASE); // You MUST override setPassword and not call super.setPassword();
  }

  // ✓ 2021-03-02 - Finished
  async setCanChangePassword(date) {
    _private.get(this).canChangePassword = date;
  }

  // ✓ 2021-03-02 - Finished
  async setPasswordExpirationTime(date) {
    _private.get(this).passwordExpirationTime = date;
    if (date.valueOf() < Date.now()) {
      await clearSession(this.username, this.domain);
    }
  }

  // ✓ 2021-03-02 - Finished
  async setpasswordRetryCount(retries) {
    _private.get(this).passwordRetryCount = retries;
  }

  // ✓ 2021-03-02 - Finished
  async setProfilePicture(profilePic) {
    _private.get(this).profilePicture = profilePic;
  }

  // ✓ 2021-03-02 - Finished
  toJSON() {
    const p = _private.get(this);
    const { address1, address2, city, country, disabled, email, firstname, id, lastLogin, lastname, locked, modifiable, passwordExpirationTime, passwordRetryCount, profilePicture, domain, removable, state, username, zip, canChangePassword, deleted, passwordExpirationWarned, roles } = p;
    const groups = p.groups ? [...p.groups] : [];

    return {
      id, username, domain, firstname, lastname, email, disabled, lastLogin, locked, modifiable, removable, deleted,
      passwordExpirationTime, passwordRetryCount, canChangePassword, passwordExpirationWarned, passwordExpired: this.passwordExpired, 
      address1, address2, city, state, zip, country, profilePicture, groups, roles
    };
  }
}

async function clearSession(username, domain) {
  if (typeof DSUser.purgeSession === 'function') {
    await DSUser.purgeSession(username, domain);
  }
}

DSUser.purgeSession = null;
module.exports = DSUser;
