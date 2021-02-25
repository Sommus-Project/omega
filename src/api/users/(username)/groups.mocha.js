/* eslint-env mocha */
const { expect } = require('chai');
const loadapi = require('../../../lib/test/loadapi');
const apiquire = loadapi('src/api', __dirname);
const api = apiquire('./groups');
const DEFAULT_USERS = [
  {
    disabled: true,
    locked: false,
    modifiable: true,
    name: 'Bruce Banner',
    passwordExpired: true,
    removable: true,
    username: 'ihulk',
    groups: ['a', 'b']
  },
  {
    disabled: false,
    locked: false,
    modifiable: true,
    name: 'Pepper Potts',
    passwordExpired: false,
    removable: true,
    username: 'ppotts',
    groups: ['b', 'c']
  },
  {
    disabled: false,
    locked: false,
    modifiable: false,
    name: 'Tony Stark',
    passwordExpired: false,
    removable: true,
    username: 'iamironman',
    groups: ['c', 'd']
  },
  {
    disabled: false,
    locked: false,
    modifiable: true,
    name: 'Natasha Romanova',
    passwordExpired: true,
    removable: true,
    username: 'blackwidow',
    groups: ['a', 'b', 'c', 'd']
  }
];

describe('Tests for API: src/api/users/(username)/groups.js', () => {
  let users = [];
  let putData;
  const req = {
    user: {
      username: 'ppotts',
      domain: 'default'
    },
    query: {
      /*
      start
      limit
      order
      */
    },
    dirService(domain) { // eslint-disable-line no-unused-vars
      return {
        getUser(username) {
          if (username === 'missing') {
            throw new Error('no user found');
          }

          const user = { ...(users.filter((item) => item.username === username)[0]) };
          if (user) {
            user.setGroups = function (data) {
              const hasBad = data.some(group => group === 'bad');
              if (hasBad) {
                const err = new Error('bad group');
                err.additional = 'stuff';
                throw err;
              }

              putData = data;
            }
          }

          return user;
        }
      }
    }
  };

  beforeEach(() => {
    // Make an array of cloned users
    users = DEFAULT_USERS.map(defUser => ({ ...defUser }));
    putData = null;
  });

  afterEach(() => {
  });

  it('should export correct data', () => {
    const exportedFunctions = ['doGet', 'doPut'];
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

  describe('doGet Tests', () => {
    it('should get user', async () => {
      const username = 'iamironman';
      req.path = `/api/users/${username}/groups`;
      const resp = await api.doGet({ username, req });
      expect(resp).to.eql(['c', 'd']);
    });

    it('should handle missing user', (done) => {
      const username = 'missing';
      req.path = `/api/users/${username}/groups`;
      api.doGet({ username, req }).then(() => {
        done(new Error('Did not throw an error but should have.'));
      }).catch((ex) => {
        expect(ex.status).to.equal(404);
        expect(ex.title).to.equal('no user found');
        expect(ex.headers['X-No-Entity']).to.equal(`/api/users/${username}`);
        done();
      });
    });
  });

  describe('doPut Tests', () => {
    it('should handle success', async () => {
      const username = 'ppotts';
      req.path = `/api/users/${username}/groups`;
      const data = { groups: ['a', 'b', 'c'] };
      await api.doPut({ username, data, req });
      expect(putData).to.equal(data.groups);
    });

    it('should handle missing user', (done) => {
      const username = 'missing';
      req.path = `/api/users/${username}/groups`;
      const data = { groups: ['a'] };
      api.doPut({ username, data, req }).then(() => {
        done(new Error('Did not throw an error but should have.'));
      }).catch((ex) => {
        expect(ex.status).to.equal(404);
        expect(ex.title).to.equal('no user found');
        expect(ex.headers['X-No-Entity']).to.equal(`/api/users/${username}`);
        done();
      });
    });

    it('should handle groups not as an array', (done) => {
      const username = 'ppotts';
      req.path = `/api/users/${username}/groups`;
      const data = { groups: 'a' };
      api.doPut({ username, data, req }).then(() => {
        done(new Error('Did not throw an error but should have.'));
      }).catch((ex) => {
        expect(ex.status).to.equal(400);
        expect(ex.title).to.equal('Groups must be an array of strings.');
        done();
      });
    });

    it('should handle bad group name', (done) => {
      const username = 'ppotts';
      req.path = `/api/users/${username}/groups`;
      const data = { groups: ['a', 'bad', 'c'] };
      api.doPut({ username, data, req }).then(() => {
        done(new Error('Did not throw an error but should have.'));
      }).catch((ex) => {
        expect(ex.status).to.equal(400);
        expect(ex.title).to.equal('bad group');
        expect(ex.data).to.eql({ badGroup: 'stuff' });
        done();
      });
    });
  });
});