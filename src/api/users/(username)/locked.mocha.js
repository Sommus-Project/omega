/* eslint-env mocha */
const { expect } = require('chai');
const loadapi = require('../../../lib/test/loadapi');
const apiquire = loadapi('src/api', __dirname);
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
  }
];

const api = apiquire('./locked');

describe('Tests for API: src/api/users/(username)/locked.js', () => {
  let currentLocked = '';
  let users = [];
  const req = {
    user: {
      username: 'ppotts',
      domain: 'default'
    },
    query: {},
    dirService(domain) { // eslint-disable-line no-unused-vars
      return {
        getUser(username) {
          let user = users.filter((item) => item.username === username)[0];
          if (!user) {
            throw new Error('no user found');
          }

          user = { ...user }; // Make a copy
          user.setLocked = function (locked) {
            if (locked === 99) {
              throw new Error('bad locked');
            }

            currentLocked = locked;
          }

          return user;
        }
      }
    }
  };

  beforeEach(() => {
    users = DEFAULT_USERS.map(defUser => ({ ...defUser }));
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

  describe('Tests for doGet', () => {
    it('should handle get for known user', async () => {
      let username = 'ihulk';
      const data = await api.doGet({ username, req });
      expect(data).to.eql({ locked: false });
    });

    it('should handle get for unknown user', (done) => {
      let username = 'missing';
      req.path = `/api/users/${username}/locked`;
      api.doGet({ username, req }).then(() => {
        done(new Error('Should have thrown an error and did not'));
      }).catch((ex) => {
        expect(ex.status).to.equal(404);
        expect(ex.title).to.equal('no user found');
        expect(ex.headers['X-No-Entity']).to.equal(`/api/users/${username}`);
        done();
      });
    });
  });

  describe('Tests for doPut', () => {
    it('should handle good locked for known user', async () => {
      let username = 'ihulk';
      let locked = true;
      let data = {
        locked
      };
      await api.doPut({ username, data, req });
      expect(currentLocked).to.equal(locked);
    });

    it('should handle default locked for known user', async () => {
      let username = 'ihulk';
      let data = {};
      await api.doPut({ username, data, req });
      expect(currentLocked).to.equal(false);
    });

    it('should handle unknown user', (done) => {
      let username = 'missing';
      req.path = `/api/users/${username}/locked`;
      let locked = false;
      let data = {
        locked
      };
      api.doPut({ username, data, req }).then(() => {
        done(new Error('Should have thrown an error and did not.'));
      }).catch((ex) => {
        expect(ex.status).to.equal(404);
        expect(ex.title).to.equal('no user found');
        expect(ex.headers['X-No-Entity']).to.equal(`/api/users/${username}`);
        done();
      });
    });

    it('should handle bad locked for known user', (done) => {
      let username = 'ihulk';
      let locked = 99;
      let data = {
        locked
      };
      api.doPut({ username, data, req }).then(() => {
        done(new Error('Should have thrown an error and did not.'));
      }).catch((ex) => {
        expect(ex.status).to.equal(400);
        expect(ex.title).to.equal('bad locked');
        expect(ex.data).to.equal(`Unable to set 'locked' for the user ${username}`);
        done();
      });
    });
  });
});