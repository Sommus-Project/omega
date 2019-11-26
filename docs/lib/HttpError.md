# HttpError

A class to be used by API code to indicate an HttpError has occurred.

## Library Function

This library function is located in `./lib/HttpError.js`

## Function Signature

To use this class you must create a new object and pass in a status code and optional set of values.

```js
<HttpError object> new HttpError(status <uint>[, options <string | object>]);
```

## Usage

### Internal repo access

```js
const HttpError = require('./lib/HttpError');

var err = new HttpError(404, {headers});
// or
var err = new HttpError(403, 'Can\'t touch this!');
// or
throw new HttpError(500);
```

### External repo access

If you are using this function from outside of the `@imat/omega` repo then you need to use a different require statement:

```js
const {HttpError} = require('@imat/omega');
// or
const HttpError = require('@imat/omega').HttpError;
```

> If the second parameter is a string then it is used as the `title` property.
> `new HttpError(404, 'Not found');`
>
> is a shorthand way of writing
> `new HttpError(404, {title: 'Not Found'});`

---

## Updated History:

| Date | Author | Description |
| --- | --- | --- |
| 2019-05-24 | Mike Collins | Corrected spelling. |
| 2018-11-26 | Mike Collins | Updated to reflect code changes. |
| 2018-08-22 | Mike Collins | Cleaned up after Pear Review |
| 2018-08-15 | Mike Collins | Initial Draft |
