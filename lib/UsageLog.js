const fs = require('fs');
const path = require('path').posix;
const os = require('os');
const logFolder = path.join(process.cwd().replace(/\\/g, '/'), `../logs/node`);
const OS_HOST = os.hostname();
const MIN_IN_HOUR = 60;
const { SEVERITY_LEVEL, SECURITY_LEVEL_STR} = require('./SEVERITY_LEVEL');
const ANONYMOUS_USER = 'ANONYMOUS';
const PRIMITIVE_TYPES = ['String', 'Boolea', 'Number']
const REDACT_JSON_PATTERN = /((?:question|answer|password|passcode)\\*":\s*(\\*)")(?:[^"]+?[^,}])+?("[,}])/g;
// Explanation of REDACT_JSON_PATTERN
// We use a JSON string. This string might have several levels of escaping so the
// double quote value can have no "\" character or one "\" or three "\\\"
// $1 will be the keyname "question", "answer", "password" or "passcode"
// $1 also matches any number of "\" characters before a double quote: password", password\" or password\\\"
// $2 will be the correct number of "\" characters before the double quote so we can
// place them in front of the final quote in our replace function.
// $3 will be the closing double quote followed by any number of spaces and either
// a comma "," or closing curly brace "}"

class UsageLog {
  constructor(req) {
    if (!req) {
      throw new TypeError('You must pass in the Express `req` object');
    }

    const [urlPath, parameters = ''] = req.originalUrl.split('?');
    const user = (req.user && req.user.username) ? `${req.user.username}@${req.user.provider}` : ANONYMOUS_USER;
    const timestamp = formatTimestamp(new Date());

    this.data = {
      client: req.headers['user-agent'],
      extraInfo: {default:{}},
      host: req.hostname,
      ip: req.ip,
      nodeID: OS_HOST,
      nodeRequestID: req.requestId,
      parameters,
      port: req.socket.localPort,
      protocol: req.protocol,
      requestBody: redact(req.body),
      requestID: req.headers.x_request_id || `node-${req.requestId}`,
      severity: SEVERITY_LEVEL.INFO,
      timestamp,
      urlPath,
      user,
      verb: req.method
    };

    req.res.on('finish', () => {
      this.data.responseCode = `${req.res.statusCode} ${req.res.statusMessage}`;
      writeData(this.data);
    });
  }

  critical(message) {
    addExtra(this, SEVERITY_LEVEL.CRITICAL, message);
  }

  error(message) {
    addExtra(this, SEVERITY_LEVEL.ERROR, message);
  }

  warn(message) {
    addExtra(this, SEVERITY_LEVEL.WARNING, message);
  }

  info(message) {
    addExtra(this, SEVERITY_LEVEL.INFO, message);
  }

  debug(message) {
    addExtra(this, SEVERITY_LEVEL.DEBUG, message);
  }
}

function addExtra(log, severity, err) {
  let text = (err instanceof Error) ? err.message : err;
  const level = SECURITY_LEVEL_STR[severity];
  const def = log.data.extraInfo.default;

  def[level] = def[level] || [];
  def[level].push(text);

  if (severity < log.data.severity) {
    log.data.severity = severity;
  }
}

let output = '';
let writeTimout;
function writeData(data) {
  data.level = SECURITY_LEVEL_STR[data.severity];
  delete data.severity;

  output += JSON.stringify(data)+'\n';
  // istanbul ignore else
  if (!writeTimout) {
    writeTimout = setTimeout(() => {
      writeTimout = null;
      const temp = output;
      output = '';
      writeToStorage(temp);
    }, 100);
  }
}

const fmt2 = val => ('0'+val).slice(-2);

function tzo(off) {
  const sign = (off > 0) ? '-' : '+';
  const h = Math.floor(off/MIN_IN_HOUR);
  const m = off - (h*MIN_IN_HOUR);
  return `${sign}${fmt2(h)}${fmt2(m)}`;
}

function formatTimestamp(date) {
  const dd = fmt2(date.getDate());
  const mm = fmt2(date.getMonth()+1);
  const yy = date.getFullYear();
  const h = fmt2(date.getHours());
  const m = fmt2(date.getMinutes());
  const s = fmt2(date.getSeconds());
  const o = tzo(date.getTimezoneOffset());

  return `${dd}/${mm}/${yy}:${h}:${m}:${s} ${o}`;
}

function redact(value='') {
  const isPrimitive = PRIMITIVE_TYPES.includes(value.constructor.toString().substr(9, 6));
  let temp = isPrimitive ? value : JSON.stringify(value);
  if (temp.constructor.toString().substr(9, 6) === 'String') {
    return temp.replace(REDACT_JSON_PATTERN, '$1REDACTED$2$3');
  }

  return temp;
}

function writeToStorage(data) {
  // Get the filename based on the date. If the file does not exist it will be created
  // when we call fa.appendFile
  const dt = new Date();
  const year = dt.getFullYear();
  const month = fmt2(dt.getMonth()+1);
  const date = fmt2(dt.getDate());

  const usageFileName = path.join(logFolder, `node-usage.${year}-${month}-${date}.log`);
  fs.appendFile(usageFileName, data, (err) => {
    // istanbul ignore if
    if (err) {
      console.error('Error while writing the usage logs:');
      console.error(err);
    }
  });
}

module.exports = UsageLog;
