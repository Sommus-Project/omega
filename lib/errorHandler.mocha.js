/* eslint-env mocha */
const expect = require('chai').expect;
const errorHandler = require('./errorHandler');

describe('errorHandler tests', function() {
  var testload = {
    returnType: '',
    returnVal: '',
    type: '',
    url: ''
  }

  var req = {
    get url() {
      return testload.url;
    },
    accepts() {
      return testload.type;
    }
  };

  var res = {
    end() {},
    json(val) {
      testload.returnType = 'json';
      testload.returnVal = val;
      return this;
    },
    render(page, data) {
      testload.returnType = 'ejs';
      testload.returnVal = [page, data];
      return this;
    },
    send(val) {
      testload.returnVal = val;
      return this;
    },
    status(val) {
      testload.returnStatus = val;
      return this;
    },
    type(type) {
      testload.returnType = type;
      return this;
    }
  }

  beforeEach(() => {
    testload = {
      returnType: '',
      returnVal: '',
      type: ''
    }
  });

  afterEach(() => {
  });

  it('should init', function() {
    expect(errorHandler).to.be.a('function');
  });

  it('should handle 404 object and output HTML', function() {
    var error = {
      status: 404,
      title: 'this is my title',
      message: 'this is my messsage'
    }

    testload.url = 'my-web-page'
    testload.type = 'html';

    errorHandler(error, req, res);

    expect(testload.returnStatus).to.equal(404);
    expect(testload.returnVal).to.be.an('array');
    expect(testload.returnVal.length).to.equal(2);
    expect(testload.returnVal[0]).to.equal('errorpage');
    const compVal = {title:error.title, status:error.status, message:error.message, url:testload.url, data:undefined, stack:''};
    expect(testload.returnVal[1]).to.eql(compVal);
  });

  it('should handle 500 object and output JSON', function() {
    var err = {
      status: 500,
      message: 'this is my messsage'
    }

    testload.url = 'my-web-page'
    testload.type = 'json';

    errorHandler(err, req, res);

    var title = 'The page you are looking for is temporarily unavailable.';

    expect(testload.returnStatus).to.equal(500);
    expect(testload.returnVal).to.be.an('object');
    expect(testload.returnVal).to.eql({error:true, title, status:err.status, message:err.message, url:testload.url, data:undefined, stack:''});
  });

  it('should use default message', function() {
    var title = 'WOw!';
    var err = {
      status: 500,
      title
    }

    testload.url = 'my-web-page'
    testload.type = 'json';

    errorHandler(err, req, res);


    expect(testload.returnStatus).to.equal(500);
    expect(testload.returnVal).to.be.an('object');
    expect(testload.returnVal).to.eql({error:true, title, status:err.status, message:'Please try again later.', url:testload.url, data:undefined, stack:''});
  });

  it('should handle Error object and output JSON', function() {
    var message = 'Please try again later.';
    var error = new Error(message);

    testload.url = 'error-web-page'
    testload.type = 'json';

    errorHandler(error, req, res);

    var title = 'The page you are looking for is temporarily unavailable.';

    expect(testload.returnStatus).to.equal(500);
    expect(testload.returnVal).to.be.an('object');
    expect(testload.returnVal.error).to.equal(true);
    expect(testload.returnVal.title).to.equal(title);
    expect(testload.returnVal.status).to.equal(500);
    expect(testload.returnVal.message).to.equal(message);
    expect(testload.returnVal.url).to.equal(testload.url);
  });

  it('should handle error string and output text', function() {
    var error = 'this is my error';

    testload.url = 'text-web-page'
    testload.type = 'txt';

    errorHandler(error, req, res);

    var title = 'The page you are looking for is temporarily unavailable.';

    expect(testload.returnStatus).to.equal(500);
    expect(testload.returnVal).to.be.a('string');
    expect(testload.returnVal).to.equal(`Title: ${title}\nStatus: 500\nMessage: ${error}\nData: undefined\nStack Trace: \nUrl: ${testload.url}`);
  });
});
