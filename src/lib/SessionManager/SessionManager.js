const crypto = require('crypto');
const MemoryStore = require('./MemoryStore');
//const RedisStore = require('./RedisStore');
const asyncForEach = require('../asyncForEach');
const asyncSome = require('../asyncSome');
const DEFAULT_TIMEOUT = 20; // 20 minutes

class SessionManager {
  constructor(options = { memory: DEFAULT_TIMEOUT }) {
    if (typeof (options) !== 'object') {
      throw new TypeError('SessionManager Error: "options" must be an object.');
    }
    this._stores = [];

    const opts = { ...options };
    if (!opts.redis && !opts.memory) {
      opts.memory = DEFAULT_TIMEOUT;
    }

    if (opts.memory) {
      this._stores.push(new MemoryStore(opts.memory));
    }

    // if(options.redis) {
    //   this._store.push(new RedisStore(options.redis));
    // }
  }

  async destroy() {
    await asyncForEach(this._stores, async store => await store.destroy());
  }

  async createSession(username, provider) {
    const hash = crypto.createHash('sha256');
    hash.update(username + Date.now());
    const sessionId = hash.digest('hex');
    await this.addSession(sessionId, username, provider);
    return sessionId;
  }

  async getRemainingTime(sessionId) {
    let expTime = 0;
    let temp;
    await asyncSome(this._stores, async store => {
      temp = await store.getRemainingTime(sessionId);
      if (temp) {
        expTime = temp;
        return true;
      }
    });

    return expTime;
  }

  async getUserFromSession(sessionId, touch = false) {
    let retVal;
    let temp;
    await asyncSome(this._stores, async store => {
      temp = await store.getUserFromSession(sessionId, touch);
      if (temp) {
        retVal = temp;
        return true;
      }
    });

    return retVal;
  }

  async touchSession(sessionId) {
    await asyncForEach(this._stores, async store => await store.touchSession(sessionId));
  }

  async addSession(sessionId, username, provider) {
    await asyncForEach(this._stores, async store => await store.addSession(sessionId, username, provider));
  }

  async invalidateSession(sessionId) {
    await asyncForEach(this._stores, async store => await store.invalidateSession(sessionId));
  }

  async invalidateUser(username, provider) {
    await asyncForEach(this._stores, async store => await store.invalidateUser(username, provider));
  }
}

module.exports = SessionManager;
