/* eslint-env mocha */
const expect = require('chai').expect;
const directoryService = require('./directoryService');

class MockUser {
  constructor() {

  }
}

const mockService = {

};

describe('tests for lib/directoryService/directoryService.js', () => {
  beforeEach(() => {
  });

  after(() => {
    directoryService.destroy();
  });

  it('should init', () => {
    expect(directoryService).to.be.a('function');
    expect(directoryService.length).to.be.equal(1);
  });

  it('should return a function', () => {
    const options = { default: { User: MockUser, service: mockService } };
    const temp = directoryService(options);
    expect(temp).to.be.a('function');
    expect(temp.length).to.be.equal(1);
  });

  it('should throw exception if you don not pass in a config object', () => {
    function testit() {
      directoryService();
    }
    expect(testit).to.throw();
  });
});