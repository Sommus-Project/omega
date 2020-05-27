const debug = require('debug')('Omega:systemPages');
const fs = require('fs');
const path = require('path');
const HttpError = require('./HttpError');
const {loadJsonFile} = require('@sp/omega-lib');

function home(req, res) {
  debug(`Rendering page for \`/system\`.`);
  res.render('system/home', {});
}

function npm(req, res) {
  debug('Reading all dependencies `package.json` files');
  var nodeModulesPath = path.join(process.cwd(), 'node_modules');
  fs.readdir(nodeModulesPath, (err, folders) => {
    if (err) {
      throw new HttpError(500, err);
    }

    folders = folders.reduce((acc, folder) => { // eslint-disable-line no-param-reassign
      if (folder[0] === '@') {
        fs.readdirSync(path.join(nodeModulesPath, folder)).forEach(
          temp => {
            acc.push(path.join(folder, temp));
          }
        );
      }
      else {
        acc.push(folder);
      }

      return acc
    }, []);

    var npmInfo = folders.sort().reduce((acc, folder) => {
      var pkgFile = path.join(nodeModulesPath, folder, 'package.json');
      if (fs.existsSync(pkgFile)) {
        var data = loadJsonFile(pkgFile);
        if (data) {
          try {
            var url = (data.homepage||data.repository.url).split('#')[0];
            acc.push({repo:data.name, version:data.version, url});
          }

          catch(ex) {
            // Do nothing
          }
        }
      }
      return acc;
    }, []);

    debug(`Rendering page for \`/system/node/npm\` with ${npmInfo.length} entries.`);
    res.render('system/node/npm', {npmInfo});
  })

}

function status(req, res) {
  debug(`Rendering page for \`/system/node/status\`.`);
  res.render('system/node/status', {});
}

module.exports = {home, npm, status};
