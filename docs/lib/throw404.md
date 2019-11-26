# throw404

A function to throw an HttpError with a response code of 404. This is used by an API file for if a parent entity was not found. This function automatically adds the header:

`'X-No-Entity': path`

## Library Function

This library function is located in `./lib/throw404.js`

## Function Signatures

To use this function you pass in the path of the missing entity and an optional message title to return in the 404 response.

```js
throw404(path <string>[, title <string>]);
```

## Usage

### Internal repo access

```js
const throw404 = require('./lib/throw404');
```

### External repo access

If you are using this function from outside of the `@imat/omega` repo then you need to use a different require statement:

```js
const {throw404} = require('@imat/omega');
// or
const throw404 = require('@imat/omega').throw404;
```

### Example

If the user attempted to perform a GET operation on this URL:

`/user/1/preferences`

And `user[1]` doesn't exist then you can not get their preferences. So you would call:

```js
throw404('/user/1', 'User was not found');
```

---

## Updated History:

| Date | Author | Description |
| --- | --- | --- |
| 2019-07-25 | Mike Collins | Spelling correction |
| 2018-11-25 | Mike Collins | Minor spelling corrections and cleanup. |
| 2018-09-25 | Mike Collins | Initial Draft |
