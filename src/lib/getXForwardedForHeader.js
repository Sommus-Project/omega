module.exports = req => {
  const remote = req.socket.remoteAddress;
  let addr = req.headers['x-forwarded-for'] || '';
  return addr ? `${addr}, ${remote}` : remote;
}
