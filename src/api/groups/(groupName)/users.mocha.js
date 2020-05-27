/* eslint-env mocha */
const { expect } = require('chai');
const path = require('path');
const loadapi = require('../../../lib/test/loadapi');
const InvalidActionError = require('../../../lib/directoryService/errors/InvalidActionError');
const InvalidGroupError = require('../../../lib/directoryService/errors/InvalidGroupError');
const apiquire = loadapi('src/api', __dirname);

const api = apiquire('./users');

describe('Tests for API: src/api/groups/(groupName)/users.js', () => {
  let groups = {};
  const req = {
    user: {
      username: 'tomthumb',
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
        setUsersForGroup(groupName, memberList, isNewGroup) { // eslint-disable-line no-unused-vars
          if (groupName === 'error') {
            throw new Error("Oops!");
          }

          const group = groups[groupName];
          if (!group) {
            throw new InvalidGroupError(`The group "${groupName}" is not a valid group.`);
          }

          const user = 'baduser';
          if (memberList.includes(user)) {
            throw new InvalidActionError('NOT_MODIFIABLE', `The user "${user}" is not modifiable`);
          }

          groups[groupName].users = memberList;
        },
        getGroupUsers(groupName, ranges) { // eslint-disable-line no-unused-vars
          const group = groups[groupName];
          if (group) {
            return group.users;
          }

          return false;
        }
      }
    }
  };

  beforeEach(() => {
    groups = {};
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
        expect(api[fn].auth).to.eql(['group-edit']);
        expect(api[fn].loggedIn).to.equal(undefined);
      }
    );
  });

  describe('test doGet', () => {
    it('should provide a response', async () => {
      const groupName = 'test';
      req.path = `/api/groups/${groupName}/users`;
      const groupInfo = { users: ['one', 'two', 'three'] };
      groups[groupName] = groupInfo;
      const users = await api.doGet({ req, groupName })
      expect(users).to.eql(groupInfo.users);
    });

    it('should handle missing group', (done) => {
      const groupName = 'test';
      req.path = `/api/groups/${groupName}/users`;
      api.doGet({ req, groupName }).then(() => {
        done(new Error('should have thrown a 404 HttpError and did not.'));
      }).catch((ex) => {
        expect(ex.status).to.equal(404);
        expect(ex.headers['X-No-Entity']).to.equal(path.dirname(req.path));
        expect(ex.title).to.equal(`The group "${groupName}" does not exist.`);
        done();
      });
    });
  });

  describe('test doPut', () => {
    it('should provide a response', (done) => {
      const groupName = 'test';
      req.path = `/api/groups/${groupName}/users`;
      const groupInfo = { users: ['one', 'two', 'three'] };
      groups[groupName] = groupInfo;
      const data = { users: ['darth', 'gandalf', 'picard'] };
      api.doPut({ groupName, data, req }).then(() => {
        expect(groups[groupName].users).to.eql(data.users);
        done();
      }).catch((ex) => {
        done(ex);
      });
    });

    it('should handle bad user list', (done) => {
      const groupName = 'test';
      req.path = `/api/groups/${groupName}/users`;
      const data = { users: 'darth' };
      api.doPut({ groupName, data, req }).then(() => {
        done(new Error('should have thrown a 400 HttpError and did not.'));
      }).catch((ex) => {
        expect(ex.status).to.equal(400);
        expect(ex.title).to.equal('"users" must be passed in as an array');
        done();
      });
    });

    it('should handle invalid group', (done) => {
      const groupName = 'test';
      req.path = `/api/groups/${groupName}/users`;
      const data = { users: ['darth', 'gandalf', 'picard'] };
      api.doPut({ groupName, data, req }).then(() => {
        done(new Error('should have thrown a 404 HttpError and did not.'));
      }).catch((ex) => {
        expect(ex.status).to.equal(404);
        expect(ex.headers['X-No-Entity']).to.equal(path.dirname(req.path));
        expect(ex.title).to.equal(`The group "${groupName}" is not a valid group.`);
        done();
      });
    });

    it('should handle locked user', (done) => {
      const groupName = 'test';
      req.path = `/api/groups/${groupName}/users`;
      const groupInfo = { users: ['one', 'two', 'three'] };
      groups[groupName] = groupInfo;
      const data = { users: ['darth', 'gandalf', 'baduser', 'picard'] };
      api.doPut({ groupName, data, req }).then(() => {
        done(new Error('should have thrown a 404 HttpError and did not.'));
      }).catch((ex) => {
        expect(ex.status).to.equal(403);
        expect(ex.title).to.equal(`The user "baduser" is not modifiable`);
        done();
      });
    });
  });
});
