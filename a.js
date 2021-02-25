const jwt = require('./src/lib/jwt');

async function doIt() {
  try {
    const source = { a: 1, b: 22, c: 'see' };
    console.log(source);

    const token = await jwt.sign(source);
    console.log(token);

    const parts = token.split('.');
    parts[1] = parts[1].replace(/eyJh/g, 'eyJl');
    const token2 = parts.join('.');
    console.log(token2);

    try {
      const verified = await jwt.verify(token);
      console.log(verified);
    }

    catch(ex) {
      console.log(ex.stack);
    }
  }

  catch(ex) {
    console.log(ex.stack);
  }
}

console.time('run');
doIt().then(() => console.timeEnd('run'));