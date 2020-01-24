const fs = require('fs');
const {loadJsonFile} = require('@sp/omega-lib');

const FIELDS_TO_IGNORE = [
  "appPath",
  "cacheBuster",
  "initAppFn",
  "initReqFn",
  "logSkipFn",
  "proxies",
  "proxyPaths",
  "proxyPostCallback",
  "redirectFn",
  "reqFinishedFn"
];

const PROXY_FIELDS = {
  'host': 'proxyHost',
  'password': 'password',
  'port': 'proxyPort',
  'timeout': 'proxyTimeout',
  'token': 'token',
  'username': 'username'
};

const removeIgnoredKeys = key => !FIELDS_TO_IGNORE.includes(key);

// If the config file has a `db` object in the selected
// proxy object then combine it with the default `db` values
function getDbInfo(proxy) {
  let dbInfo = {};

  if (proxy.db != null) {
    if (typeof proxy.db === 'object') {
      dbInfo = Object.entries(proxy.db).reduce(
        (obj, [key, val]) => {
          obj[key] = { host: proxy.host, ...obj[key], ...val };
          return obj;
        }, {}
      )
    }

    delete proxy.db;
  }

  return dbInfo;
}

function fixMySqlDbPW(config) {
  // If there is `db.mysql.pwFile` then read that as the password
  if (config && config.db && config.db.mysql && config.db.mysql.pwFile && fs.existsSync(config.db.mysql.pwFile)) {
    config.db.mysql.password = fs.readFileSync(config.db.mysql.pwFile, 'utf8').trim();
    delete config.db.mysql.pwFile;
    config.db.mysql.ssl = {
      rejectUnauthorized: false
    };
  }
}

function mergeConfigFile(originalConfig, appConfigFile) {
  const config = { ...originalConfig};

  if (fs.existsSync(appConfigFile)) {
    // Read the application config file `appConfigFile`
    let temp = loadJsonFile(appConfigFile) || {};

    //*************************************************************************
    // Copy all of the non-ignored fields from config file into config object.
    Object.keys(temp).filter(removeIgnoredKeys).forEach(
      field => (config[field] = temp[field])
    );

    let serverLookup = {};
    // See if there is a proxies section we are supposed to be using
    if (temp.proxies && temp.proxies.use) {
      let proxy = temp.proxies[temp.proxies.use];

      // istanbul ignore next
      if (proxy) {
        config.db = { ...config.db, ...getDbInfo(proxy) };

        // Copy the config file selected proxy information from into config object.
        Object.entries(PROXY_FIELDS).forEach(
          ([srcField, cfgKey]) => {
            if (proxy[srcField]) {
              config[cfgKey] = proxy[srcField];
            }
          }
        );

        if (proxy.servers) {
          Object.entries(proxy.servers).forEach(
            ([key, obj]) => {
              const protocol = obj.hasOwnProperty('http') ? 'http' : 'https';
              serverLookup[key] = {
                hostname: obj.host || config.proxyHost,
                port: obj[protocol] || config.proxyPort,
                protocol
              }
            }
          );
        }
      }
    }

    serverLookup.default = {
      hostname: config.proxyHost || 'localhost',
      port: config.proxyPort || 443,
      protocol: 'https'
    };

    config.serverLookup = serverLookup;

    if (Array.isArray(temp.proxyPaths)) {
      config.proxyLookup = [];
      temp.proxyPaths.forEach(
        ({path, proxy, ignore=false}) => {
          if (!ignore) {
            if (path[0] !== '^') {
              path = `^${path}`; // eslint-disable-line no-param-reassign
            }

            if (path.slice(-1) !== '$') {
              path += '([/?#].*)?$'; // eslint-disable-line no-param-reassign
            }

            if (proxy && !serverLookup[proxy]) {
              console.warn(`Proxy server '${proxy}' is not defined, using 'default'`);
            }

            config.proxyLookup.push({
              pathRe: new RegExp(path),
              proxy: proxy && (serverLookup[proxy] || serverLookup.default)
            });
          }
        }
      );
    }
  }

  fixMySqlDbPW(config);

  return config;
}

module.exports = mergeConfigFile;
