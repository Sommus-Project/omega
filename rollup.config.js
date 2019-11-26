const {init, BUILD_TYPES} = require('component-build-tools');

const config = {
  buildTypes: [ BUILD_TYPES.CJS, BUILD_TYPES.MJS, BUILD_TYPES.CJS5 ],
  distPath: {
    MJS: 'dist/js/mjs',
    CJS: 'dist/js/cjs',
    CJS5: 'dist/js'
  },
  dstExtCJS5: '.js',
  dstExtCJS: '.js',
  dstExtMJS: '.js',
  makeMinFiles: false,
  srcFolders: ['components/**']
};

module.exports = init(config);
