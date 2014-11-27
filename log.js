
function nil () {}

function log (stream, severity, datas) {
  stream.write(severity)
  stream.write(" ")
  stream.write(String(new Date()))
  stream.write("\n")
  for (var i=0; i<datas.length; i++) {
    stream.write("    ")
    try { stream.write(JSON.stringify(datas[i])) }
    catch (e) { stream.write(String(datas[i])) }
    stream.write("\n")
  }
}

exports.info = nil
exports.warn = nil 
exports.fail = function () { log(process.stderr, "ERROR", arguments) }

exports.gran = function (level) {
  exports.info = (level==="info") ? function () { log(process.stdout, "info", arguments) } : nil
  exports.warn = (level==="info"||level==="warning") ? function () { log(process.stdout, "Warning", arguments) } : nil
}
