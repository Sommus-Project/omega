const debug = require('debug')('Omega:calcAssets');
const path = require('path').posix;
const micromatch = require('micromatch');
const { ASSET_TYPE_SCRIPT, ASSET_TYPE_STYLE, ASSET_INFO } = require('./assetInfo');

const ABS_PATH_RE = /^[.\/\\]|https?:/;
const EXTERNAL_PATH_RE = /^https?:/;

function calcAssets(moduleRoot, listOfAssets) {
  var assetList = {};
  var usingRequire = false;

  // Get a list of assets that exist based on the list passed in.
  // The list will be from the `assets` object defined in the EJS files.
  // `assets.head.js`, `assets.head.css`,  `assets.js` and  `assets.css`
  function getAssets(list, assetType) {
    debug('getAssets', list.length, 'items');
    const {defAttr, defObj, errorMessage} = ASSET_INFO[assetType];

    function getCorrectedList(item) {
      var filePath = item[defAttr];
      var isModule = item.type === 'module';
      var tempDefAttr = defAttr;

      if (isModule ) {
        if (ABS_PATH_RE.test(filePath)) {
          throw new TypeError('Modules must not use an absolute path: '+filePath);
        }
        else {
          filePath = path.join('/'+moduleRoot, filePath);
          if (moduleRoot !== 'mjs') {
            // Tell system to use `require` instead of `import`
            delete item.type;
            delete item[defAttr];
            tempDefAttr = 'require';
            usingRequire = true;
          }
        }
      }
      else if (EXTERNAL_PATH_RE.test(filePath)) {
        return [item];
      }

      debug('getAssets.rootFolder', filePath);
      var mmOptions = {nodupes: true};
      if (item.ignore) {
        mmOptions.ignore = item.ignore;
        // TODO: Should we delete `item.ignore`?
      }

      // Convert a globby list into a real list of existing assets
      const filtered = micromatch(listOfAssets, filePath, mmOptions);

      // Make sure that all items are of the correct object type
      return filtered.map(fileName => Object.assign({}, item, {[tempDefAttr]:fileName}));
    }

    return list.reduce((acc,assetItem) => {
      var item = assetItem;
      if (typeof item === 'string') {
        item = {[defAttr]:item};
      }
      else if (!item[defAttr]) {
        throw new TypeError(errorMessage+'\n'+JSON.stringify(item));
      }

      if (defObj) {
        item = Object.assign({}, defObj, item);
      }

      // Create a valid path for these resources including globs
      var newObjs = getCorrectedList(item);

      // Deduplicate
      newObjs = newObjs.reduce((objList, obj) => {
        const name = obj[defAttr];
        if (!Object.keys(assetList).includes(name)) {
          objList.push(obj);
          assetList[name] = obj;
        }
        else {
          debug('Duplicate asset requested. Previous request will be used:', JSON.stringify(assetList[name]));
        }

        return objList;
      }, []);

      return acc.concat(newObjs);
    }, []);
  }

  return (assets = {}) => {
    debug('calcAssets', JSON.stringify(assets));
    var retVal = { script: { head: [], body: [] }, css: { head: [], body: [] } };

    if (assets.head ) {
      if (assets.head.js) {
        retVal.script.head = getAssets(assets.head.js, ASSET_TYPE_SCRIPT);
      }
      if (assets.head.css) {
        retVal.css.head = getAssets(assets.head.css, ASSET_TYPE_STYLE);
      }
    }

    if (assets.js) {
      retVal.script.body = getAssets(assets.js, ASSET_TYPE_SCRIPT);
    }

    if (assets.css) {
      retVal.css.body = getAssets(assets.css, ASSET_TYPE_STYLE);
    }

    retVal.usingRequire = usingRequire;

    return retVal;
  }
}

module.exports = calcAssets;
