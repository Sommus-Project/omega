const path = require('path').posix;

function logNameGenerator(logName) {
  const pad = val => `0${val}`.slice(-2);

  return (time, index) => {
    if (!time) {
      return logName;
    }

    let idx = '';
    if (!isNaN(index)) {
      idx = `.${index}`;
    }

    let ext = path.extname(logName);
    let fname = path.basename(logName, ext);
    let year = time.getFullYear();
    let month = pad(time.getMonth() + 1);
    let day = pad(time.getDate());

    return `${fname}-${year}-${month}-${day}${idx}${ext}`;
  }
}

module.exports = logNameGenerator;