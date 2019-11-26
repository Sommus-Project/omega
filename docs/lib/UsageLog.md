# UsageLog

A class that provides usage logging, mainly for calls to the various APIs. _These logs are used to help comply with HIPPA and audit logging requirements._

## Library Function

This library function is located in `./lib/UsageLog.js`

## Class Signature

When you instantiate this class you must pass in the Express `req` object.

```js
new UsageLog(req)
```

## Usage

### Internal repo access

```js
const UsageLog = require('./lib/UsageLog');
```

### External repo access

If you are using this function from outside of the `@imat/omega` repo then you need to use a different require statement:

```js
const {UsageLog} = require('@imat/omega');
// or
const UsageLog = require('@imat/omega').UsageLog;
```

### Example

To use this in an API, an instance of  the `UsageLog` class is available as `req.usageLog`. Any API can call one of the following methods and pass in a single string:

```js
req.usageLog.critical('The server is crashing or the world is about to explode.')
req.usageLog.error('Something real bad happened.')
req.usageLog.warn('Someone attempted to do something they should not have.')
req.usageLog.info('User such and such just logged in.')
req.usageLog.debug('Attempting to open the database.')
```

#### Testing

There is a mock version of the `UsageLog` class for use in Mocha Unit tests. It is called `MockUsageLog` and the file is found here: `./lib/test/MockUsageLog`. It is also exposed as part of the Omega exports as `test/UsageLog`.

##### To use `MockUsageLog` in your mocha tests:

To be able to use this mock Class you must do the following:

* Include the mock Class and `loadapi` in your test file:
```js
const {test} = require('@imat/omega');
const loadapi = test.loadapi('src/api', __dirname);
const {UsageLog} = test;
let req;
```

* Load your API file using `loadapi`

```js
const api = loadapi('./login');
```

* In your `beforeEach` function you need to add `req.usageLog`:

```js
beforeEach(() => {
  req = {
    usageLog: new UsageLog(),
    ... other mock req stuff ...
  };
});
```

* Pass your mock `req` object into your API call:

```js
return api.doGet({req}).then(...
```

* After your API is called you can validate that the proper information was logged by reviewing one or more of the various arrays that `MockUsageLog` produces:

```js
req.usageLog.testData.critical
req.usageLog.testData.error
req.usageLog.testData.warn
req.usageLog.testData.info
req.usageLog.testData.debug
```

* For example, you can validate that a certain array is equal to an expected value:

```js
expect(req.usageLog.testData.info).to.eql(['Testing']);
```

---

## Updated History:

| Date | Author | Description |
| --- | --- | --- |
| 2019-07-25 | Mike Collins | Initial Draft |
