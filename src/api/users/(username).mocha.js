/* eslint-env mocha */
const { expect } = require('chai');
const loadapi = require('../../lib/test/loadapi');
const HttpError = require('../../lib/HttpError');
const NoEntityError = require('../../lib/directoryService/errors/NoEntityError');
const apiquire = loadapi('src/api', __dirname);
const ERROR_MESSAGE_400 = 'You can not delete yourself.';
const ERROR_MESSAGE_500 = 'Dogs and cats living together.';
const api = apiquire('./(username)');

describe('Tests for API: src/api/users/(username).js', () => {
  let users = {};
  const req = {
    user: {
      username: 'tomthumb',
      domain: 'default'
    },
    dirService(domain) { // eslint-disable-line no-unused-vars
      return {
        deleteUser(username) {
          const user = users[username];
          if (user) {
            delete users[username];
            return;
          }

          throw new NoEntityError('failed');
        },
        getUser(username) {
          if (username === 'error') {
            throw new HttpError(500, ERROR_MESSAGE_500);
          }

          const user = users[username];
          if (user) {
            return user;
          }

          throw new NoEntityError('failed');
        }
      }
    }
  };

  beforeEach(() => {
    users = {};
  });

  afterEach(() => {
  });

  it('should export correct data', () => {
    const exportedFunctions = ['doGet', 'doDelete'];
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

  it('should provide a response on doGet', async () => {
    const username = 'tester';
    users[username] = { desc: "This is the response" };
    var resp = await api.doGet({ username, req });
    expect(resp).to.eql(users[username]);
  });

  it('should handle 404 error on doGet', () => {
    const username = 'tester';
    req.path = `/api/users/${username}`
    api.doGet({ username, req }).then(
      () => {
        throw new Error('Should have thrown but did not.');
      }
    ).catch(
      ex => {
        expect(ex.status).to.equal(404);
        expect(ex.message).to.equal('Not Found');
        expect(ex.title).to.equal('User tester not found.');
        expect(ex.headers).to.eql({ 'X-No-Entity': req.path });
      }
    );
  });

  it('should handle other error on doGet', (done) => {
    const username = 'error';
    api.doGet({ username, req }).then(
      () => {
        done(new Error('Should have thrown but did not.'));
      }
    ).catch(
      ex => {
        expect(ex.status).to.equal(500);
        expect(ex.message).to.equal('Internal Server Error');
        expect(ex.title).to.equal(ERROR_MESSAGE_500);
        done();
      }
    );
  });

  it('should handle doDelete', () => {
    const username = 'tester';
    users[username] = { desc: "This is the response" };
    return api.doDelete({ username, req });
  });

  it('should not fail on missing user in doDelete', () => {
    const username = 'tester';
    return api.doDelete({ username, req });
  });


  it('should not user to delete themself in doDelete', (done) => {
    const username = req.user.username;
    api.doDelete({ username, req }).then(
      () => {
        done(new Error('Should have throw but did not.'))
      }
    ).catch(
      ex => {
        expect(ex.status).to.equal(400);
        expect(ex.message).to.equal('Bad Request');
        expect(ex.title).to.equal(ERROR_MESSAGE_400);
        done();
      }
    );
  });
});