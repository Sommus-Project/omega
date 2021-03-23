const debug = require('debug')('Omega:UsageLog');
const fs = require('fs');
const path = require('path').posix;
const os = require('os');
const logFolder = path.join(process.cwd().replace(/\\/g, '/'), process.env.USAGE_LOGS || '../logs/node');
const OS_HOST = os.hostname();
const USE_USAGE_LOGFILE = process.env.USE_USAGE_LOGFILE==='true'
//const MIN_IN_HOUR = 60;
const { SEVERITY_LEVEL, SECURITY_LEVEL_STR} = require('./SEVERITY_LEVEL');
const ANONYMOUS_USER = 'ANONYMOUS';
const PRIMITIVE_TYPES = ['String', 'Boolea', 'Number']
// TODO: Fix this pattern to correctly redact and not be too greedy
//const REDACT_JSON_PATTERN = /((?:[a-z]*answer|[a-z]*password|[a-z]*passcode)\\?":\s*(\\?")?)(?:[^"]+?[^,}])+?(\\?"?[,}])/gi;
const REDACT_JSON_PATTERN = /((?:[a-z]*answer|[a-z]*password|[a-z]*passcode)\\?":)\s*\\?"(?:[^"]*)"/gi;
// Explanation of REDACT_JSON_PATTERN
// We use a JSON string. This string might have several levels of escaping so the
// double quote value can have no "\" character or one "\" or three "\\\"
// $1 will be the keyname "question", "answer", "password" or "passcode"
// $1 also matches any number of "\" characters before a double quote: password", password\" or password\\\"
// $2 will be the correct number of "\" characters before the double quote so we can
// place them in front of the final quote in our replace function.
// $3 will be the closing double quote followed by any number of spaces and either
// a comma "," or closing curly brace "}"

if (USE_USAGE_LOGFILE) {
  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder, { recursive: true });
  }
}

class UsageLog {
  constructor(req) {
    if (!req) {
      throw new TypeError('You must pass in the Express `req` object');
    }

    const [urlPath, parameters = ''] = req.originalUrl.split('?');
    const user = (req.user && req.user.username) ? `${req.user.username}[${req.user.id}]` : ANONYMOUS_USER;
    this.timestamp = Date.now();

    this.data = {
      client: req.headers['user-agent'],
      messages: [],
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
      timestamp: (new Date(this.timestamp)).toISOString(),
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
    addMessage(this, SEVERITY_LEVEL.CRITICAL, message);
  }

  error(message) {
    addMessage(this, SEVERITY_LEVEL.ERROR, message);
  }

  warn(message) {
    addMessage(this, SEVERITY_LEVEL.WARNING, message);
  }

  info(message) {
    addMessage(this, SEVERITY_LEVEL.INFO, message);
  }

  debug(message) {
    addMessage(this, SEVERITY_LEVEL.DEBUG, message);
  }
}

function addMessage(log, severity, err) {
  let message = (err instanceof Error) ? err.message : err;
  const level = SECURITY_LEVEL_STR[severity];
  const delta = Date.now()-log.timestamp;

  log.data.messages.push({delta, level, message});

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

function redact(value='') {
  const isPrimitive = PRIMITIVE_TYPES.includes(value.constructor.toString().substr(9, 6));
  let temp = isPrimitive ? value : JSON.stringify(value);
  if (temp.constructor.toString().substr(9, 6) === 'String') {
    return temp.replace(REDACT_JSON_PATTERN, '$1"REDACTED"');
  }

  return temp;
}

function writeToStorage(data) {
  if (USE_USAGE_LOGFILE) {
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
        debug('Error while writing the usage logs:');
        debug(err);
        console.info(data);
      }
    });
  }
  else {
    console.info(data);
  }
}

module.exports = UsageLog;
