const ldapCodes = {
  19: "ACCOUNT_LOCKED",
  49: "INVALID_CREDENTIALS",
  53: "ACCOUNT_DISABLED"
}

class AuthenticationError extends Error {
  constructor(code, reason = 'AUTHENTICATION_ERROR', additional = '') {
    super(reason.split(' Code:')[0]);
    this.additional = additional;
    this.code = code;
    this.subCode = ldapCodes[code];
  }
}

module.exports = AuthenticationError;