class HttpResponse {
  constructor(headers, data, status) {
    if (typeof headers !== 'object' || headers === null ) {
      throw new TypeError('`headers` must be passed in as an object')
    }

    this.headers = headers;
    this.data = data;
    this.status = status;
  }
}

module.exports = HttpResponse;
