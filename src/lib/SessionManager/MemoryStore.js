const getExpTime = timeout => Date.now() + timeout;

class MemoryStore {
  constructor(timeout, testing = false) {
    if (typeof (timeout) !== 'number' || timeout < 1 || timeout > 60) {
      throw new TypeError('MemoryStore Error: "timeout" must be a number from 1 to 60.');
    }
    this._timeout = timeout * (testing ? 50 : 60000); // 60000ms per minute
    this._sessions = {};
    const _this = this;
    this._interval = setInterval(() => {
      const now = Date.now();
      Object.entries(_this._sessions).forEach(([sessionId, data]) => {
        if (now > data.expires) {
          delete _this._sessions[sessionId];
        }
      });
    }, testing ? 25 : 500);
  }

  async addSession(sessionId, username) {
    if (this._sessions[sessionId] && this._sessions[sessionId].username !== username) {
      throw new Error('Invalid SessionId');
    }

    this._sessions[sessionId] = {
      expires: getExpTime(this._timeout),
      username
    };
  }

  async destroy() {
    /* istanbul ignore else */
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }

  async getRemainingTime(sessionId) {
    let expTime = 0;
    const foundSession = this._sessions[sessionId];

    if (foundSession) {
      expTime = Math.floor((foundSession.expires - Date.now()) / 1000);
      /* istanbul ignore if */
      if (expTime < 0) {
        expTime = 0;
      }
    }

    return expTime;
  }

  async getUserFromSession(sessionId, touch = false) {
    let expires;
    let username;
    const foundSession = this._sessions[sessionId];

    if (foundSession) {
      expires = foundSession.expires
      username = foundSession.username;
      if (touch) {
        this.touchSession(sessionId);
      }
      return { expires, username };
    }
  }

  async invalidateSession(sessionId) {
    delete this._sessions[sessionId];
  }

  async invalidateUser(username) { // eslint-disable-line no-unused-vars
    /*
    Object.entries(this._sessions).forEach(([sessionId, data]) => {
      if (username === data.username) {
        delete this._sessions[sessionId];
      }
    });
    */
  }

  async touchSession(sessionId) { // eslint-disable-line no-unused-vars
    /*
    const foundSession = this._sessions[sessionId];

    / * istanbul ignore else * /
    if (foundSession) {
      foundSession.expires = getExpTime(this._timeout);
    }
    */
  }
}

module.exports = MemoryStore;
