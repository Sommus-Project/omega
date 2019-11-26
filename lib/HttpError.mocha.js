/* eslint-env mocha */
const expect = require('chai').expect;
const HttpError = require('./HttpError');

describe('HttpError tests', function() {
  it('should init', function() {
    expect(HttpError).to.be.a('function');
  });

  it('should be proper class', function() {
    var a = new HttpError(404);
    expect(a).to.be.an.instanceof(HttpError);
    expect(a).to.be.an.instanceof(Error);
  });

  it('should handle just a response code', function() {
    var a = new HttpError(404);
    expect(a.status).to.equal(404);
    expect(a.options).to.eql({});
    expect(a.message).to.equal(HttpError.MESSAGES[404]);
  });

  it('should handle a title', function() {
    var title = "Be Mine!";
    var a = new HttpError(599, {title});
    expect(a.status).to.equal(599);
    expect(a.title).to.equal(title);
    expect(a.headers).to.equal(undefined);
    expect(a.data).to.equal(undefined);
    expect(a.message).to.equal(HttpError.MESSAGES[599]);
  });

  it('should handle headers', function() {
    var headers = {
      x: 1,
      b: 2
    }
    var a = new HttpError(500, {headers});
    expect(a.status).to.equal(500);
    expect(a.title).to.equal(undefined);
    expect(a.headers).to.eql(headers);
    expect(a.data).to.equal(undefined);
    expect(a.message).to.equal(HttpError.MESSAGES[500]);
  });
});
