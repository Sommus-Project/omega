function sqlEscape(str) {
  if (typeof str !== 'string') {
    return str;
  }

  return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
    switch (char) { // eslint-disable-line default-case
      case "\0":
        return "\\0";
      case "\x08":
        return "\\b";
      case "\x09":
        return "\\t";
      case "\x1a":
        return "\\z";
      case "\n":
        return "\\n";
      case "\r":
        return "\\r";
      case "\"":
      case "'":
      case "\\":
      case "%":
        // prepends a backslash to backslash, percent, and double/single quotes
        return "\\" + char;
    }
  });
}

module.exports = sqlEscape;