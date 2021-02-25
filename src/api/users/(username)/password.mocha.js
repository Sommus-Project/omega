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

const api = apiquire('./password');

describe('Tests for API: src/api/users/(username)/password.js', () => {
  let currentPassword;
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
          user.setPassword = function (password) {
            if (password === 'badpassword') {
              throw new Error('bad password');
            }

            currentPassword = password;
          }

          return user;
        }
      }
    }
  };

  beforeEach(() => {
    users = DEFAULT_USERS.map(defUser => ({ ...defUser }));
    currentPassword = 'oldpw';
  });

  afterEach(() => {
  });

  it('should export correct data', () => {
    const exportedFunctions = ['doPut'];
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

  it('should handle good PW for known user', async () => {
    let username = 'ihulk';
    let password = 'hulk_smash_999!'
    let data = {
      password
    };
    await api.doPut({ username, data, req });
    expect(currentPassword).to.equal(password);
  });

  it('should handle uknown user', (done) => {
    let username = 'missing';
    req.path = `/api/users/${username}/password`;
    let password = 'mypw'
    let data = {
      password
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
    let password = 'badpassword'
    let data = {
      password
    };
    api.doPut({ username, data, req }).then(() => {
      done(new Error('Should have thrown an error and did not.'));
    }).catch((ex) => {
      expect(ex.status).to.equal(400);
      expect(ex.title).to.equal('bad password');
      expect(ex.data).to.equal(`Unable to set 'password' for the user ${username}`);
      done();
    });
  });
});
