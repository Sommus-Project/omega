function mergeData(currData, patchData) {
  if (patchData) {
    if (typeof patchData === 'object' && !Array.isArray(patchData)) {
      if (typeof currData !== 'object' || Array.isArray(currData)) {
        currData = {}; // eslint-disable-line no-param-reassign
      }
      Object.entries(patchData).forEach(([key, value]) => {
        if (value === null) {
          if (currData.hasOwnProperty(key)) {
            delete currData[key];
          }
        } else {
          currData[key] = mergeData(currData[key], value);
        }
      });
      return currData;
    }
    return patchData;
  }
  return currData;
}

async function mergePatch(doGet, doPut, data) {
  let currData = await doGet();
  let mergedData = mergeData(currData, data);
  return doPut(mergedData);
}

module.exports = { mergePatch, mergeData };