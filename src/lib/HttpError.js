const MESSAGES = {
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  407: 'Proxy Authentication Required',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  412: 'Precondition Failed',
  413: 'Request Entity Too Large',
  414: 'Request-URI Too Long',
  415: 'Unsupported Media Type',
  416: 'Requested Range Not Satisfiable',
  417: 'Expectation Failed',
  418: 'I\'m a teapot',
  419: 'Authentication Timeout', // Not in RFC 2616
  420: 'Enhance Your Calm',
  422: 'Unprocessable Entity',
  423: 'Locked',
  424: 'Failed Dependency',
  425: 'Reserved for',
  426: 'Upgrade Required',
  428: 'Precondition Required',
  429: 'Too Many Requests',
  431: 'Request Header Fields Too Large',
  444: 'No Response',
  449: 'Retry With',
  450: 'Blocked by Windows Parental Controls',
  451: 'Unavailable For Legal Reasons',
  499: 'Client Closed Request',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
  505: 'HTTP Version Not Supported',
  506: 'Variant Also Negotiates',
  507: 'Insufficient Storage',
  508: 'Loop Detected',
  509: 'Bandwidth Limit Exceeded',
  510: 'Not Extended',
  511: 'Network Authentication Required',
  598: 'Network read timeout error',
  599: 'Network connect timeout error'
};

class HttpError extends Error {
  constructor(status, options = {}) {
    var opts = (typeof options === 'string') ? {title: options} : options;
    super(opts.title || MESSAGES[status]);
    this.status = status;
    this.options = opts;
    this.title = MESSAGES[status];
    this.headers = opts.headers;
    this.data = opts.data;
  }
}

module.exports = HttpError;
module.exports.MESSAGES = MESSAGES;
