# OMEGA

Omega is a Node.js application framework for building Web based applications.

> Since it is a Node.js framework you will need to install Node.js to use it.

We will try to keep Omega compatible with both the [current release](https://nodejs.org/en/download/current/) and the [Active LTS release of Node.js](https://github.com/nodejs/Release).

> As of July 1, 2019 we recommend using Node version 12.x. *Use a version no lower then 12.1.0.*


## Install

### Initialize your app folder

Create your application folder and initialize it as an npm compatible repo:

```
npm init
```

> Accept all of the default settings or adjust them as you desire.

### Install Omega

When your folder is set up you first need to install OmegaTools:

```bash
npm install --save-dev git+https://github.com/IMAT-Solutions/omega-tools.git
```

Then you install Omega:

```bash
npm install --save git+https://github.com/IMAT-Solutions/omega.git
```

### Create your app

Now create a simple app by creating the file `app.js` in your project's root folder with the following content:

```
const omega = require('@imat/omega');
const app = omega();
app.start();
```

Save the file.

### Create the static folder

Omega needs a location from which it can server static files. By default this folder needs to be called `static` and needs to be a sibling to your `app.js` file.

```bash
mkdir static
```

> You do not need to place any files in the `static` folder at this time.

### Start your app

Now that your simple app is written you need to start your app.

```bash
node app
```

### View your app

Open a Web Browser to `http://localhost:3000/system/node/npm`. The browser should auto redirect to `https://localhost:3001/system/node/npm` and will likely bring up a warning about invalid certificates or an insecure site. Just accept the certificates or allow the page to load and view the real page.

You should see a page that shows what NPM repos your application is using. It will look something like this:

| &nbsp; | Repo | Version |
| - | - | - |
| 1 | @babel/code-frame | 7.0.0-rc.1 |
| 2 | @babel/generator | 7.0.0-beta.51 |
| 3 | @babel/helper-function-name | 7.0.0-beta.51 |
| 4 | @babel/helper-get-function-arity | 7.0.0-beta.51 |
| 5 | @babel/helper-split-export-declaration | 7.0.0-beta.51 |
| 6 | @babel/highlight | 7.0.0-rc.1 |
| 7 | @babel/parser | 7.0.0-beta.51 |
| 8 | @babel/template | 7.0.0-beta.51 |
| 9 | @babel/traverse | 7.0.0-beta.51 |
| 10 | @babel/types | 7.0.0-beta.51 |
| 11 | accepts | 1.3.5 |
| 12 | acorn | 5.7.1 |
| 13 | acorn-dynamic-import | 3.0.0 |
| 14 | acorn-jsx | 4.1.1 |

## Using Omega

### Config Option Properties

When you call `omega()` you can pass in an object of configuration options. These options define how you want your app to run and gives you the ability to override some of the default functionality.

| Property | Type | Default | Description |
| - | - | - | - |
| `apiDocs` | Boolean | `true` | Enable the API docs located, by default, at the `/api` url. |
| `apiFolder` | String | `'api'` | Folder location for the API system. See [Api System](#apiSystem) below. |
| `apiUri` | String | `'/api'` | URL path for the API system. See [Api System](#apiSystem) below. |
| `appHeaders` | Array of strings | `[]` | An array of response headers that Omega will set in the response before any other operation. |
| `appPath` | String | `process.cwd()` | The root path of your application and where all application sub folders are located. |
| `appRoutes` | String/Array of strings | `'routes/!(*.mocha).js'` | A globby list of the set of files, relative to `appPath`, that are your applications route files. This can be a single filename, a globby filename or an array of filenames. |
| `brandFolder` | tring | `'brand'` | The path in which the customer places their branding CSS and JS files. |
| `cacheBuster` | string | `'0'` | A string used for cache busting of JS and CSS files |
| `certPath` | string | `path.join(__dirname, 'defaultCerts/cert.pem')` | location of the `cert` file to use with HTTPS. |
| `db` | object | `{}` | Information about how to set up any needed database objects. |
| `devMode` | boolean | `false` | `true` indicates that you are in developer mode. |
| `disableLogging` | boolean | `false` | If `true` then we do not log any access information. |
| `favicon` | string | `'/brand/img/favicon.ico'` | The relative URL of the branding favorite icon. |
| `fileLimit` | string | `'1mb'` | The maximum data size for post date, both JSON or URL Encoded. |
| `httpPort` | uint | `3000` | The port to use for HTTP requests. If this is set to `false` then Omega will not listen for http requests on any port. |
| `httpsPort` | uint | `3001` | The port to use for HTTPS requests. If this is set to `false` then Omega will not listen for https requests on any port. |
| `initAppFn` | function | `null` | A function that is called when the app initializes. _See below for more info._ |
| `initReqFn` | function | `null` | A function that is called at the beginning of each request. _See below for more info._ |
| `keyPath` | string | `path.join(__dirname, 'defaultCerts/key.pem')` | location of the `key` file to use with HTTPS. |
| `logFileName` | false | string | `false` |
| `logFormat` | string | `'imat'` | Configuration options for the HTTP request logging system [Morgan](https://www.npmjs.com/package/morgan). The default format `imat` is similar to that of what `NginX` produces including the sessionId and the requestId. |
| `logPath` | string | `'../logs/node'` | The path, into which all log files are saved. Only used if `logFileName !== false` |
| `logSkipFn` | boolean or Function | `false` | The skip function defined in [Morgan](https://www.npmjs.com/package/morgan) or set to `true` to use the default skip function. |
| `maxLogFileSize` | string | `'500M'` | The maximum size of a log file generated by [Morgan](https://www.npmjs.com/package/morgan). |
| `proxyHost` | string | `'10.10.9.238'` | The address to use for proxy operations. |
| `proxyPort` | string | `443` | The port to use for proxy operations. _All proxy operations are done using HTTPS._ |
| `proxyPostCallback` | function | `null` | A function to be called each time a proxy operation finishes. This function is passed the proxy response object. |
| `proxyPreCallback` | function | `null` | A function that is called just before each proxy request is made. |
| `proxyTimeout` | number | 30000 | Default timeout when using proxy is 30,000ms or 30 seconds. |
| `redirect` | object | `null` | The server can redirect based on domain names. _See below for more info._ |
| `redirectFn` | function | null | A function that is called early in the express stack to allow you to handle old path redirects to new paths. |
| `reqFinishedFn` | function | `null` | A function that is called at the beginning of each request allowing your app to do cleanup. _See below for more info._ |
| `serverName` | string | `Omega/<ver>` | The value of the `Server` response header. If none is provided then Omega will not respond with its own `Server` response header. |
| `staticFolder` | string | `'static'` | Folder, from `appPath`, that holds all static files. |
| `token` | string | `''` | A user access token to be able to avoid login - **Development only** |
| `useProxy` | Boolean | `false` | If set to `true` then then the proxy system will be used. |
| `username` | string | `''` | A user name to be able to avoid login - **Development only** |
| `viewFolder` | string | `'views'` | Folder, from `appPath`, that holds your EJS view files. |

If you don't want the default options values then call `omega()` with the values you want to change:

```js
omega({
  favicon: '/img/favicon.ico',
  fileLimit: '3mb',
  logFormat: 'combined',
  useProxy: false
});
```

#### `devMode`

Omega doesn't do anything different when in developer mode. It is up to each Omega application to do whatever they need to when in or out of developer mode.

#### `initAppFn`

The function `initAppFn` allows you to initialize things that are specific to the application. The most common thing done here is to make values available to the EJS pages.

> You have access to the `app` and `config` objects

**Example:**

```js
function initAppFn(app, options) {
  // Do your app specific initialization here
  // Provide values for EJS pages:
  app.locals.hosts = {
    self: `https://localhost:${options.httpsPort}`,
    proxy: `https://${app.locals.proxyHost}:${app.locals.proxyPort}`
  };
}
```

#### `initReqFn`

The function `initReqFn` allows you to initialize things that are specific to each request. This is where you should set up `onSend` and `onResponse` callbacks, see [Rest](docs/lib/Rest.md).

> You have access to the `req` ,`res` and application `options` objects

**Example:**

```js
function initReqFn(req, res, options) {
  // Do your request specific initialization here
}
```

#### `redirect`

The `redirect` object allows for domain name redirection.

Example:

```json
redirect: {
  server: {
     "dog.com": "cat.com",
     "testing.net": "testing.com"
  }
}
```

If the browser attempts to hit the node server using the domain name "dog.com" it will be redirected to the same path on "cat.com" or if it uses the domain name "testing.net" it will redirect to "testing.com"

The redirection will also only go to `https` so, for example, attempting to go to:

`http://dog.com/bark/and/eat`

will redirect to:

`https://cat.com/bark/and/eat`

#### `reqFinishedFn`

The function `reqFinishedFn` gives you application a place to do cleanup at the end of each request.

> The response has already been sent and the connection closed so you can not affect the response in any way.
>
> You have access to the `req` ,`res` and application `options` objects

**Example:**

```js
function reqFinishedFn(req, res, options) {
  // Do your request specific cleanup here
}
```

#### `proxyPostCallback`

The function `proxyPostCallback` gives your application a chance to examine and modify the response object from a proxy request before it is sent back to the browser.

> This only includes the header portion of the response and does not include the body.

The parameters sent to the `proxyPostCallback` are:

| parameter | description |
| - | - |
| `response` | The status and headers of the response from the proxy call. |
| `req` | The original request object that was sent to the proxy call. |
| `options` | The options that were created to determine what the proxy call was to be. |

**Example:**

```js
function proxyPostCallback(response, req, options) {
  // Do what you need to after the proxy request returns.
}
```

#### <a name="apiSystem">API System</a>

The `api` system uses two configuration properties, `apiFolder` and `apiUri`.

The `apiFolder` property is the relative folder from your application's root folder where the API System looks for API files.

The `apiUri` property defines where, in he app's URL, is the starting point for calling the API files.

##### Example

Assuming that we pass in the following configuration object to the API system:

```json
{
  apiFolder: 'src/api',
  apiUri: '/myapi'
}
```

And assuming that our API folder structure is like this:

```
src
 └─ api
     ├─ movies.js
     ├─ movies
     │   └─ (movieid).js
     ├─ users.js
     └─ users
         ├─ (uid).js
         └─ (uid)
             ├─ properties.js
             └─ properties
                 └─ (propid).js
```

Then the users can access the following endpoints:

```
http://localhost:3000/myapi/movies
http://localhost:3000/myapi/movies/:movieid
http://localhost:3000/myapi/users
http://localhost:3000/myapi/users/:uid
http://localhost:3000/myapi/users/:uid/properties
http://localhost:3000/myapi/users/:uid/properties/:propid
```

More information about writing API Files can be [found in apifiles.md](docs/apifiles.md)

Information about using the Omega API tool can be found in the [Omega-Tools README.md file](https://github.com/IMAT-Solutions/omega-tools/blob/master/README.md#omegaapi)

### Library Functions

The Omega project has several library files that can be used in your Node.js code.

> **All Omega-Lib exported library functions are included and the following functions specific to Omega.**

* [apiIdToInt](docs/lib/apiIdToInt.md) - Convert an incoming ID string to a int.
* attrEsc - Escape an attribute value.
* [copyFiles](docs/lib/copyFiles.md) - Copy _globby_ named files from one location to another.
* [Endpoint](docs/lib/Endpoint.md) - A class for making API endpoint calls to other servers.
* [EntityCreated](docs/lib/EntityCreated.md) - A class to be used when an API entity is created.
* getHeader - Get a header value without reguard to string case.
* getXForwardedForHeader - Provides a standards based value for the `X-Forwarded-For` header.
* [HttpError](docs/lib/HttpError.md) - A class to be used by API code to indicate an `HttpError` has occurred.
* [HttpResponse](docs/lib/HttpResponse.md) - A class to be used by API code to provide headers along with a response object.
* HTTP_STATUS - A list of all HTTP Status Codes and their text definitions.
* isFalse - Returns `true` if the passed in string value is `'0'`, `'f'` or `'false'`.
* isRegExp - Returns `true` if the passed in value is a RegExp object.
* isString - Returns `true` if the passed in value is a String.
* isTrue - Returns `true` if the passed in string value is `'1'`, `'t'` or `'true'`.
* [mergeData](docs/lib/mergePatch.md#mergedata) - A function that takes original data and a merge object and returns the merged object.
* mergeConfigFile - Read and combine `app.config.json` into the default config values.
* [mergePatch](docs/lib/mergePatch.md) - A function to automatically `GET` original data and `PUT` merged data.
* [Rest](docs/lib/Rest.md) - A class for making http requests from API code.
* SEVERITY_LEVEL - A set of values used by UsageLog that indicate the level of severity for a particular log entry.
* test - A set of routines to be used by unit tests.
* [throw404](docs/lib/throw404.md) - A function to throw an `HttpError` with a response code of 404 and appropriate headers.
* [UsageLog](docs/lib/UseageLog.md) - A system for logging usage of the system. This is integrated into the API system so all APIs will log their access and allow for all APIs to append messages into the log system.

------

## Updated History:

Update information is found in [UPDATE.md](docs/UPDATES.md)
