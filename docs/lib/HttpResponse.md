# HttpResponse

A class to be used by API code to provide headers along with a response object.

> If your API response does not need any additional headers then just return a value. If you need to change headers then return an instance of `HttpResponse`.

## Library Function

This library function is located in `./lib/HttpResponse.js`

## Function Signature

To use this class you must create a new object and pass in the headers and an optional return value.

```js
<HttpResponse object> new HttpResponse(
    headers <object>[, data <any>[, status <any>]]);
```

## Usage

### Internal repo access

```js
const HttpResponse = require('./lib/HttpResponse');

var resp = new HttpResponse({'X-my-header': 'awesomesauce'}, {name:'Frank',age:99});
// or
var resp = new HttpResponse(null, 'some response data', 201);
```

### External repo access

If you are using this function from outside of the `@imat/omega` repo then you need to use a different require statement:

```js
const {HttpResponse} = require('@imat/omega');
// or
const HttpResponse = require('@imat/omega').HttpResponse;
```

---

## Updated History:

| Date | Author | Description |
| --- | --- | --- |
| 2019-05-24 | Mike Collins | Corrected the external repo section and other spelling. |
| 2018-11-25 | Mike Collins | Corrected to match current code. |
| 2018-08-22 | Mike Collins | Cleaned up after Pear Review |
| 2018-08-15 | Mike Collins | Initial Draft |
