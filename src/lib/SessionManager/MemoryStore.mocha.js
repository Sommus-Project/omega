/* eslint-env mocha */
const { expect } = require('chai');
const MemoryStore = require('./MemoryStore');

const sleep = time => new Promise(resolve => setTimeout(() => resolve(), time));

describe('Tests for SessionManager/MemoryStore.js', () => {
  let store;
  afterEach(async () => {
    if (store) {
      await store.destroy();
      store = null;
    }
  });

  it('should be a function/class', () => {
    expect(MemoryStore).to.be.a('function');
    store = new MemoryStore(1);
    expect(store instanceof MemoryStore).to.equal(true);
  });

  it('should add sessions and get users from sessionId', async () => {
    store = new MemoryStore(20);
    await store.addSession('session1', 'cooluser', 'default');
    expect(Object.keys(store._sessions)).to.eql(['session1']);
    expect(store._sessions.session1.username).to.eql('cooluser');
    await store.addSession('sessionA', 'other', 'default');
    await store.addSession('session2', 'cooluser', 'default');
    expect(Object.keys(store._sessions)).to.eql(['session1', 'sessionA', 'session2']);
    expect(store._sessions.session2.username).to.equal('cooluser');
    expect(store._sessions.sessionA.username).to.equal('other');
    expect((await store.getUserFromSession('session1')).username).to.equal('cooluser', 'session1 -> cooluser');
    expect((await store.getUserFromSession('sessionA')).username).to.equal('other', 'sessionA -> other');
    expect((await store.getUserFromSession('session2')).username).to.equal('cooluser', 'session2 -> cooluser');
    expect(await store.getUserFromSession('dsadas')).to.equal(undefined, 'dsadas -> undefined');
  });

  it('should add and remove sessions', async () => {
    store = new MemoryStore(20);
    await store.addSession('session1', 'cooluser', 'default');
    await store.addSession('session2', 'cooluser', 'default');
    await store.invalidateSession('session1');
    await store.addSession('sessionA', 'other', 'default');
    expect(Object.keys(store._sessions)).to.eql(['session2', 'sessionA']);
    expect(store._sessions.session2.username).to.equal('cooluser');
    expect(store._sessions.sessionA.username).to.equal('other');
    expect(await store.getUserFromSession('session1')).to.equal(undefined, 'session1 -> undefined');
    expect((await store.getUserFromSession('sessionA')).username).to.equal('other', 'sessionA -> other');
    expect((await store.getUserFromSession('session2')).username).to.equal('cooluser', 'session2 -> cooluser');
    await store.invalidateSession('session2');
    await store.invalidateSession('sessionA');
    expect(store._sessions).to.eql({});
  });

  it('should invalidate users', async () => {
    store = new MemoryStore(20);
    await store.addSession('session1', 'cooluser', 'default');
    await store.addSession('session1a', 'cooluser', 'default');
    await store.addSession('sessionA', 'other', 'default');
    await store.addSession('session2', 'dogs', 'default');
    expect(Object.keys(store._sessions)).to.eql(['session1', 'session1a', 'sessionA', 'session2']);
    expect(store._sessions.session1.username).to.equal('cooluser');
    expect(store._sessions.sessionA.username).to.equal('other');
    expect(store._sessions.session2.username).to.equal('dogs');
    await store.invalidateUser('cooluser', 'default');
    expect(Object.keys(store._sessions)).to.eql(['sessionA', 'session2']);
  });

  it('should work with touch', async () => {
    store = new MemoryStore(20);
    await store.addSession('session1', 'cooluser', 'default');
    let oldExpires = store._sessions.session1.expires;
    await sleep(10);
    await store.getUserFromSession('session1', true);
    let newExpires = store._sessions.session1.expires;
    expect(oldExpires < newExpires).to.equal(true);
  });

  it('should touch a valid session', async () => {
    store = new MemoryStore(20);
    await store.addSession('session1', 'cooluser', 'default');
    let oldExpires = store._sessions.session1.expires;
    await sleep(10);
    await store.touchSession('session1');
    let newExpires = store._sessions.session1.expires;
    expect(oldExpires < newExpires).to.equal(true);
  });

  it('should clear session after timeout', async () => {
    store = new MemoryStore(1, true);
    await store.addSession('session1', 'cooluser', 'default');
    await sleep(200);
    expect(store._sessions).to.eql({});
  });

  it('should get expires time for valid session', async () => {
    const TIMEOUT = 15;
    store = new MemoryStore(TIMEOUT);
    await store.addSession('session1', 'cooluser', 'default');
    await sleep(10);
    let expTime = await store.getRemainingTime('session1');
    expect(expTime).to.equal(14 * 60 + 59);
  });

  it('should get expires time for an invalid session', async () => {
    store = new MemoryStore(20);
    let expTime = await store.getRemainingTime('dsadsa');
    expect(expTime).to.equal(0);
  });

  it('should prevent reuse of same sessionId', async () => {
    store = new MemoryStore(20);
    await store.addSession('session1', 'cooluser', 'default');
    try {
      await store.addSession('session1', 'dcooluser', 'default');
      expect('An exception should have been thrown and was not').to.equal(true);
    }

    catch (ex) {
      expect(ex.message).to.equal('Invalid SessionId');
    }
  });

  it('should fail without a number for timeout', async () => {
    try {
      store = new MemoryStore();
      expect('An exception should have been thrown and was not').to.equal(true);
    }

    catch (ex) {
      expect(ex.message).to.equal('MemoryStore Error: "timeout" must be a number from 1 to 60.');
    }
  });

  it('should fail with a number < 1', async () => {
    try {
      store = new MemoryStore();
      expect('An exception should have been thrown and was not').to.equal(true);
    }

    catch (ex) {
      expect(ex.message).to.equal('MemoryStore Error: "timeout" must be a number from 1 to 60.');
    }
  });

  it('should fail with a number > 60', async () => {
    try {
      store = new MemoryStore();
      expect('An exception should have been thrown and was not').to.equal(true);
    }

    catch (ex) {
      expect(ex.message).to.equal('MemoryStore Error: "timeout" must be a number from 1 to 60.');
    }
  });
});