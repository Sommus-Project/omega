# Endpoint

A class to be used by API code to use HTTP and HTTPS to request data from other Endpoints.

## Library Function

This library function is located in `./lib/Endpoint.js`

## Function Signature

To use this class you must create a new object and pass in a status code and optional set of values.

```js
<Endpoint objcet> new Endpoint(sessionId <string>, requestId <string>);
```

## Usage

### Internal repo access

```js
const Endpoint = require('./lib/Endpoint');

var ep = new Endpoint(req.cookies.auth_tkt, req.requestId);
```

### External repo access

If you are using this function from outside of the `@imat/omega` repo then you need to use a different require statement:

```js
const {Endpoint} = require('@imat/omega');
// or
const Endpoint = require('@imat/omega').Endpoint;
```

## Example

To call an endpoint on a different server you must first instantiate the `Endpoint` object and then call one of the following member functions:

| Member Functions                          | Description                                                  |
| ----------------------------------------- | ------------------------------------------------------------ |
| `delete(uri <string>)`                    | Delete a resource                                            |
| `get(uri <string>)`                       | Get either a list of resources or a single resource.         |
| `head(uri <string>)`                      | Get the headers of a resource as if the specified resource had been requested with an HTTP GET method. |
| `options(uri <string>)`                   | Get a description of the communication options for the target resource. |
| `patch(uri <string>, patchData <object>)` | Patch a resource, _Built in support coming soon._            |
| `post(uri <string>, data <any>)`          | Post a NEW resource                                          |
| `put(uri <string>, data <any>)`           | Put an updated resource                                      |

All methods above return an object with the following functions:

| Member Function                            | Description                                                  |
| ------------------------------------------ | ------------------------------------------------------------ |
| `send()`                                   | Send the HTTP or HTTPS request and return a promise that is resolved when the request finishes. |
| `setCookie(cookie, value, encode = true)`  | `cookie` = The name of the cookie to set<br />`value` = The value of the cookie<br />`encode===true` = Use `encodeURIComponent` on the value. |
| `setHeader(header, value, replace = true)` | `header` = The name of the header to set<br />`value` = The value of the header<br />`replace===true` = Replace the header if it is already set. |

Here is an example:

```js
const endpoint = new Endpoint(req.cookies.auth_tkt, req.requestId);
return endpoint.get('https://api.otherserver.com/someurl').send().then(
  resp => {
    if (resp.ok) {
      return resp.data
    }

    return false;
  }
);
```



## Updated History:

| Date       | Author       | Description   |
| ---------- | ------------ | ------------- |
| 2018-11-26 | Mike Collins | Initial Draft |
