const HttpResponse = require('./HttpResponse');

class EntityCreated extends HttpResponse {
  constructor(location, description) {
    if (!location || typeof(location) !== 'string') {
      throw new TypeError('You must provide the URL location of the new resource.');
    }

    super({location:location.split('?')[0]}, description, 201);
  }
}

module.exports = EntityCreated;
