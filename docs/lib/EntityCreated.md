# EntityCreated

A class to be used by API code to indicate that an entity has been created.

## Library Function

This library function is located in `./lib/EntityCreated.js`

## Function Signature

To use this class you must create a new object and pass in the headers and an optional return value.

```js
<EntityCreated object> new EntityCreated(
    location <string>[, description <string>]);
```

## Usage

### Internal repo access

```js
const EntityCreated = require('./lib/EntityCreated');

var resp = new EntityCreated(req.originalUrl);
// or
var resp = new EntityCreated(req.originalUrl, 'New User created.');
```

### External repo access

If you are using this function from outside of the `@imat/omega` repo then you need to use a different require statement:

```js
const {EntityCreated} = require('@imat/omega');
// or
const EntityCreated = require('@imat/omega').EntityCreated;
```

---

## Updated History:

| Date | Author | Description |
| --- | --- | --- |
| 2019-05-24 | Mike Collins | Initial Draft |
