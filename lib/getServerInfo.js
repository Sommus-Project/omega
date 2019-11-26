const getServerInfo = serverLookup => ({
  getServerInfo: serverName => serverLookup[serverName] || serverLookup.default,
  getServerStr: serverName => {
    const info = serverLookup[serverName] || serverLookup.default;
    return `${info.protocol}://${info.hostname}:${info.port}`;
  }
});

module.exports = getServerInfo;