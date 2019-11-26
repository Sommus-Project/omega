/* eslint-env mocha */
const expect = require('chai').expect;
const HttpResponse = require('./HttpResponse');
const EntityCreated = require('./EntityCreated');

describe('EntityCreated tests', function() {
  it('should init', function() {
    expect(EntityCreated).to.be.a('function');
  });

  it('should be proper class', function() {
    var a = new EntityCreated('location', 'description');
    expect(a).to.be.an.instanceof(EntityCreated);
    expect(a).to.be.an.instanceof(HttpResponse);
  });

  it('should handle just a location', function() {
    var a = new EntityCreated('my location');
    expect(a.headers.location).to.equal('my location');
    expect(a.status).to.equal(201);
    expect(a.data).to.equal(undefined);
  });

  it('should handle query params', function() {
    var a = new EntityCreated('mylocation?dogs');
    expect(a.headers.location).to.equal('mylocation');
    expect(a.status).to.equal(201);
    expect(a.data).to.equal(undefined);
  });

  it('should handle a description', function() {
    var a = new EntityCreated('location', 'my description');
    expect(a.status).to.equal(201);
    expect(a.data).to.equal('my description');
    expect(a.headers).to.be.an('object');
    expect(a.headers.location).to.equal('location');
  });

  it('should handle bad location', function(done) {
    try {
      let a = new EntityCreated(500); // eslint-disable-line no-unused-vars
      done('Should have thrown an function and did not.');
    }

    catch(ex) {
      expect(ex).to.be.instanceof(TypeError);
      expect(ex.message).to.equal('You must provide the URL location of the new resource.');
      done();
    }
  });
});
