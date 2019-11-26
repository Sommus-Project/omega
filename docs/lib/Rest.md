# Rest

A class used by API code to make http and https requests. The class provides a consistent way to modify information on the requests and get information about the responses. Imat-UI uses these features to set authentication headers and to forward any generated cookies back to the browser. The `Rest` class can make either http or https requests. 

> `Rest` also shares the same socket **agent** as the `black-list-proxy` object to allow for reuse of sockets.

## Library Class

This library class is located at `./lib/Rest.js`

## Access

An instance of this class is available on the `req` object on all Omega based API functions calls, as well as in `initReqFn` when setting up your Omega app. The object can be accessed with `req.rest`.

```js
function doGet({req}) {
  return req.rest.get('https://some/other/request').send();
}
```

## Usage

### HTTP Functions

The Rest object has the following http methods available: `get(uri)`, `post(uri, data)`, `put(uri, data)`, `delete(uri)`, `patch(uri, data)`, `head(uri)`, and `options(uri)`.

> Each of the http method functions returns an instance of the Sender class. To actually send the request, you must call `.send()` on the return object from the above methods. See *Sender Class* below for more details.

#### Examples

```js
function doGet({req}) {
  return req.rest.get('https://some/other/request').send()
  .then(resp => {
    // Response handler logic
  });
}
```

```js
function doPost({data, req}) {
  return req.rest.post('https://some/other/request', data).send()
  .then(resp => {
    // Response handler logic
  });
}
```

### Helper Functions

These are functions that can be called by your application to either provide data to every request sent or to use information from every response returned.

>  Calling either of these two helper functions twice will remove the first callback and the second callback will be the only one called.

#### onSend(function(sender))

This function registers a callback that will be called just before each request is sent with the `Rest` class. This function should be called in `initReqFn` when setting up your Omega app.

This is where you should make any modifications to requests made with `Rest`, such as headers or authentication. The callback will have access to the instance of Sender used to make the http request.

```js
var omegaConfig = {
  ...
  initReqFn: function(req, res, options) {
    req.rest.onSend(sender => {
      sender.setHeader('authuser', options.authuser, false);
      sender.setHeader('authtoken', options.authtoken, false);
    })
  },
  ...
}
```

#### onResponse(function(response))

This function registers a callback that will be called when a response comes back from a request sent with the `Rest` class. This function should be called in `initReqFn` when setting up your Omega app.

This is where should put any global logic for handling http responses in the API code, like forwarding on cookies to the browser from 3rd party API calls. The callback will have access to the response object from the http request but it may not have access to the body of the response.

```js
var omegaConfig = {
  ...
  initReqFn: function(req, res, options) {
    req.rest.onResponse(response => {
      var cookie = response.headers['Set-Cookie'];
      if (cookie) {
        res.setHeader('Set-Cookie',cookie);
      }
    })
  },
  ...
}
```

## Sender Class

The Sender Class handles the actual request and provides functions for modifying headers and cookies.

### .send()

This function makes the actual http request. If an `onSend` callback has been registered this function will call it before making the http request.

This function returns a `Promise`.

```js
req.rest.put('https://upsert/object', data).send().then(resp => {
  // Handle response
})
```

### .setCookie(cookie, value[, encode=true])

This function sets cookies to be sent with the request. `cookie` is the name of the cookie to be set. `value` is the cookie value. If `value` is null, then the cookie will be deleted from cookies to be sent. If `encode` is set to `true` (default), then the value will be URL encoded.

```js
var request = req.rest.get('https://some/resource');

request.setCookie('authCookie', myAuthCookie, false);

request.send().then(resp => {
  // Handle response
});
```

### .getHeader(header)

This function allows you to access the value of any header by its name.

```js
var authHeader = req.rest.get('https://some/resource').getHeader('Authorization');
```

### .setHeader(header, value[, replace=true])

This function sets headers to be sent with the request. `header` is the name of the header to be set. `value` is the header value. If `replace` is set to `true` (default), any existing value for the header will be replaced by the new value. If set to `false` the value will only be set if the header does not exist.

```js
var request = req.rest.get('https://some/resource');

request.setHeader('Authorization', 'Bearer ' + myAuthToken, false);

request.send().then(resp => {
  // Handle response
});
```

## Updated History:

| Date | Author | Description |
| --- | --- | --- |
| 2019-05-27 | Jeremy Workman | Initial Draft. |