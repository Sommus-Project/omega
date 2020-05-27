/* eslint-env mocha */
const {expect} = require('chai');
const {mergePatch, mergeData} = require('./mergePatch');

describe('mergePatch tests', () => {
  var serverData;

  beforeEach(() => {
    serverData = {
      name: 'Jorge',
      job: 'luchador',
      strengths: 'kick, punch, pile drive to the face',
      age: 37,
      family: {
        wife: {
          name: 'Anita',
          age: 28,
          job: 'cheerleader'
        }
      }
    }
  });

  afterEach(() => {
  });

  it('should be a function', () => {
    expect(mergePatch).to.be.an('function');
    expect(mergeData).to.be.an('function');
  });

  it('should delete attibutes when value is null', () => {
    var patchData = { age: null };
    var newData = mergeData(serverData, patchData);

    expect(newData.hasOwnProperty('age')).to.be.false; // eslint-disable-line no-unused-expressions
  });

  it('should update existing attributes with new values', () => {
    var patchData = { job: 'ultimate luchador', age: 43 };
    var newData = mergeData(serverData, patchData);

    expect(newData.age).to.equal(43); 
    expect(newData.job).to.equal('ultimate luchador'); 
  });

  it('should delete attributes on nested objects when value is null', () => {
    var patchData = { family : { wife: { job: null }}};
    var newData = mergeData(serverData, patchData);

    expect(newData.family.wife.hasOwnProperty('job')).to.be.false; // eslint-disable-line no-unused-expressions
  });

  it('should update attributes on nested objects', () => {
    var patchData = { family : { wife: { age: 30 }}};
    var newData = mergeData(serverData, patchData);

    expect(newData.family.wife.age).to.equal(30);
  });
});