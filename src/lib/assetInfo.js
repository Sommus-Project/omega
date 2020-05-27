const ASSET_TYPE_SCRIPT = 'script';
const ASSET_TYPE_STYLE = 'link';
const ASSET_INFO = {
  [ASSET_TYPE_SCRIPT]: {
    boolAttrs: ['defer','async','nomodule'],
    defAttr: 'src',
    defFolder: '/js',
    defObj: null,
    errorMessage: 'JS files must supply, at least, a value for src.'
  },
  [ASSET_TYPE_STYLE]: {
    boolAttrs: [],
    defAttr: 'href',
    defFolder: '/css',
    defObj: {rel:'stylesheet'},
    errorMessage: 'Styles must supply, at least, a value for href.'
  }
};

module.exports = { ASSET_TYPE_SCRIPT, ASSET_TYPE_STYLE, ASSET_INFO };
