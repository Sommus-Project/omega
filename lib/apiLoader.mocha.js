/* eslint-env mocha */
const {expect} = require('chai');
const proxyquire = require('proxyquire').noCallThru();

let files = {};
const fsStubs = {
  readFileSync(fname) {
    const data = files[fname];
    if (!data) {
      throw new Error();
    }

    return data;
  }
}

const stubs = {
  'fs': fsStubs
}

const apiLoader = proxyquire('./apiLoader', stubs);

describe('apiLoader tests', function() {
  beforeEach(() => {
    files = {};
  });

  it('should be a function', function() {
    expect(apiLoader).to.be.an('function');
  });

  it('should return a function', function() {
    expect(apiLoader('./api', '/api')).to.be.an('function');
  });

  it('should process a simple require', () => {
    files['api/mine.js'] = `apimodule.exports = a => a*a;`;
    const fn = apiLoader('./api', '/api');
    const exported = fn('./mine')
    expect(exported).to.be.a('function');
    expect(exported(22)).to.equal(22*22);
  });

  it('should process a require that requires a mock', () => {
    const mocks = {
      mult(a) {
        return a*2;
      }
    }
    files['api/mine.js'] = `apimodule.exports = require("mult");`;
    const fn = apiLoader('./api', '/api');
    const exported = fn('./mine', mocks)
    expect(exported).to.be.a('function');
    expect(exported(22)).to.equal(44);
  });
});

// TODO: Add real tests
// TODO: Add test to validate new functions `isFalse` and `isTrue`
