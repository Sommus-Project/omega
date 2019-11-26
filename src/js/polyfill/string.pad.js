if (String.prototype.padEnd == null) {
  Object.defineProperty(String.prototype, 'padEnd', { // eslint-disable-line no-extend-native
    value: function padEnd(targetLength,padString) {
      //floor if number or convert non-number to 0;
      targetLength = targetLength>>0; // eslint-disable-line no-param-reassign
      padString = String((typeof padString !== 'undefined' ? padString : ' ')); // eslint-disable-line no-param-reassign
      if (this.length > targetLength) {
        return String(this);
      }

      targetLength = targetLength-this.length; // eslint-disable-line no-param-reassign
      if (targetLength > padString.length) {
        //append to original to ensure we are longer than needed
        padString += padString.repeat(targetLength/padString.length); // eslint-disable-line no-param-reassign
      }
      return String(this) + padString.slice(0,targetLength);
    }
  });
}

if (String.prototype.padStart == null) {
  Object.defineProperty(String.prototype, 'padStart', { // eslint-disable-line no-extend-native
    value: function padStart(targetLength, padString) {
      //truncate if number, or convert non-number to 0;
      targetLength = targetLength >> 0; // eslint-disable-line no-param-reassign
      padString = String(typeof padString !== 'undefined' ? padString : ' ');// eslint-disable-line no-param-reassign
      if (this.length >= targetLength) {
        return String(this);
      }

      targetLength = targetLength - this.length; // eslint-disable-line no-param-reassign
      if (targetLength > padString.length) {
        //append to original to ensure we are longer than needed
        padString += padString.repeat(targetLength / padString.length); // eslint-disable-line no-param-reassign
      }
      return padString.slice(0, targetLength) + String(this);
    }
  });
}
