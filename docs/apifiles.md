# Omega API Files

Omega API files are edited within the `./src/api` folder structure. The build process should move these files from the `./src/**` folder to the `./dist/**` folder.

The name and location of these files indicates how the file will be accessed from the API URL. When you launch your Omega app it runs from the `./dist/app.js` file and uses the API files from `./dist/api/**` folder.

**Examples of URL to file mapping:**

| Endpoint                                                     | File / Function                                              |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| `GET /api/users`                                             | `./dist/api/users.js`<br />`doGet()`                         |
| `GET /api/users/snoopy`                                      | `./dist/api/users/(userid).js`<br />`doGet({id="snoopy"})`   |
| `DELETE /api/users/snoopy`                                   | `./dist/api/users/(userid).js`<br />`doDelete({userid="snoopy"})` |
| `PUT /api/users/snoopy/prefs/sidebar`<br />`{"opened":true}` | `./dist/api/users/(userid)/prefs/(prefid).js`<br />`doPut({`<br />    `userid="snoopy",`<br />    `prefid="sidebar",`<br />    `data={opened:true}`<br />`})` |
| `POST /api/users/lucy/prefs`<br />                           | `postItem()` _This would likely be an invalid call since it would be trying to set all parameters at the same time._ |
|                                                              |                                                              |
|                                                              |                                                              |

