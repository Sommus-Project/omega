/* eslint-env mocha */
const expect = require('chai').expect;
const sharedAgent = require('./sharedAgent');

describe('sharedAgent tests', function () {
  beforeEach(() => {
  });

  afterEach(() => {
  });

  it('should init', () => {
    expect(sharedAgent).to.be.an('object');
  });

  it('should return same agent twice for http', () => {
    const agent1 = sharedAgent.http;
    const agent2 = sharedAgent.http;
    expect(agent1).to.eql(agent2);
  });

  it('should return same agent twice for https', () => {
    const agent1s = sharedAgent.https;
    const agent2s = sharedAgent.https;
    expect(agent1s).to.eql(agent2s);
  });

  it('should return different agents twice for http when changing maxSockets', () => {
    const agent1 = sharedAgent.http;
    sharedAgent.maxSockets = 10;
    const agent2 = sharedAgent.http;
    expect(agent1).to.not.eql(agent2);
  });

  it('should return different agents twice for https when changing maxSockets', () => {
    const agent1s = sharedAgent.https;
    sharedAgent.maxSockets = 10;
    const agent2s = sharedAgent.https;
    expect(agent1s).to.not.eql(agent2s);
  });

  it('should fail on invalid number for maxSockets', () => {
    function doIt(num) {
      return () => {
        sharedAgent.maxSockets = num;
      }
    }
    expect(doIt(0)).to.throw(TypeError);
    expect(doIt(4000)).to.throw(TypeError);
    expect(doIt('L')).to.throw(TypeError);
  });

  it('should handled value changes for maxSockets', () => {
    for( let i = 1; i < 102; i+=25 ) {
      sharedAgent.maxSockets = i;
      expect(sharedAgent.maxSockets).to.equal(i);
    }
  });
});
