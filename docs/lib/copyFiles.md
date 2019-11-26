# copyFiles

Copy a set of files based on an object passed into the function `copyFiles`

## Library Function

This library function is located in `./lib/copyFiles.js`

## Function Signatures

To use this function you pass in an object that contains the list of source files as the keys and their associated destination paths as the values.

```js
copyFiles(files <object>);
```

## Usage

### Internal repo access

```js
const copyFiles = require('./lib/copyFiles');
const files = {
  "node_modules/surface/docs/css/surface_styles.css": "dist/css/md.css",
  "src/**/*.*": "dist"
};

copyFiles(files);
```

### External repo access

If you are using this function from outside of the `@imat/omega` repo then you need to use a different require statement:

```js
const {copyFiles} = require('@imat/omega');
// or
const copyFiles = require('@imat/omega').copyFiles;
```

### Example

If your code uses the object below,

```json
{
  "node_modules/surface/docs/css/surface_styles.css": "dist/css/md.css",
  "src/**/*.*": "dist"
}
```

the file `node_modules/surface/docs/css/surface_styles.css` will be copied to the file `dist/css/md.css` and every file in any folder and sub folder under `src` will be copied into the `dist` folder.

### Single files

if you want to specify an individual file to copy then you supply the relative path of the source file as the key and the relative path of the destination file as the value. These paths are relative to the current working directory (`cwd`).

> You can also supply an absolute path for either the source file or the destination file. Be aware absolute paths may not exist on a different system so use them with caution.

### Globby Files

If you want to copy all files in a folder of several folders then you use a globby path for the source file. `copyFiles` will resolve the globby path into an array of files and copy all of them into the destination folder. In the example object above every folder and file found in the `src` folder will be copied to the `dist` folder.

As an example if the `src` folder looked like this:

```
src
 ├─ css
 │   └─ main.css
 ├─ html
 │   ├─ container
 │   │   └─ other.html
 │   └─ myFile.html
 └─ js
     ├─ file1.js
     ├─ file2.js
     └─ file3.js
```

Then the `dist` folder would look like this:

```
dist
 ├─ css
 │   └─ main.css
 ├─ html
 │   ├─ container
 │   │   └─ other.html
 │   └─ myFile.html
 └─ js
     ├─ file1.js
     ├─ file2.js
     └─ file3.js
```

The destination folder can not be globby and must not end with a slash `/` or `\`.

> Again, if you use an absolute path you risk the path not existing on another machine. **Avoid them.**


---

## Updated History:

| Date | Author | Description |
| --- | --- | --- |
| 2018-08-22 | Mike Collins | Cleaned up after Pear Review |
| 2018-08-13 | Mike Collins | Initial Draft |
