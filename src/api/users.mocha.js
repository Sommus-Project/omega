/* eslint-env mocha */
const { expect } = require('chai');
const loadapi = require('../lib/test/loadapi');
//const InvalidActionError = require('../lib/directoryService/errors/InvalidActionError');
//const InvalidGroupError = require('../lib/directoryService/errors/InvalidGroupError');
const apiquire = loadapi('src/api', __dirname);
const api = apiquire('./users');
const DEFAULT_USERS = [
  {
    disabled: true,
    locked: false,
    modifiable: true,
    name: 'Bruce Banner',
    passwordExpired: true,
    removable: true,
    username: 'ihulk',
    deep: 1
  },
  {
    disabled: false,
    locked: false,
    modifiable: true,
    name: 'Pepper Potts',
    passwordExpired: false,
    removable: true,
    username: 'ppotts',
    deep: 2
  },
  {
    disabled: false,
    locked: false,
    modifiable: false,
    name: 'Tony Stark',
    passwordExpired: false,
    removable: true,
    username: 'iamironman',
    deep: 3
  },
  {
    disabled: false,
    locked: false,
    modifiable: true,
    name: 'Natasha Romanova',
    passwordExpired: true,
    removable: true,
    username: 'blackwidow',
    deep: 4
  }
];

describe('Tests for API: src/api/users.js', () => {
  let users = [];
  let postData = {};
  const req = {
    user: {
      username: 'ppotts',
      provider: 'default'
    },
    query: {
      /*
      start
      limit
      order
      */
    },
    dirService(provider) { // eslint-disable-line no-unused-vars
      return {
        getUser(username) {
          return users.filter((item) => item.username === username)[0];
        },
        getUsers() {
          return {
            count: users.length,
            start: 0,
            total: users.length,
            users
          };
        },
        FAIL!!
        //TODO: Fix this to take all correct params in an object
        createUser(creator, { username, firstname, lastname, address1, address2, city, state, zip, country, email, password, groups }) { // eslint-disable-line no-unused-vars
          if (username === 'exception') {
            const err = new Error('Failed to create user.');
            err.code = 123;
            err.subCode = 'abc';
            throw err;
          }

          postData = { username, name, password, groups };
          users.push(postData);
        }
      }
    }
  };

  beforeEach(() => {
    req.query = {};
    postData = {};
    users = DEFAULT_USERS.map(defUser => ({
      disabled: defUser.disabled,
      locked: defUser.locked,
      modifiable: defUser.modifiable,
      name: defUser.name,
      passwordExpired: defUser.passwordExpired,
      provider: req.user.provider,
      removable: defUser.removable,
      username: defUser.username
    }));
  });

  afterEach(() => {
  });

  it('should export correct data', () => {
    const exportedFunctions = ['doGet', 'doPost'];
    expect(api).to.be.an('object');
    expect(Object.keys(api).length).to.equal(exportedFunctions.length);
    exportedFunctions.forEach(
      fn => {
        expect(api[fn]).to.be.a('function');
        expect(api[fn].auth).to.eql(['user-edit']);
        expect(api[fn].loggedIn).to.equal(undefined);
      }
    );
  });

  describe('test doGet', () => {
    it('should provide a response', async () => {
      const temp = await api.doGet({ req });
      expect(Object.keys(temp).length).to.equal(4);
      expect(temp.users).to.eql(users);
      expect(temp.start).to.equal(0);
      expect(temp.count).to.equal(users.length);
      expect(temp.total).to.equal(users.length);
    });
  });

  describe('test doPost', () => {
    it('should provide a response on doPost', async () => {
      req.path = '/api/users';
      const username = 'batman';
      const name = 'Bruce Wayne';
      const password = 'ironmansucks';
      const groups = ['a', 'b'];
      const data = { username, name, password, groups };
      const resp = await api.doPost({ data, req });
      expect(postData).to.eql(data);
      expect(resp.status).to.equal(201);
      expect(resp.headers.location).to.equal(`${req.path}/${username}`);
      expect(resp.data).to.eql(data);
    });

    it('should provide a response on doPost', async () => {
      req.path = '/api/users';
      const username = 'exception';
      const name = 'Bruce Wayne';
      const password = 'ironmansucks';
      const groups = ['a', 'b'];
      const data = { username, name, password, groups };
      const resp = await api.doPost({ data, req });
      expect(resp.status).to.equal(400);
      expect(resp.title).to.equal('Failed to create user.');
      expect(resp.data).to.eql({ code: 123, subCode: 'abc' });
    });
  });
});
