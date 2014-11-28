
//////////////
// External //
//////////////

var Ws = require("ws")
var Crypto = require("crypto")
var Log = require("./log.js")
var Db = require("./db.js")

////////////////////
// Socket helpers //
////////////////////

function send (ws, echo, error, data) {
  var msg = JSON.stringify({echo:echo, error:error, data:data})
  Log.info("Send", msg)
  ws.send(msg, function (err) { if (err) { terminate(ws, "Send failure", err) } })
}

function terminate (ws, reason, err) {
  Log.warn("Socket closed", reason, err)
  ws.removeAllListeners("error")
  ws.removeAllListeners("message")
  ws.removeAllListeners("pong")
  ws.terminate()
}

//////////////////////
// Change log level //
//////////////////////

exports.log = Log.gran

////////////////////////////
// Start a MariaWS server //
////////////////////////////

exports.start = function (options) {

  var ws_port = options.ws_port || 8000
  var heartrate = options.heartrate || 30
  var sql_port = options.sql_port || 3306
  var sql_host = options.sql_host || "localhost"
  var server = new Ws.Server({port:ws_port, clientTracking: true})
  var dbs = {}

  setInterval(function () {
    Log.info("Pinging "+server.clients.length+" clients")
    server.clients.forEach(function (ws) {
      if (!ws.__pong) { return terminate(ws, "Ping timeout") }
      ws.__pong = false
      try { ws.ping() } catch (err) { terminate(ws, "Ping failure", err) }
    })
  }, heartrate*1000)

  function onpong () { this.__pong = true }

  function onmessage (msg) {
    var ws = this
    Log.info("Receive", msg)
    try { var o = JSON.parse(msg) } catch (e) { return send(ws, 0, "json-parse-error", e) }
    if ((o === null) || ((typeof o) !== "object")) { return send(ws, 0, "not-an-object", null) }
    if (!o.echo) { return send(this, 0, "no-echo-field", null) }
    if (((typeof o.user) ==="string") && ((typeof o.password) === "string")) {
      var auth = JSON.stringify({user:o.user, password:o.password})
      var hash = Crypto.createHash("sha256").update(auth).digest("base64")
      return Db(sql_host, sql_port, o.user, o.password,
        function (err) { (delete dbs[hash]) },
        function (err, db) {
          if (err) { return send(ws, o.echo, err.code, err) }
          dbs[hash] ? db.end() : dbs[hash]=db
          send(ws, o.echo, null, hash)
        }
      )
    }
    if (((typeof o.key) ==="string") && ((typeof o.sql) === "string")) {
      if (!dbs[o.hash]) { return send(ws, o.echo, "db-connection-closed") }
      return dbs[hash].query(o.query, function (err, rowss) { send (ws, o.echo, err?err.code:null, rowss) })
    }
    send(ws, o.echo, "invalid-fields", null)
  }

  server.on("connection", function (ws) {
    Log.info("Socket connection")
    ws.__pong = true
    ws.on("message", onmessage)
    ws.on("pong", onpong)
    ws.on("error", Log.fail)
  })

  return function () {
    Log.info("Server interupted")
    for (var hash in dbs) { dbs[hash].end() }
    server.clients.forEach(function (ws) { ws.close(1001, "server-interpupted") })
    server.close()
    process.exit()
  }

}
