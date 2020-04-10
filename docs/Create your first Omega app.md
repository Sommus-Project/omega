### Create your first Omega app

Create a new folder:

```bash
mkdir omega1
cd omega1
```

The initialize it for NPM.

```bash
npm init
```

Just select all of the defaults.

Then install Omega and Omega Tools

```bash
npm i @sp/omega @sp/omega-tools
```

And use Omega to initialize your application

```bash
npx omega init
```

This will create several needed folders and a simple app file `src/app.js` with the following content:

```js
const omega = require('@sp/omega');
const app = omega();
app.start();
```

Omega expects all of your source files to be in the `src` folder

### Start your app

Now you need to start your app.

```bash
npm run start
```

### View your app

Open a Web Browser to `http://localhost:3000/system/node/npm`. The browser should auto redirect to `https://localhost:3001/system/node/npm` and will likely bring up a warning about invalid certificates or an insecure site. Just accept the certificates or allow the page to load and view the real page.

You should see a page that shows what NPM repos your application is using. It will look something like this:

| &nbsp; | Repo                                   | Version       |
| ------ | -------------------------------------- | ------------- |
| 1      | @babel/code-frame                      | 7.0.0-rc.1    |
| 2      | @babel/generator                       | 7.0.0-beta.51 |
| 3      | @babel/helper-function-name            | 7.0.0-beta.51 |
| 4      | @babel/helper-get-function-arity       | 7.0.0-beta.51 |
| 5      | @babel/helper-split-export-declaration | 7.0.0-beta.51 |
| 6      | @babel/highlight                       | 7.0.0-rc.1    |
| 7      | @babel/parser                          | 7.0.0-beta.51 |
| 8      | @babel/template                        | 7.0.0-beta.51 |
| 9      | @babel/traverse                        | 7.0.0-beta.51 |
| 10     | @babel/types                           | 7.0.0-beta.51 |
| 11     | accepts                                | 1.3.5         |
| 12     | acorn                                  | 5.7.1         |
| 13     | acorn-dynamic-import                   | 3.0.0         |
| 14     | acorn-jsx                              | 4.1.1         |

## 