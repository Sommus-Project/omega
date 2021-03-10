/* eslint-env mocha */
const { expect } = require('chai');
const loadapi = require('../lib/test/loadapi');
const apiquire = loadapi('src/api', __dirname);
const api = apiquire('./groups');

describe('Tests for API: src/api/groups.js', () => {
  let testData = {};
  let groups = [];
  const req = {
    user: {
      username: 'tomthumb'
    },
    query: {
      /*
      start
      limit
      order
      */
    },
    dirService: { // eslint-disable-line no-unused-vars
      createGroup(name, description, users) { // eslint-disable-line no-unused-vars
        testData.greateGroup = { name, description, users };
      },
      getGroups() {
        return groups;
      }
    }
  };

  beforeEach(() => {
    groups = [
      'yours',
      'mine',
      'ours'
    ];
    testData = {};
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
        expect(api[fn].auth).to.eql(['group-edit']);
        expect(api[fn].loggedIn).to.equal(undefined);
      }
    );
  });

  describe('Tests for doGet', () => {
    it('should provide a response', async () => {
      const allGroups = await api.doGet({ req });
      expect(allGroups).to.eql(groups);
    });
  });

  describe('Tests for doPost', () => {
    it('should handle no name', (done) => {
      const data = {};
      api.doPost({ data, req }).then(
        () => {
          done(new Error('Should have thrown but did not.'));
        }
      ).catch(
        ex => {
          expect(ex.status).to.equal(400);
          expect(ex.message).to.equal('Bad Request');
          expect(ex.title).to.equal('You must provide a group "name".');
          done();
        }
      );
    });

    it('should handle no description', (done) => {
      const data = {
        name: 'testing'
      };
      api.doPost({ data, req }).then(
        () => {
          done(new Error('Should have thrown but did not.'));
        }
      ).catch(
        ex => {
          expect(ex.status).to.equal(400);
          expect(ex.message).to.equal('Bad Request');
          expect(ex.title).to.equal('You must provide a group "description".');
          done();
        }
      );
    });

    it('should handle bad var type for users', (done) => {
      const data = {
        name: 'testing',
        description: "This is a test group",
        users: 'users'
      };
      api.doPost({ data, req }).then(
        () => {
          done(new Error('Should have thrown but did not.'));
        }
      ).catch(
        ex => {
          expect(ex.status).to.equal(400);
          expect(ex.message).to.equal('Bad Request');
          expect(ex.title).to.equal('"users" must be null or an array of usernames.');
          done();
        }
      );
    });

    it('should handle no users', async () => {
      const data = {
        name: 'testing',
        description: "This is a test group"
      };
      await api.doPost({ data, req })
      expect(testData.greateGroup).to.eql({ ...data, users: undefined });
    });
  });
});
