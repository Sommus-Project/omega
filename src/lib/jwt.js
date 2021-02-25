const { createSigner, createDecoder, createVerifier } = require('fast-jwt');
const JWT_SECRET = process.env.JWT_SECRET || 'Ju8jdfajdw90qjdALKSJD';

module.exports = {
  decode(token) {
    return createDecoder()(token);
  },

  async sign(data) {
    const signWithPromise = createSigner({ key: async () => JWT_SECRET });
    return await signWithPromise(data);
  },

  async verify(token) {
    return createVerifier({ key: async () => JWT_SECRET })(token);
  }
};
