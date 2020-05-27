const fixupRE = /at ([^ ]+) \(eval at require .*, <anonymous>:(\d+):(\d+)\)/;
function apiFixStack(stack, debugFilePath) {
  return stack.replace(fixupRE, (a, b, c, d) => {
    const line = Number(c) - 2;
    return `at ${b} (${debugFilePath}:${line}:${d})`;
  });
}

module.exports = apiFixStack;