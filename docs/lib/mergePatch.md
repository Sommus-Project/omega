# mergePatch

A function that performs a merge patch of an object at a given url. This function and its companion function `mergeData` (see below) are available globally inside of api files.

The function will call `doGet` to get the current object from the database or file system. It will then merge the current data with the patch command object passed and call `doPut` with the result.

## Library Function

This library function is located in `./lib/mergePatch.js`

## Function Signatures

To use this function you pass in a `doGet` function and a `doPut` function that already have the ids and `req` object from the original api request bound, as well as the patch command object.

```js
function doPatch({definitionid, data, req}) {
  const getWithId = () => {
    return doGet({definitionid, req});
  }

  const putWithId = (mergedData) => {
    return doPut({definitionid, data: mergedData, req});
  }

  return mergePatch(getWithId, putWithId, data);
}
```

Note the signatures of the `getWithId` and `putWithId` functions passed to `mergePatch`. `mergePatch` will not pass any parameters when calling the `GET` function and will only pass the merged data to the `PUT` function.

## Usage

### Internal repo access

```js
const mergePatch = require('./lib/mergePatch.js');
```

### External repo access

If you are using this function from outside of the `@imat/omega` repo then you need to use a different require statement:

```js
const {mergePatch} = require('@imat/omega');
// or
const mergePatch = require('@imat/omega').mergePatch;
```

## mergeData

This function is used by `mergePatch` to combine the current server data with that of patch request. This function is also available globally if you wish to handle your own patch endpoint differently than the default `mergePatch`.

`mergeData` follows the logic indicated in section 2 of [this spec](https://tools.ietf.org/html/rfc7396).

```js
mergeData(currentData, patchCommandData);
```

---

## Updated History:

| Date | Author | Description |
| --- | --- | --- |
| 2019-07-25 | Mike Collins | Spelling correction |
| 2019-06-06 | Jeremy Workman | Initial Draft |
