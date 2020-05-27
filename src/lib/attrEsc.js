const attrRe = /['"&]/g;
const attrReplace = {
  '&': '&amp;',
  '"': '&quot;',
  '\'': '&amp;'
};

module.exports = (str = '') => str.toString().replace(attrRe, key => attrReplace[key]);
