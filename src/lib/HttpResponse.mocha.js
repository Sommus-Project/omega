/* eslint-env mocha */
const expect = require('chai').expect;
const HttpResponse = require('./HttpResponse');

describe('HttpResponse tests', function() {
  it('should init', function() {
    expect(HttpResponse).to.be.a('function');
  });

  it('should be proper class', function() {
    var a = new HttpResponse({});
    expect(a).to.be.an.instanceof(HttpResponse);
  });

  it('should be proper class', function() {
    var a = new HttpResponse({a:'b'}, 'tacos');
    expect(a.data).to.equal('tacos');
    expect(a.headers).to.eql({a:'b'});
  });

  it('should handle no parameters', function() {
    function doit() {
      new HttpResponse(); // eslint-disable-line no-new
    }
    expect(doit).to.throw(TypeError);
  });

  it('should handle null for headers', function() {
    function doit() {
      new HttpResponse(null); // eslint-disable-line no-new
    }
    expect(doit).to.throw(TypeError);
  });

  it('should handle non-object for headers', function() {
    function doit() {
      new HttpResponse('test'); // eslint-disable-line no-new
    }
    expect(doit).to.throw(TypeError);
  });
});
