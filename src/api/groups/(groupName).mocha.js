/* eslint-env mocha */
const { expect } = require('chai');
const loadapi = require('../../lib/test/loadapi');
const InvalidActionError = require('../../lib/directoryService/errors/InvalidActionError');
const apiquire = loadapi('src/api', __dirname);

const api = apiquire('./(groupName)');

describe('Tests for API: src/api/groups/(groupName).js', () => {
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
        deleteGroup(groupName) {
          if (groupName === 'error') {
            throw new Error("Oops!");
          }

          const group = groups[groupName];
          if (!group) {
            throw new InvalidActionError('NOT_FOUND', `Group ${groupName} was not found.`);
          }

          if (!group.removable) {
            throw new InvalidActionError('UNABLE_TO_DELETE', `Group ${groupName} is non-removable`);
          }

          delete groups[groupName];
        },
        getGroup(groupName) {
          return groups[groupName];
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
    const exportedFunctions = ['doGet', 'doDelete'];
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
      const groupName = 'tacos';
      groups[groupName] = { name: groupName };
      expect(await api.doGet({ req, groupName })).to.eql(groups[groupName]);
    });

    it('should handle a 404', (done) => {
      const groupName = 'tacos';
      groups.bells = { name: 'bells' };
      api.doGet({ req, groupName }).then(() => {
        done(new Error('should have thrown a 404 HttpError and did not.'));
      }).catch((ex) => {
        expect(ex.status).to.equal(404);
        expect(ex.title).to.equal('The group "tacos" does not exist.')
        done();
      });
    });
  });

  describe('test doDelete', () => {
    it('should delete existing group', async () => {
      const groupName = 'tacos';
      groups[groupName] = { name: groupName, removable: true };
      await api.doDelete({ req, groupName })
      expect(groups[groupName]).to.equal(undefined);
    });

    it('should do nothing for a non-existing group', async () => {
      const groupName = 'tacos';
      const groupData = { name: 'bells', removable: true };
      groups.bells = groupData;
      expect(await api.doDelete({ req, groupName })).to.equal(undefined)
      expect(groups[groupName]).to.equal(undefined);
      expect(groups).to.eql({ bells: groupData });
    });

    it('should throw 403 error for a non-removable group', (done) => {
      const groupName = 'tacos';
      const groupData = { name: groupName, removable: false };
      groups[groupName] = groupData;
      api.doDelete({ req, groupName }).then(() => {
        done(new Error('should have thrown a 403 HttpError and did not.'));
      }).catch((ex) => {
        expect(ex.status).to.equal(403);
        expect(ex.title).to.equal(`Group ${groupName} is non-removable`)
        done();
      });
    });

    it('should handle odd errors', (done) => {
      const groupName = 'error';
      api.doDelete({ req, groupName }).then(() => {
        done(new Error('should have thrown an Error and did not.'));
      }).catch((ex) => {
        expect(ex.message).to.equal(`Oops!`)
        done();
      });
    });
  });
});
