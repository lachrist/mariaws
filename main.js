
var Mariaws = require("./mariawa.js")

Mariaws.log(arg("log"))

var stop = Mariaws.start({
  ws_port: arg("ws-port"),
  sql_port: arg("sql-port"),
  sql_host: arg("sql-host"),
  heartrate: arg("heartrate")
})

process.on("SIGINT", stop)
process.on("SIGTERM", stop)

function arg (name) {
  var key = name+"="
  for (var i=0; i<process.argv.length; i++) {
    if (process.argv[i].indexOf(key) === 0) {
      return process.argv[i].replace(key)
    }
  }
  return null
}
