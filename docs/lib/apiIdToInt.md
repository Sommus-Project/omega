# apiIdToInt

Convert in incoming API id into an integer value. If the ID is not an integer then an HttpError is thown with a 400 response code.

## Library Function

This library function is located in `./lib/apiIdToInt.js`

## Function Signatures

To use this function you pass in of the API. The function then returns another function into which you pass the ID string.

```js
<number> = apiIdToInt(path <string>)(id <string>);
```

## Usage

### Internal repo access

```js
const apiIdToInt = require('./lib/apiIdToInt')('/users');

let id = apiIdToInt(idStr);
```

### External repo access

If you are using this function from outside of the `@imat/omega` repo then you need to use a different require statement:

```js
const omega = require('@imat/omega');
const apiIdToInt = omega.apiIdToInt('/users');

// or
const apiIdToInt = require('@imat/omega').apiIdToInt('/users');
```

---

## Updated History:

| Date | Author | Description |
| --- | --- | --- |
| 2019-07-25 | Mike Collins | Spelling correction |
| 2018-09-25 | Mike Collins | Initial Draft |
