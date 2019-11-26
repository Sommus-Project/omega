/* eslint-env mocha */
const path = require('path');
const expect = require('chai').expect;
const proxyquire = require('proxyquire');

var ver = 1;
var mockCwdValue = '/';
var mockNodeModFolders = [
  '@example','one','two','three'
];
const loadJsonFileStub = fname => {
  var name = path.dirname(fname).replace(/[\\\/]node_modules[\\\/]/, '').replace(/\\/g, '/');
  var homepage = `https://${name}-homepage`;
  return {
    homepage,
    name,
    version: ver++
  }
};
const cwdMock = () => mockCwdValue;
const fsStub = {
  readdir: (folder, cb) => {
    folder = folder.replace(/\\/g, '/'); // eslint-disable-line no-param-reassign
    if (folder === '/bad/node_modules') {
      cb('failed');
    }
    else {
      setTimeout(() => {
        cb(null, mockNodeModFolders);
      }, 1);
    }
  },
  readdirSync: folder => /@example/.test(folder)?['part1','part2']:[],
  existsSync: folder => !/three/.test(folder)
}

const stubs = {
  '@imat/omegalib': {
    loadJsonFile: loadJsonFileStub
  },
  fs: fsStub
}

const systemPages = proxyquire('./systemPages', stubs);

describe('systemPages tests', function() {
  var cwdBackup;

  beforeEach(() => {
    mockCwdValue = '/';
    cwdBackup = process.cwd;
    process.cwd = cwdMock;
  });

  afterEach(() => {
    process.cwd = cwdBackup;
  });

  it('should init', () => {
    expect(systemPages).to.be.an('object');
    expect(Object.keys(systemPages).length).to.equal(3);
    expect(systemPages.home).to.be.a('function');
    expect(systemPages.npm).to.be.a('function');
    expect(systemPages.status).to.be.a('function');
  });

  describe('systemPages.home tests', () => {
    it('should render page', done => {
      const res = {
        render: (page, options) => {
          expect(page).to.equal('system/home');
          expect(options).to.eql({});
          setTimeout(() => {
            done();
          });
        }
      }
      systemPages.home(null, res);
    });
  });

  describe('systemPages.npm tests', () => {
    it('should handle valid path', done => {
      const res = {
        render: (page, options) => {
          expect(page).to.equal('system/node/npm');
          expect(options).to.eql({"npmInfo": [
            {"repo": "@example/part1","version": 1,"url": "https://@example/part1-homepage"},
            {"repo": "@example/part2","version": 2,"url": "https://@example/part2-homepage"},
            {"repo": "one","version": 3,"url": "https://one-homepage"},
            {"repo": "two","version": 4,"url": "https://two-homepage"}
          ]});
          setTimeout(() => {
            done();
          });
        }
      }
      systemPages.npm(null, res);
    });

    it('should handle invalid path', () => {
      const res = {
        render: () => {
          throw new Error('should not have called render');
        }
      }

      mockCwdValue = '/bad';
      function doit() {
        systemPages.npm(null, res);
      }

      expect(doit).to.throw();
    });
  });

  describe('systemPages.stats tests', () => {
    it('should render page', done => {
      const res = {
        render: (page, options) => {
          expect(page).to.equal('system/node/status');
          expect(options).to.eql({});
          setTimeout(() => {
            done();
          });
        }
      }
      systemPages.status(null, res);
    });
  });
});
