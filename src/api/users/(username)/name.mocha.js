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

const api = apiquire('./name');

describe('Tests for API: src/api/users/(username)/name.js', () => {
  let currentName = '';
  let users = [];
  const req = {
    user: {
      username: 'ppotts',
      provider: 'default'
    },
    query: {},
    dirService(provider) { // eslint-disable-line no-unused-vars
      return {
        getUser(username) {
          let user = users.filter((item) => item.username === username)[0];
          if (!user) {
            throw new Error('no user found');
          }

          user = { ...user }; // Make a copy
          user.setName = function (name) {
            if (name === 'Bad Name') {
              throw new Error('bad name');
            }

            currentName = name;
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
      const name = await api.doGet({ username, req });
      expect(name).to.eql({ name: 'Bruce Banner' });
    });

    it('should handle get for unknown user', (done) => {
      let username = 'missing';
      req.path = `/api/users/${username}/name`;
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
    it('should handle good name for known user', async () => {
      let username = 'ihulk';
      let name = 'Bruce the Green Guy';
      let data = {
        name
      };
      await api.doPut({ username, data, req });
      expect(currentName).to.equal(name);
    });

    it('should handle unknown user', (done) => {
      let username = 'missing';
      req.path = `/api/users/${username}/name`;
      let name = 'New Name';
      let data = {
        name
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

    it('should handle bad PW for known user', (done) => {
      let username = 'ihulk';
      let name = 'Bad Name';
      let data = {
        name
      };
      api.doPut({ username, data, req }).then(() => {
        done(new Error('Should have thrown an error and did not.'));
      }).catch((ex) => {
        expect(ex.status).to.equal(400);
        expect(ex.title).to.equal('bad name');
        expect(ex.data).to.equal(`Unable to set 'name' for the user ${username}`);
        done();
      });
    });
  });
});