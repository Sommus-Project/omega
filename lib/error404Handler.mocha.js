/* eslint-env mocha */
const expect = require('chai').expect;
const error404Handler = require('./error404Handler');

describe('error404Handler tests', function() {

  beforeEach(() => {
  });

  afterEach(() => {
  });

  it('should init', function() {
    expect(error404Handler).to.be.a('function');
  });

  it('should always call next with a 404 object', function() {
    error404Handler(null, null, obj => {
      expect(obj).to.be.an('object');
      expect(obj.status).to.equal(404);
      expect(obj.title).to.equal('This page cannot be found');
      expect(obj.message).to.equal('Recheck the url or contact your website administrator.');
    })
  });
});
