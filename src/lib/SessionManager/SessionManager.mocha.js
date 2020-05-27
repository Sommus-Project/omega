/* eslint-env mocha */
const { expect } = require('chai');
const MemoryStore = require('./MemoryStore');
const SessionManager = require('./SessionManager');

const sleep = time => new Promise(resolve => setTimeout(() => resolve(), time));

describe('Tests for SessionManager/SessionManager.js', () => {
  let sessionManager;
  afterEach(async () => {
    if (sessionManager) {
      await sessionManager.destroy();
      sessionManager = null;
    }
  });

  it('should be a function/class', () => {
    expect(SessionManager).to.be.a('function');
    sessionManager = new SessionManager();
    expect(sessionManager).to.be.an.instanceof(SessionManager);
  });

  it('should initialize with an empty object', () => {
    sessionManager = new SessionManager({});
    expect(sessionManager._stores.length).to.equal(1);
    expect(sessionManager._stores[0]).to.be.an.instanceof(MemoryStore);
  });

  it('should initialize with a "memory" object', () => {
    sessionManager = new SessionManager({ memory: 20 });
    expect(sessionManager._stores.length).to.equal(1);
    expect(sessionManager._stores[0]).to.be.an.instanceof(MemoryStore);
  });

  it('should initialize with a "redis" object', () => {
    sessionManager = new SessionManager({ redis: 20 });
    expect(sessionManager._stores.length).to.equal(0);
  });

  it('should fail when constructing with a non-object', () => {
    function test() {
      sessionManager = new SessionManager(20);
    }

    expect(test).to.throw();
  });

  it('should add sessions and get users from sessionId', async () => {
    sessionManager = new SessionManager();
    await sessionManager.addSession('session1', 'cooluser', 'default');
    expect(Object.keys(sessionManager._stores[0]._sessions)).to.eql(['session1']);
    expect(sessionManager._stores[0]._sessions.session1.username).to.eql('cooluser');
    await sessionManager.addSession('sessionA', 'other', 'default');
    await sessionManager.addSession('session2', 'cooluser', 'default');
    expect(Object.keys(sessionManager._stores[0]._sessions)).to.eql(['session1', 'sessionA', 'session2']);
    expect(sessionManager._stores[0]._sessions.session2.username).to.equal('cooluser');
    expect(sessionManager._stores[0]._sessions.sessionA.username).to.equal('other');
    expect((await sessionManager.getUserFromSession('session1')).username).to.equal('cooluser', 'session1 -> cooluser');
    expect((await sessionManager.getUserFromSession('sessionA')).username).to.equal('other', 'sessionA -> other');
    expect((await sessionManager.getUserFromSession('session2')).username).to.equal('cooluser', 'session2 -> cooluser');
    expect(await sessionManager.getUserFromSession('dsadas')).to.equal(undefined, 'dsadas -> undefined');
  });

  it('should add and remove sessions', async () => {
    sessionManager = new SessionManager();
    await sessionManager.addSession('session1', 'cooluser', 'default');
    await sessionManager.addSession('session2', 'cooluser', 'default');
    await sessionManager.invalidateSession('session1');
    await sessionManager.addSession('sessionA', 'other', 'default');
    expect(Object.keys(sessionManager._stores[0]._sessions)).to.eql(['session2', 'sessionA']);
    expect(sessionManager._stores[0]._sessions.session2.username).to.equal('cooluser');
    expect(sessionManager._stores[0]._sessions.sessionA.username).to.equal('other');
    expect(await sessionManager.getUserFromSession('session1')).to.equal(undefined, 'session1 -> undefined');
    expect((await sessionManager.getUserFromSession('sessionA')).username).to.equal('other', 'sessionA -> other');
    expect((await sessionManager.getUserFromSession('session2')).username).to.equal('cooluser', 'session2 -> cooluser');
    await sessionManager.invalidateSession('session2');
    await sessionManager.invalidateSession('sessionA');
    expect(sessionManager._stores[0]._sessions).to.eql({});
  });

  it('should invalidate users', async () => {
    sessionManager = new SessionManager();
    await sessionManager.addSession('session1', 'cooluser', 'default');
    await sessionManager.addSession('session1a', 'cooluser', 'default');
    await sessionManager.addSession('sessionA', 'other', 'default');
    await sessionManager.addSession('session2', 'dogs', 'default');
    expect(Object.keys(sessionManager._stores[0]._sessions)).to.eql(['session1', 'session1a', 'sessionA', 'session2']);
    expect(sessionManager._stores[0]._sessions.session1.username).to.equal('cooluser');
    expect(sessionManager._stores[0]._sessions.sessionA.username).to.equal('other');
    expect(sessionManager._stores[0]._sessions.session2.username).to.equal('dogs');
    await sessionManager.invalidateUser('cooluser', 'default');
    expect(Object.keys(sessionManager._stores[0]._sessions)).to.eql(['sessionA', 'session2']);
  });

  it('should work with touch', async () => {
    sessionManager = new SessionManager();
    await sessionManager.addSession('session1', 'cooluser', 'default');
    let oldExpires = sessionManager._stores[0]._sessions.session1.expires;
    await sleep(10);
    await sessionManager.getUserFromSession('session1', true);
    let newExpires = sessionManager._stores[0]._sessions.session1.expires;
    expect(oldExpires < newExpires).to.equal(true);
  });

  it('should touch a valid session', async () => {
    sessionManager = new SessionManager();
    await sessionManager.addSession('session1', 'cooluser', 'default');
    let oldExpires = sessionManager._stores[0]._sessions.session1.expires;
    await sleep(10);
    await sessionManager.touchSession('session1');
    let newExpires = sessionManager._stores[0]._sessions.session1.expires;
    expect(oldExpires < newExpires).to.equal(true);
  });

  it('should get expires time for valid session', async () => {
    const TIMEOUT = 15;
    sessionManager = new SessionManager({ memory: TIMEOUT });
    await sessionManager.addSession('session1', 'cooluser', 'default');
    await sleep(10);
    let expTime = await sessionManager.getRemainingTime('session1');
    expect(expTime).to.equal(14 * 60 + 59);
  });

  it('should get expires time for an invalid session', async () => {
    sessionManager = new SessionManager();
    let expTime = await sessionManager.getRemainingTime('dsadsa');
    expect(expTime).to.equal(0);
  });

  it('should prevent reuse of same sessionId', async () => {
    sessionManager = new SessionManager();
    await sessionManager.addSession('session1', 'cooluser', 'default');
    try {
      await sessionManager.addSession('session1', 'dcooluser', 'default');
      expect('An exception should have been thrown and was not').to.equal(true);
    }

    catch (ex) {
      expect(ex.message).to.equal('Invalid SessionId');
    }
  });
});
