class User {
  constructor() {
    this.groups = [];
    this.roles = [];
  }

  async init(req, { username, domain = 'default' } = {}) {
    const newUserData = {
      id: null,
      username: null,
      domain: null,
      email: null,
      firstname: null,
      lastname: null,
      deleted: null,
      disabled: null,
      locked: null,
      modifiable: null,
      removable: null,
      expires: null,
      image: null,
      address1: null,
      address2: null,
      city: null,
      state: null,
      zip: null,
      country: null,
      groups: [],
      roles: []
    };

    if (!username) {
      this.#setReadOnlyData(newUserData);
      return false;
    }

    const ds = req.dirService(domain);
    const resp = await ds.getUser(username);
    this.#setReadOnlyData(resp.toJSON());
    return true;
  }

  get loggedIn() {
    return !!this.username;
  }

  inGroup(group) {
    return this.groups.includes(group);
  }

  inRole(chkRoles) {
    if (!Array.isArray(chkRoles)) {
      chkRoles = [chkRoles]; // eslint-disable-line no-param-reassign
    }

    return chkRoles.some(role => this.roles.includes(role));
  }

  isUser (username, domain = 'default') {
    return (this.username === username && this.domain === domain);
  }

  #setReadOnlyData(userInfo) {
    // Protect Properties: Make them read only
    const properties = Object.entries(userInfo).reduce((acc, [key, value]) => {
      acc[key] = { enumerable: true, value };
      return acc;
    }, {});
    Object.defineProperties(this, properties);
  }
}

module.exports = User;
