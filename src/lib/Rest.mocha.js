/* eslint-env mocha */
//const http = require('http');
const {expect} = require('chai');
const HttpError = require('./HttpError');
const HttpResponse = require('./HttpResponse');
const Rest = require('./Rest');

describe('Tests for Rest.js', () => {
  const realConsoleInfo = console.info;
  let consoleOutput = [];
  let rest;

  before(() => {
    rest = new Rest.mock();
  });

  after(() => {
    rest.destroy();
  });

  beforeEach(() => {
    consoleOutput = [];
    console.info = (...args) => {
      consoleOutput.push(args);
    };
  });

  afterEach(() => {
    console.info = realConsoleInfo;
  });

  describe('Tests for Rest', () => {
    // TODO: Comment out `Tests for Rest.mock()`
    // And write tests directly for Rest.
    // Then enable all tests.
    beforeEach(() => {
    });

    afterEach(() => {
    });
  });

  describe('Tests for Rest.mock', () => {
    beforeEach(() => {
      return rest.beforeEach();
    });

    afterEach(() => {
      return rest.afterEach();
    });

    it('should fail with no URI', (done) => {
      try {
        rest.get('');
        done(new Error('Should have thrown an error and did not.'));
      }

      catch(ex) {
        expect(ex.message).to.equal('You must provide the `uri` as a string.');
        done();
      }
    });

    it('should fail with bad cookie', (done) => {
      try {
        rest.get('http://www.dogs.planet.com/kibble').setCookie();
        done(new Error('Should have thrown an error and did not.'));
      }

      catch(ex) {
        expect(ex.message).to.equal('You must pass a "key, value" pair into setCookie.');
        done();
      }
    });

    it('should fail with bad header', (done) => {
      try {
        rest.get('http://www.dogs.planet.com/kibble').setHeader();
        done(new Error('Should have thrown an error and did not.'));
      }

      catch(ex) {
        expect(ex.message).to.equal('You must pass an object, or a "key, value" pair into setHeader.');
        done();
      }
    });

    it('should handle an HTTP error', () => {
      const rest2 = new Rest.mock('LMNOP');
      const url = 'http://localhost/fail';
      rest2.respond.get(url, () => {
        return 'cause error';
      });

      return rest2.get(url).send().then(
        () => {
          throw new Error('Should have thrown an error.')
        }
      ).catch(
        ex => {
          expect(ex.code).to.equal("ENOTFOUND");
          expect(ex.statusCode).to.equal(502);
          expect(ex.headers).to.eql({});
          expect(ex.body).to.equal('');
          expect(ex.info.method).to.equal('GET');
          expect(ex.info.url.href).to.equal('http://localhost/fail');
          return true;
        }
      );
    });

    it('should fail if calling send twice', (done) => {
      const rest2 = new Rest.mock('LMNOP');
      const url = 'http://localhost/loud';
      rest2.respond.get(url, () => 'text');
      const sender = rest2.get(url);
      sender.send();
      try {
        sender.send();
        done(new Error('Should have thrown error and did not.'));
      }

      catch(ex) {
        expect(ex.message).to.equal('You can not call `send` more than once.');
        done();
      }
    });

    it('should fail if calling setHeader after calling send', (done) => {
      const rest2 = new Rest.mock('LMNOP');
      const url = 'http://localhost/loud';
      rest2.respond.get(url, () => 'text');
      const sender = rest2.get(url);
      sender.send();
      try {
        sender.setHeader('dog', 'bark');
        done(new Error('Should have thrown error and did not.'));
      }

      catch(ex) {
        expect(ex.message).to.equal('You can not call `setHeader` after calling `send`.');
        done();
      }
    });

    it('should fail if calling setCookie after calling send', (done) => {
      const rest2 = new Rest.mock('LMNOP');
      const url = 'http://localhost/loud';
      rest2.respond.get(url, () => 'text');
      const sender = rest2.get(url);
      sender.send();
      try {
        sender.setCookie('dog', 'bark');
        done(new Error('Should have thrown error and did not.'));
      }

      catch(ex) {
        expect(ex.message).to.equal('You can not call `setCookie` after calling `send`.');
        done();
      }
    });

    it('should perform GET and set proper headers and values', () => {
      const rest2 = new Rest.mock('LMNOP');
      const url = 'http://localhost/loud';
      rest2.respond.get(url, info => {
        expect(info.protocol).to.equal('http');
        expect(info.options.method).to.equal('GET');
        expect(info.options.path).to.equal('/loud');
        expect(info.options.port).to.equal('');
        expect(info.options.headers.accept).to.equal('application/json');
        expect(info.options.headers.cookie).to.equal('blah=%3CThis%20%26%20that%3E');
        expect(info.options.headers.referer).to.equal('https://www.deathstar.com');
        expect(info.options.headers.dogs).to.equal(undefined);
        expect(info.options.headers.cats).to.equal('meow');
        expect(info.options.headers['x-ui-request-id']).to.equal('LMNOP');
        expect(info.options.headers['x-wing-fighter']).to.equal('32');
        expect(info.options.headers.date).to.be.a('string');
        expect(info.data).to.equal(undefined);
      });
      return rest2.get(url)
        .setCookie('blah', '<This & that>', true)
        .setCookie('taco', 'testing', false)
        .setHeader('X-Wing-Fighter', 32)
        .setHeader({
          'Dogs': 'woof',
          'Cats': 'meow',
          'Referer': 'https://www.deathstar.com'
        })
        .setHeader('DOGS', 'barking')
        .setHeader('dogs', null)
        .setCookie('taco', null)
        .send();
    });

    it('should perform POST and set proper headers and values JSON encoded', () => {
      const rest2 = new Rest.mock('LMNOP');
      const uri = 'http://localhost/loud';
      const data = {dog:1};
      rest2.respond.post(uri, info => {
        expect(info.protocol).to.equal('http');
        expect(info.options.method).to.equal('POST');
        expect(info.options.path).to.equal('/loud');
        expect(info.options.port).to.equal('');
        expect(info.options.headers.accept).to.equal('application/json');
        expect(info.options.headers.cookie).to.equal('');
        expect(info.options.headers['content-type']).to.equal('application/json');
        expect(info.options.headers['content-length']).to.equal('9');
        expect(info.options.headers['x-ui-request-id']).to.equal('LMNOP');
        expect(info.options.headers.date).to.be.a('string');
        expect(JSON.parse(info.data)).to.eql(data);
      });
      return rest2.post(uri, data).send();
    });

    it('should perform POST and set proper headers and values JSON stringify encoded', () => {
      const rest2 = new Rest.mock('LMNOP');
      const uri = 'http://localhost/loud';
      const data = {dog:1};
      rest2.respond.post(uri, info => {
        expect(info.protocol).to.equal('http');
        expect(info.options.method).to.equal('POST');
        expect(info.options.path).to.equal('/loud');
        expect(info.options.port).to.equal('');
        expect(info.options.headers.accept).to.equal('application/json');
        expect(info.options.headers.cookie).to.equal('');
        expect(info.options.headers['content-type']).to.equal('application/json');
        expect(info.options.headers['content-length']).to.equal('9');
        expect(info.options.headers['x-ui-request-id']).to.equal('LMNOP');
        expect(info.options.headers.date).to.be.a('string');
        expect(JSON.parse(info.data)).to.eql(data);
      });
      return rest2.post(uri, JSON.stringify(data)).send();
    });

    it('should perform POST and set proper headers and values URL encoded', () => {
      const rest2 = new Rest.mock('LMNOP');
      const uri = 'http://localhost/loud';
      const data = {dog:1,cat:'<fish id="&bubble"></fish>'};
      rest2.respond.post(uri, info => {
        expect(info.protocol).to.equal('http');
        expect(info.options.method).to.equal('POST');
        expect(info.options.path).to.equal('/loud');
        expect(info.options.port).to.equal('');
        expect(info.options.headers.accept).to.equal('application/json');
        expect(info.options.headers.cookie).to.equal('');
        expect(info.options.headers['content-type']).to.equal('application/x-www-form-urlencoded');
        expect(info.options.headers['content-length']).to.equal('56');
        expect(info.options.headers['x-ui-request-id']).to.equal('LMNOP');
        expect(info.options.headers.date).to.be.a('string');
        expect(info.data).to.equal('dog=1&cat=%3Cfish%20id%3D%22%26bubble%22%3E%3C%2Ffish%3E');
      });
      return rest2.post(uri, data)
        .setHeader('Content-Type', 'application/x-www-form-urlencoded')
        .send();
    });

    it('should handle sender callback', () => {
      const rest2 = new Rest.mock('1q2w3e4r5t');
      rest2.onSend(sender => {
        sender.setCookie('dogs', 'woof woof, bark bark.');
      });

      const uri = 'http://localhost/loud';
      rest2.respond.get(uri, info => {
        expect(info.protocol).to.equal('http');
        expect(info.options.method).to.equal('GET');
        expect(info.options.path).to.equal('/loud');
        expect(info.options.headers.cookie).to.equal('dogs=woof%20woof%2C%20bark%20bark.');
        expect(info.options.headers['content-type']).to.equal(undefined);
        expect(info.options.headers['content-length']).to.equal(undefined);
        expect(info.options.headers['x-ui-request-id']).to.equal('1q2w3e4r5t');
        expect(info.data).to.equal(undefined);
      });
      return rest2.get(uri).send();
    });

    it('should handle response callback', () => {
      const rest2 = new Rest.mock('1q2w3e4r5t');
      const headers = {
        'X-Funny-Bone': true,
        'Set-Cookie': 'qwerty=219ffwef9w0f; Domain=somecompany.co.uk; Path=/; Expires=Wed, 30 Aug 2019 00:00:00 GMT'
      }
      let count = 0;
      rest2.onResponse(resp => {
        count++;
        expect(count).to.equal(1);
        expect(resp.headers['X-Funny-Bone']).to.equal(true);
        expect(resp.headers['Set-Cookie']).to.equal('qwerty=219ffwef9w0f; Domain=somecompany.co.uk; Path=/; Expires=Wed, 30 Aug 2019 00:00:00 GMT');
        expect(resp.statusCode).to.equal(201);
      });

      const uri = 'http://localhost/loud';
      rest2.respond.get(uri, () => {
        return new HttpResponse(headers, 'finished', 201);
      });
      return rest2.get(uri).send().then(
        resp => {
          expect(resp.body).to.equal('finished');
          expect(resp.headers).to.eql(headers);
          expect(resp.status).to.equal(201);
          expect(resp.ok).to.equal(true);
        }
      );
    });

    describe('Tests for rest.respond', () => {
      beforeEach(() => {
      });

      afterEach(() => {
      });

      it('should handle a string', () => {
        const url = 'http://localhost/api/dog.js?bark=loud';
        const testData = 'The quick brown fox jumped over the lazy dog.'
        rest.respond.get(url, testData);
        return rest.get(url).send().then(
          resp => {
            expect(resp.status).to.equal(200);
            expect(resp.body).to.equal(testData);
          }
        );
      });

      it('should handle an HttpResponse', () => {
        const headers = {location:'/frog/hop.js'};
        const url = 'http://localhost/working';
        rest.respond.get(url, new HttpResponse(headers, null, 301));
        return rest.get(url).send().then(
          resp => {
            expect(resp.status).to.equal(301);
            expect(resp.headers.location).to.equal(headers.location);
            expect(resp.body).to.equal('');
          }
        );
      });

      it('should handle proper RegExp', () => {
        rest.respond.get(/\/localhost\/.+frogs/, 'ribbit');
        return rest.get('http://localhost/lotsoffrogs').send().then(
          resp => {
            expect(resp.status).to.equal(200);
            expect(resp.body).to.equal('ribbit');
          }
        );
      });

      it('should handle a function', () => {
        const headers = {'X-No-Entity':'/api/loud'};
        const title = 'These are not the files you are looking for.';
        const url = 'http://localhost/api/loud';
        rest.respond.get(url, (/*info*/) => {
          return new HttpError(404, {headers, title});
        });

        return rest.get(url).send().then(
          resp => {
            expect(resp.status).to.equal(404);
            expect(resp.headers).to.eql(headers);
            expect(resp.json.title).to.equal(title);
          }
        );
      });
    });

    describe('Tests for rest.expect', () => {
      beforeEach(() => {
      });

      afterEach(() => {
      });

      it('should handle URL being called', () => {
        const url = 'http://localhost/api/dog.js?bark=loud';
        rest.expect.get(url);
        return rest.get(url).send();
      });

      it('should handle RegExp URL being called', () => {
        const url = 'http://localhost/api/dog.js?bark=loud';
        rest.expect.get(/localhost\/api\/(dog|cat).js/);
        return rest.get(url).send();
      });

      it('should handle URL being called twice', () => {
        const url = 'http://localhost/api/dog.js?bark=loud';
        rest.expect.get(url, 2);
        let temp = [];
        temp.push(rest.get(url).send());
        temp.push(rest.get(url).send());
        return Promise.all(temp);
      });

      it('should handle URL Not being called', () => {
        const url = 'http://localhost/mine.json';
        rest.expect.get(url, 0);
        return rest.get('https://localhost').send();
      });
    });
  });

  describe('Tests for Rest.mock afterEach', () => {
    beforeEach(() => {
      return rest.beforeEach();
    });

    it('should work with method DELETE', (done) => {
      const uri = 'http://localhost/mine.json';
      rest.expect.delete(uri);
      rest.delete(uri).send().then(
        () => {
          rest.afterEach().then(done).catch(() => {
            done(new Error('Should have RESOLVED and did not.'));
          });
        }
      ).catch(done);
    });

    it('should work with method HEAD', (done) => {
      const uri = 'http://localhost/mine.json';
      rest.expect.head(uri);
      rest.head(uri).send().then(
        () => {
          rest.afterEach().then(done).catch(() => {
            done(new Error('Should have RESOLVED and did not.'));
          });
        }
      ).catch(done);
    });

    it('should work with method OPTIONS', (done) => {
      const uri = 'http://localhost/mine.json';
      rest.expect.options(uri);
      rest.options(uri).send().then(
        () => {
          rest.afterEach().then(done).catch(() => {
            done(new Error('Should have RESOLVED and did not.'));
          });
        }
      ).catch(done);
    });

    it('should work with method PATCH', (done) => {
      const uri = 'http://localhost/mine.json';
      rest.expect.patch(uri);
      rest.patch(uri).send().then(
        () => {
          rest.afterEach().then(done).catch(() => {
            done(new Error('Should have RESOLVED and did not.'));
          });
        }
      ).catch(done);
    });

    it('should fail when url not called', (done) => {
      rest.expect.get('http://localhost/mine.json');
      rest.afterEach().then(
        (/*data*/) => {
          done(new Error('Should have REJECTED and did not.'));
        }
      ).catch(
        (ex) => {
          expect(ex.message).to.equal('Expected URL[http://localhost/mine.json] was accessed 0 times and should have been accessed 1 times.');
          done();
        }
      );
    });

    it('should fail when url called and should not have been', (done) => {
      const url = 'http://localhost/mine.json';
      rest.expect.get(url, 0);
      rest.get(url).send().then(
        resp => {
          expect(resp.status).to.equal(404);
          rest.afterEach().then(
            (data) => {
              done(new Error('Should have REJECTED and did not.'));
            }
          ).catch(
            (ex) => {
              expect(ex.message).to.equal('Expected URL[http://localhost/mine.json] was accessed 1 times and should have been accessed 0 times.');
              done();
            }
          );
        }
      ).catch(done);
    });

    it('should fail when url with different method', (done) => {
      const url = 'http://localhost/mine.json';
      rest.expect.get(url); // SHOULD BE rest.expect.get
      rest.put(url, false).send().then( // SHOULD BE rest.put
        resp => {
          expect(resp.status).to.equal(404);
          rest.afterEach().then(
            (data) => {
              done(new Error('Should have REJECTED and did not.'));
            }
          ).catch(
            (ex) => {
              expect(ex.message).to.equal('Expected URL[http://localhost/mine.json] was accessed 0 times and should have been accessed 1 times.');
              done();
            }
          );
        }
      ).catch(done);
    });

    it('should fail when url called wrong number of times', (done) => {
      const url = 'http://localhost/mine.json';
      rest.expect.get(url, 2);
      const p = [
        rest.get(url).send(),
        rest.get(url).send(),
        rest.get(url).send()
      ];

      Promise.all(p).then(
        () => {
          rest.afterEach().then(
            (data) => {
              done(new Error('Should have REJECTED and did not.'));
            }
          ).catch(
            (ex) => {
              expect(ex.message).to.equal('Expected URL[http://localhost/mine.json] was accessed 3 times and should have been accessed 2 times.');
              done();
            }
          );
        }
      ).catch(done);
    });
  });
});
