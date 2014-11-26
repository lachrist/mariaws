
var MariaSql = require("mariasql")
var Log = require("./log.js")

function end () {
  this.__client.removeAllListeners("close")
  this.__client.end()
}

function query (sql, k) {
  var error = null
  var rowss = []
  this.__client.query(sql, true)
    .on("end", function () { k(error, rowss) })
    .on("error", function (err) { error=err })
    .on("result", function (res) {
      var rows = []
      res.on("row", function (row) { rows.push(row) })
      res.on("end", function () { rowss.push(rows) }) 
    })
}

exports.db = function (host, port, user, password, oncrash, k) {
  var client = new MariaSql()
  client.on("error", k)
  client.on("connect", function () {
    client.removeAllListeners("error")
    client.on("error", Log.fail)
    client.on("close", oncrash)
    k(null, {__client:client, end:end, query:query})
  })
  client.connect({
    keepQueries: false,
    multiStatements: true,
    host: host,
    port: port,
    user: user,
    password: password
  })
}
