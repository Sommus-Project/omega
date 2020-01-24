/* eslint-env mocha */
const { expect } = require('chai');
const proxyquire = require('proxyquire');

let files = {};
const fsStub = {
  existsSync: (fname) => {
    return !!files[fname];
  },
  readFileSync: (fname) => {
    return files[fname];
  }
}

const omegalibStub = {
  loadJsonFile(fname) {
    return ((fsStub.existsSync(fname)) ? 
      JSON.parse(fsStub.readFileSync(fname, { 'encoding': 'utf8' })) :
      null
    );
  }
}

const stubs = {
  fs: fsStub,
  '@sp/omega-lib': omegalibStub
}

const mergeConfigFile = proxyquire('./mergeConfigFile', stubs);

describe('mergeConfigFile tests', () => {
  beforeEach(() => {
    files = {};
  });

  it('should be a function', () => {
    expect(mergeConfigFile).to.be.an('function');
  });

  it('should handle no valid config file.', () => {
    const config = mergeConfigFile({});
    expect(config).to.eql({});
  });

  it('should handle missing config file.', () => {
    files['dogs.json'] = '';
    const config = mergeConfigFile({}, 'dogs.json');
    expect(config).to.eql({});
  });

  it('should handle config file with only ignored fields.', () => {
    const configFile = {
      appPath: true,
      cacheBuster: true,
      initAppFn: true,
      initReqFn: true,
      logSkipFn: true,
      proxies: true,
      proxyPaths: true,
      proxyPostCallback: true,
      redirectFn: true,
      reqFinishedFn: true
    };
    const expected = {
      serverLookup: {
        default: {
          hostname: 'localhost',
          port: 443,
          protocol: 'https'
        }
      }
    };
    const fileName = './dogs.json';

    files[fileName] = JSON.stringify(configFile);
    const config = mergeConfigFile({}, fileName);
    expect(config).to.eql(expected);
  });

  it('should handle missing proxy db property.', () => {
    const configFile = {
      proxies: {
        use: "one",
        one: {
          host: "Nother.kind.net",
          port: 999
        }
      }
    };

    const expected = {
      db: {},
      proxyHost: "Nother.kind.net",
      proxyPort: 999,
      serverLookup: {
        default: {
          hostname: 'Nother.kind.net',
          port: 999,
          protocol: 'https'
        }
      }
    };
    const fileName = './fish.json';

    files[fileName] = JSON.stringify(configFile);
    const config = mergeConfigFile({}, fileName);
    expect(config).to.eql(expected);
  });

  it('should handle bad Proxy db property.', () => {
    const configFile = {
      serverName: 'My Server/1.0',
      proxies: {
        use: 'one',
        one: {
          host: 'some.kind.net',
          port: 999,
          db: 'oops. bad value'
        }
      }
    };

    const expected = {
      serverName: 'My Server/1.0',
      db: {},
      proxyHost: 'some.kind.net',
      proxyPort: 999,
      serverLookup: {
        default: {
          hostname: 'some.kind.net',
          port: 999,
          protocol: 'https'
        }
      }
    };
    const fileName = './fish.json';

    files[fileName] = JSON.stringify(configFile);
    const config = mergeConfigFile({}, fileName);
    expect(config).to.eql(expected);
  });

  it('should handle config file with just proxy settings.', () => {
    const configFile = {
      proxies: {
        use: 'one',
        one: {
          host: 'one.mine.xom',
          port: 123,
          db: {
            mysql: {
              user: 'db-user-name1',
              password: 'db-password1',
              database: 'database-name1'
            }
          }
        },
        two: {
          host: 'two.mine.xom',
          port: 234,
          db: {
            mysql: {
              user: 'db-user-name2',
              password: 'db-password2',
              database: 'database-name2'
            }
          }
        }
      }
    };
    const expected = {
      db: {
        mysql: {
          host: 'one.mine.xom',
          user: "db-user-name1",
          password: "db-password1",
          database: "database-name1"
        }
      },
      proxyHost: 'one.mine.xom',
      proxyPort: 123,
      serverLookup: {
        default: {
          hostname: 'one.mine.xom',
          port: 123,
          protocol: 'https'
        }
      }
    };
    const fileName = './fish.json';

    files[fileName] = JSON.stringify(configFile);
    const config = mergeConfigFile({}, fileName);
    expect(config).to.eql(expected);
  });

  it('should handle config file with proxy settings and db password file.', () => {
    const configFile = {
      proxies: {
        use: 'two',
        one: {
          host: 'one.mine.xom',
          port: 123,
          db: {
            mysql: {
              user: 'db-user-name1',
              password: 'db-password1',
              database: 'database-name1'
            }
          }
        },
        two: {
          host: 'two.mine.xom',
          port: 234,
          db: {
            mysql: {
              user: 'db-user-name2',
              database: 'database-name2',
              pwFile: 'myDbFile.txt'
            }
          }
        }
      }
    };
    const expected = {
      db: {
        mysql: {
          host: 'two.mine.xom',
          user: 'db-user-name2',
          password: 'a simple password',
          database: 'database-name2',
          ssl: {
            'rejectUnauthorized': false
          }
        }
      },
      proxyHost: 'two.mine.xom',
      proxyPort: 234,
      serverLookup: {
        default: {
          hostname: 'two.mine.xom',
          port: 234,
          protocol: 'https'
        }
      }
    };
    const fileName = './fish.json';

    files['myDbFile.txt'] = 'a simple password';
    files[fileName] = JSON.stringify(configFile);
    const config = mergeConfigFile({}, fileName);
    expect(config).to.eql(expected);
  });

  it('should produce correct proxyPath values.', () => {
    const configFile = {
      proxies: {
        use: 'one',
        one: {
          host: 'one.mine.xom',
          port: 123,
          servers: {
            special: { http: 1234 }
          }
        }
      },
      proxyPaths: [
        { path: '/(dogs|cats)', proxy: "special" }
      ]
    };
    const fileName = './fish.json';

    files[fileName] = JSON.stringify(configFile);
    const config = mergeConfigFile({}, fileName);
    const re = config.proxyLookup[0].pathRe;
    expect(re.test('/dogs')).to.equal(true);
    expect(re.test('/cats')).to.equal(true);
    expect(re.test('/dogs/woof')).to.equal(true);
    expect(re.test('/cats/meow')).to.equal(true);
    expect(re.test('/dogss')).to.equal(false);
    expect(re.test('/catss')).to.equal(false);
    expect(re.test('/dogs1')).to.equal(false);
    expect(re.test('/cats1')).to.equal(false);
    expect(re.test('/dogs?4=3')).to.equal(true);
    expect(re.test('/cats?s=3')).to.equal(true);
  });

  it('should handle config file with just proxy settings.', () => {
    const configFile = {
      proxies: {
        use: 'one',
        one: {
          host: 'one.mine.xom',
          port: 123,
          db: {
            mysql: {
              user: 'db-user-name1',
              password: 'db-password1',
              database: 'database-name1'
            }
          },
          servers: {
            special: { http: 1234 },
            freaky: { https: 4321 },
            deadly: { http: 5465 },
            deadlys: { https: 5465 }
          }
        }
      },
      proxyPaths: [
        { path: '/dogs/skip', proxy: false },
        { path: '/dogs/woof', proxy: "freaky", ignore: true },
        { path: '/dogs', proxy: "special" },
        { path: '/cats', proxy: "cats" },
        { path: '^/.*$', proxy: "deadlys" }
      ]
    };
    const expected = {
      db: {
        mysql: {
          host: 'one.mine.xom',
          user: "db-user-name1",
          password: "db-password1",
          database: "database-name1"
        }
      },
      proxyHost: 'one.mine.xom',
      proxyPort: 123,
      proxyLookup: [
        { pathRe: /^\/dogs\/skip([\/?#].*)?$/, proxy: false },
        { pathRe: /^\/dogs([\/?#].*)?$/, proxy: { hostname: "one.mine.xom", port: 1234, protocol: "http" } },
        { pathRe: /^\/cats([\/?#].*)?$/, proxy: { hostname: "one.mine.xom", port: 123, protocol: "https" } },
        { pathRe: /^\/.*$/, proxy: { hostname: "one.mine.xom", port: 5465, protocol: "https" } }
      ],
      serverLookup: {
        default: {
          hostname: 'one.mine.xom',
          port: 123,
          protocol: 'https'
        },
        special: {
          hostname: 'one.mine.xom',
          port: 1234,
          protocol: 'http'
        },
        freaky: {
          hostname: 'one.mine.xom',
          port: 4321,
          protocol: 'https'
        },
        deadly: {
          hostname: 'one.mine.xom',
          port: 5465,
          protocol: 'http'
        },
        deadlys: {
          hostname: 'one.mine.xom',
          port: 5465,
          protocol: 'https'
        }
      }
    };
    const fileName = './fish.json';

    files[fileName] = JSON.stringify(configFile);
    const config = mergeConfigFile({}, fileName);
    expect(config).to.eql(expected);
  });
});
