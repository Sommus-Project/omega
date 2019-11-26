/* eslint-env mocha */
const expect = require('chai').expect;
const {ASSET_TYPE_SCRIPT, ASSET_TYPE_STYLE, ASSET_INFO} = require('./assetInfo');

describe('assetInfo tests', function() {
  it('should init', function() {
    expect(ASSET_TYPE_SCRIPT).to.equal('script');
    expect(ASSET_TYPE_STYLE).to.equal('link');
    expect(ASSET_INFO).to.be.an('object');
    expect(Object.keys(ASSET_INFO).length).to.equal(2);
    expect(ASSET_INFO.script).to.be.an('object');
    expect(ASSET_INFO.link).to.be.an('object');
  });
});
