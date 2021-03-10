const SQL_RE = /^mysql:\/\/(?<user>[^:]+):(?<password>[^@]+)@(?<host>[^:]+):(?<port>[^\/]+)\/(?<database>.+)$/;
let SQL_CONFIG = {};
const temp = SQL_RE.exec(process.env.JAWSDB_URL);
if (temp) {
  SQL_CONFIG = {...temp.groups};
}
else {
  console.error('Unable to parse SQL config values');
}

module.exports = SQL_CONFIG;
