async function asyncSome(arr, cb) {
  let i;
  let len = arr.length;
  for (i = 0; i < len; i++) {
    let found = await cb(arr[i], i, arr);
    if (found) {
      return true;
    }
  }
  return false;
}

module.exports = asyncSome;