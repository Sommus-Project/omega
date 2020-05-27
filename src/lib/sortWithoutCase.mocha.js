/* eslint-env mocha */
const { expect } = require('chai');
const sortWithoutCase = require('./sortWithoutCase');
const { isBool, isDate, isNum, isObj, isStr } = sortWithoutCase; // eslint-disable-line no-unused-vars

describe('Tests for /src/lib/sortWithoutCase.js', () => {
  beforeEach(() => {
  });

  it('should be a valid object', () => {
    expect(sortWithoutCase).to.be.a('function');
    expect(sortWithoutCase.length).to.equal(2);
    expect(sortWithoutCase()).to.be.a('function');
    expect(sortWithoutCase().length).to.equal(2);
  });

  it('should sort array ascending', () => {
    const src = [
      'fruit',
      'FAT',
      'eat',
      'Zoo',
      'zoo',
      'ALpha'
    ];
    const expected = [
      'ALpha',
      'eat',
      'FAT',
      'fruit',
      'Zoo',
      'zoo'
    ];

    expect(src.sort(sortWithoutCase('asc'))).to.eql(expected);
  });

  it('should sort array descending', () => {
    const src = [
      'fruit',
      'FAT',
      'eat',
      'Zoo',
      'zoo',
      'ALpha'
    ];
    const expected = [
      'Zoo',
      'zoo',
      'fruit',
      'FAT',
      'eat',
      'ALpha'
    ];

    expect(src.sort(sortWithoutCase('des'))).to.eql(expected);
  });

  it('should sort object ascending', () => {
    const src = [
      { name: 'fruit' },
      { name: 'FAT' },
      { name: 'eat' },
      { name: 'Zoo' },
      { name: 'zoo' },
      { name: 'ALpha' }
    ];
    const expected = [
      { name: 'ALpha' },
      { name: 'eat' },
      { name: 'FAT' },
      { name: 'fruit' },
      { name: 'Zoo' },
      { name: 'zoo' }
    ];

    expect(src.sort(sortWithoutCase('asc', 'name'))).to.eql(expected);
  });

  it('should sort object descending', () => {
    const src = [
      { name: 'fruit' },
      { name: 'FAT' },
      { name: 'eat' },
      { name: 'Zoo' },
      { name: 'zoo' },
      { name: 'ALpha' }
    ];
    const expected = [
      { name: 'Zoo' },
      { name: 'zoo' },
      { name: 'fruit' },
      { name: 'FAT' },
      { name: 'eat' },
      { name: 'ALpha' }
    ];

    expect(src.sort(sortWithoutCase('des', 'name'))).to.eql(expected);
  });
});