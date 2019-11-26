/* eslint-env mocha */
const expect = require('chai').expect;
const getServerInfo = require('./getServerInfo');

describe('getServerInfo.js tests', function () {
  const serverLookup = {
    default: { protocol:'https', hostname:'default', port: 1 },
    dog: { protocol:'https', hostname:'dog', port: 2 },
    cat: { protocol:'http', hostname: 'cat', port: 3 }
  };

  it('should init', function () {
    expect(getServerInfo).to.be.a('function');
    const temp = getServerInfo(serverLookup);
    expect(temp).to.be.an('object');
    expect(Object.keys(temp).length).to.equal(2);
    expect(temp.getServerInfo).to.be.a('function');
    expect(temp.getServerStr).to.be.a('function');
  });

  describe('getServerInfo.getServerInfo calls', function () {
    const temp = getServerInfo(serverLookup);

    it('should work with known server names', function () {
      expect(temp.getServerInfo('dog')).to.eql(serverLookup.dog);
      expect(temp.getServerInfo('cat')).to.eql(serverLookup.cat);
    });

    it('should work with unknown server name', function () {
      expect(temp.getServerInfo('fish')).to.eql(serverLookup.default);
    });
  });

  describe('getServerInfo.getServerStr calls', function () {
    const temp = getServerInfo(serverLookup);

    it('should work with known server names', function () {
      expect(temp.getServerStr('dog')).to.equal('https://dog:2');
      expect(temp.getServerStr('cat')).to.equal('http://cat:3');
    });

    it('should work with unknown server name', function () {
      expect(temp.getServerStr('fish')).to.equal('https://default:1');
    });
  });
});
