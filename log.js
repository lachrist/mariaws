
function nil () {}

function log (stream, severity) {
  return function () {
    stream.write(severity);
    stream.write(" ");
    stream.write(String(new Date()));
    stream.write("\n");
    for (var i=0; i<arguments.length; i++) {
      stream.write("    ");
      try {
        stream.write(JSON.stringify(arguments[i]));
      } catch (e) {
        stream.write(String(arguments[i]));
      }
      stream.write("\n");
    }
  }
}

module.exports = function (level) {
  return {
    fail: log(process.stderr, "ERROR"),
    warn: (level === "warning" || level === "info") ? log(process.stdout, "Warning") : nil,
    info: (level === "info") ? log(process.stdout, "info") : nil
  };
}
