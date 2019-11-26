/* eslint-env mocha */
const expect = require('chai').expect;
const proxyquire = require('proxyquire');

let jsonFile;
const loadJsonFileStub = fname => {
  return jsonFile[fname] || null;
};

const stubs = {
  '@imat/omegalib': {
    loadJsonFile: loadJsonFileStub
  }
}

const apiDocs = proxyquire('./apiDocs', stubs);

describe('apiDocs tests', function () {
  beforeEach(() => {
    jsonFile = {};
  });

  it('should init', function () {
    expect(apiDocs).to.be.a('function');
  });

  it('should crate an empty doc', () => {
    const config = {
      apiFolder: '.'
    }
    jsonFile['apidocs.json'] = {};
    const res = {
      render(template, data) {
        expect(data).to.be.an('object');
        const keys = Object.keys(data).sort();
        expect(keys.length).to.equal(3);
        expect(keys).to.eql(['json', 'pageDocs', 'pageNav']);
        expect(data.json).to.eql({});
        expect(data.pageDocs).to.equal('');
        expect(data.pageNav).to.equal('');
      }
    }
    apiDocs(config)(null, res);
  });

  it('should crate a simple doc', () => {
    const config = {
      apiFolder: '.'
    }
    const jsonData = {
      Test: {
        description: 'This is the test page.',
        url: '/api/test',
        params: [
          {
            "type": "header",
            "field": "Accepts",
            "constraint": "string",
            "description": "Must be `\"application/json\"`",
            "default": "",
            "status": "",
            "optional": false
          }
        ],
        endpoints: [
          {
            "src": "src/api/test.js",
            "method": "POST",
            "url": "/api/test",
            "title": "Testing",
            "description": "Do some test thing",
            "permissions": {
              "type": "role",
              "permissions": "'dogs'"
            },
            "params": [
              {
                "type": "body",
                "field": "value",
                "constraint": "string",
                "description": "Some test value",
                "default": "",
                "status": "",
                "optional": false
              }
            ],
            "examples": {
              "200": {
                "request": {
                  "format": "application/json",
                  "type": "object",
                  "status": "200",
                  "title": "Do the test thing",
                  "example": "{\n  \"value\": \"<test-value>\"\n}"
                },
                "responseValues": {
                  "body": {
                    "stuff": "value of stuff"
                  }
                },
                "response": {
                  "format": "application/json",
                  "type": "object",
                  "status": "200",
                  "title": "Value of Stuff",
                  "example": "{\n  \"stuff\": \"Sme stuff\"\n}\n"
                }
              }
            }
          }
        ]
      }
    };
    const expectedStr = '<div class="api-group" closed>\n<div class="api-group--title" onclick="handleClick(this)">Test - <span class="api-group--url">/api/test</span></div>\n<div class="api-group--desc"><p>This is the test page.</p>\n<label>Global Request Params</label>\n  <table class="endpoint-params">\n  <tr>\n    <th>name</th>\n    <th>type</th>\n    <th width="100%">description</th>\n    <th>default</th>\n    <th>constraint</th>\n  </tr>\n    <tr class="endpoint-param--header">\n    <td class="param-name">Accepts</td>\n    <td class="param-type">header</td>\n    <td><p>Must be <code>&quot;application/json&quot;</code></p></td>\n    <td></td>\n    <td>string</td>\n  </tr>\n\n  </table></div>\n<div class="endpoint" closed>\n  <div class="endpoint-header" onclick="handleClick(this)">\n  <span class="endpoint-method">\n    <span class="method-post">POST</span>\n  </span>\n  <span class="endpoint-url">/api/test</span>\n  <span class="endpoint-title"><p>Testing</p>\n</span>\n  \n  </div>\n  <div class="endpoint-details">\n    <div class="endpoint-source">Source File: <b>src/api/test.js</b></div>\n    <div class="endpoint-description"><p>Do some test thing</p>\n</div>\n  </div>\n  <div class="permissions"><label>Permissions:</label> <span class="permissions-value">One of the following roles: \'dogs\'</span></div>\n  <label>Request Parameters</label>\n  <table class="endpoint-params">\n  <tr>\n    <th>name</th>\n    <th>type</th>\n    <th width="100%">description</th>\n    <th>default</th>\n    <th>constraint</th>\n  </tr>\n    <tr class="endpoint-param--body">\n    <td class="param-name">value</td>\n    <td class="param-type">body</td>\n    <td><p>Some test value</p></td>\n    <td></td>\n    <td>string</td>\n  </tr>\n\n  </table>\n  <div class="examples">\n    <div class="example" example="0">\n          <div class="example-request">\n            <div class="example-title">Request: <p>Do the test thing</p>\n</div>\n            <pre example="0" class="example-code">POST /api/test HTTP/1.1\nAccept: application/json\nContent-Type: application/json\nContent-Length: 29\n\n{\n  &quot;value&quot;: &quot;&lt;test-value&gt;&quot;\n}</pre>\n          </div>\n          <div class="example-response">\n            <div class="example-title">Response: 200 - <p>Value of Stuff</p>\n</div>\n            <pre example="0" class="example-code">HTTP/1.1 200 OK\nContent-Type: application/json\nContent-Length: 27\n\n{\n  &quot;stuff&quot;: &quot;Sme stuff&quot;\n}\n</pre>\n          </div>\n        </div>\n    </div>\n</div>\n\n<div class="endpoint-spacer"></div>\n</div>\n';
    const res = {
      render(template, data) {
        expect(data.json).to.eql(jsonData);
        expect(data.pageDocs).to.equal(expectedStr);
      }
    }

    jsonFile['apidocs.json'] = jsonData;
    apiDocs(config)(null, res);
  });
});
