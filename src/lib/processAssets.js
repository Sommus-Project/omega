const { ASSET_TYPE_SCRIPT, ASSET_TYPE_STYLE, ASSET_INFO } = require('./assetInfo');
const debug = require('debug')('Omega:processAssets');
const attrEsc = require('./attrEsc');
const polyfills = {
  assign: {src:['object.assign'], debug:'Including polyfill: Object.assign'},
  entries: {src:['object.entries'], debug:'Including polyfill: Object.entries'},
  values: {src:['object.values'], debug:'Including polyfill: Object.values'},
  custEvt: {src:['customevent'], debug:'Including polyfill: CustomEvent'},
  promise: {src:['promise'], debug:'Including polyfill: Promise'},
  fetch: {src:['fetch'], debug:'Including polyfill: Fetch'},
  number: {src:['number'], debug:'Including polyfill: Number updated'},
  afind: { src: ['array.find'], debug: 'Including polyfill: Array.find and Array.findIndex' },
  afrom: {src:['array.from'], debug:'Including polyfill: Array.from'},
  string: {src:['string'], debug:'Including polyfill: String updates'},
  strpad: {src:['string.pad'], debug:'Including polyfill: String.padEnd and String.padStart'},
  custEl: {src:['template', 'custom-elements'], debug:'Including polyfill: WebComponents'}
}

function init(appVersion) {
  var firstTime = true;

  function processAssets(res, type, list = [], indent = 2) { // eslint-disable-line complexity
    const {boolAttrs} = ASSET_INFO[type];
    const srcKey = (type === ASSET_TYPE_SCRIPT) ? 'src' : 'href';
    var usingRequire = false;
    var requireNotLoaded = true;
    var retVal = '\n'+' '.repeat(indent)+list.map(item => {
      debug('processAssets', JSON.stringify(item));
      var content = '';

      if (item.require) {
        if (item.src) {
          throw new Error('the `src` attribute can not be set for modules. `require` should be set instead.');
        }
        usingRequire = true;
        content = `require.ensure(['${item.require}']);`;
        delete item.require;
      }

      let attrs = Object.keys(item).reduce((acc, key) => {
        if (key !== 'ignore') {
          if (boolAttrs.includes(key)) {
            if (!!item[key]) { // eslint-disable-line no-extra-boolean-cast
              acc.push(key)
            }
          }
          else {
            acc.push(`${key}="${attrEsc(item[key])}${key===srcKey?`?cb=${appVersion}`:''}"`);
          }
        }

        return acc;
      }, []).join(' ');

      return (type === ASSET_TYPE_SCRIPT) ? `<script ${attrs}>${content}</script>` : `<link ${attrs}>`;
    }).join('\n'+' '.repeat(indent));

    var prepend = ''
    if (firstTime) {
      res.locals.browserNeeds = res.locals.browserNeeds || {};
      Object.entries(polyfills).forEach(
        ([need, info]) => {
          if(res.locals.browserNeeds[need]) {
            debug(info.debug);
            info.src.forEach(
              src => {
                prepend += `  <script src="/js/polyfill/${src}.min.js"></script>\n`;
              }
            );
          }
        }
      );
    }

    if (usingRequire && requireNotLoaded) {
      debug('Including inject');
      requireNotLoaded = false;
      prepend += `  <script src="/js/inject.min.js"></script>
  <script>
    window.define = null; // Totally disable the AMD ability to prevent failures when loading in IE11.
    // Setup for inject
    Inject.reset();
    Inject.setExpires(0); //Don't store files in localStorage
    Inject.setModuleRoot('/');
    Inject.disableAMD(true);
  </script>
`;
    }

    retVal = prepend + retVal;
    firstTime = false;
    return retVal;
  }

  const processScripts = res => (src, indent) => processAssets(res, ASSET_TYPE_SCRIPT, src, indent);
  const processStyles = res => (src, indent) => processAssets(res, ASSET_TYPE_STYLE, src, indent);

  /* Example of a META Tag object:
   *  page.meta = [
   *    {
   *      name: 'robots',
   *      content: 'noindex'
   *    },
   *    {
   *      'http-equiv': 'Content-Type',
   *      content: 'text/html',
   *      charset:'utf-8'
   *    }
   *  ];
   */
  function processMeta(src = []) {
    debug('processMeta', JSON.stringify(src));
    return src.map(item => `<meta ${Object.keys(item).map(key => `${key}="${item[key]}"`).join(' ')}>`).join('\n  ');
  }

  return { processScripts, processStyles, processMeta };
}

module.exports = init;
