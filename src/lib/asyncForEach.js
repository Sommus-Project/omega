async function asyncForEach(arr, cb) {
  //if (Array.isArray(arr)) {
  let i;
  let len = arr.length;
  for (i = 0; i < len; i++) {
    await cb(arr[i], i, arr);
  }
  //}
}

module.exports = asyncForEach;