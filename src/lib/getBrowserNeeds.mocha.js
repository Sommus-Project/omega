/* eslint-env mocha */
const expect = require('chai').expect;
const getBrowserNeeds = require('./getBrowserNeeds');
var acceptsVal = '';
var loadData = {};
var mockReq = {
  cookies: {},
  accepts() {
    return acceptsVal || '*/*';
  }
};

var mockRes = {
  clearCookie(key) { // eslint-disable-line no-unused-vars
    loadData.cookie = null;
  },
  cookie(key, value) {
    loadData.cookie = {key, value};
  },
  render(view, options) {
    loadData.render = {view, options};
  },
  locals: {}
};

describe('getBrowserNeeds.js tests', function() {
  beforeEach(() => {
    loadData = {};
    mockReq.cookies = {};
    mockRes.locals = {};
  });

  it('should init', function() {
    expect(getBrowserNeeds).to.be.a('function');
  });

  it('should handle no cookie with html file', function() {
    acceptsVal = 'html';
    getBrowserNeeds(mockReq, mockRes, () => {
      throw new Error('`next` should not have been called.')
    });

    expect(loadData.render.view).to.equal('cookiesetter');
    expect(loadData.cookie).to.equal(null);
    expect(loadData.render.options).to.eql({_layoutFile: false});
  });

  it('should handle no cookie with js file', function() {
    var nextCalled = false;
    acceptsVal = 'js';
    getBrowserNeeds(mockReq, mockRes, () => {
      nextCalled = true;
    });

    expect(nextCalled).to.equal(true);
  });

  it('should handle cookie', function() {
    var nextCalled = false;
    acceptsVal = 'html';
    mockReq.cookies.browserNeeds = '{"dogs":2,"cats":3}';
    getBrowserNeeds(mockReq, mockRes, () => {
      nextCalled = true;
    });

    var expected = {dogs:2, cats:3, ver:getBrowserNeeds.VERSION};
    expect(nextCalled).to.equal(true);
    expect(mockRes.locals.browserNeeds).to.eql(expected);
    expect(loadData.cookie.key).to.equal('browserNeeds');
    var val = JSON.parse(loadData.cookie.value);
    expect(val).to.eql(expected);
  });

  it('should handle set cookie', function() {
    var nextCalled = false;
    acceptsVal = 'html';
    mockReq.cookies.browserNeeds = `{"dogs":9,"cats":43,"ver":${getBrowserNeeds.VERSION}}`;
    getBrowserNeeds(mockReq, mockRes, () => {
      nextCalled = true;
    });

    var expected = {dogs:9, cats:43, ver: getBrowserNeeds.VERSION};
    expect(nextCalled).to.equal(true);
    expect(mockRes.locals.browserNeeds).to.eql(expected);
    expect(Object.keys(loadData).length).to.equal(0);
  });
});
