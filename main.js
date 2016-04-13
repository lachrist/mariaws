
var Ws = require("ws");
var Crypto = require("crypto");
var Log = require("./log.js");
var Db = require("./db.js");

function onpong () { this.__pong = true }

function doubledash () { return "--" } 
function escape (str) { return str ? str.replace(/-/g, doubledash) : "" }

module.exports = function (options) {

  var salt = String(Math.random());
  var log = Log(options.log);
  var server = new Ws.Server({port:options.port || 8000, clientTracking:true});
  var dbs = {};

  function send (ws, echo, error, data) {
    var msg = JSON.stringify({echo:echo, error:error, data:data});
    log.info("Send", msg);
    ws.send(msg, function (err) { err && terminate(ws, "Send failure", err) });
  }

  function terminate (ws, reason, err) {
    log.warn("Socket closed", reason, err);
    ws.removeAllListeners("error");
    ws.removeAllListeners("message");
    ws.removeAllListeners("pong");
    ws.terminate();
  }

  var pinging = setInterval(function () {
    log.info("Pinging "+server.clients.length+" clients");
    server.clients.forEach(function (ws) {
      if (!ws.__pong)
        return terminate(ws, "Ping timeout");
      ws.__pong = false;
      try {
        ws.ping();
      } catch (e) {
        terminate(ws, "Ping failure", e);
      }
    })
  }, (options.heartrate || 30) * 1000);

  function onmessage (msg) {
    log.info("Receive", msg);
    try { msg = JSON.parse(msg) } catch (e) {}
    if (msg === null || typeof msg !== "object")
      return send(this, 0, "not-a-json-object", null);
    if (typeof msg.key === "string" && typeof msg.sql === "string")
      return dbs[msg.key]
        ? dbs[msg.key].query(msg.sql, send.bind(null, this, msg.echo))
        : send(this, msg.echo, "no-such-key");
    msg = {
      echo: msg.echo,
      host: /^[0-9\.]*$/.test(msg.host) ? String(msg.host) : "localhost",
      port: Number(msg.port) || 3306,
      db: msg.db ? String(msg.db) : null,
      user: msg.user ? String(msg.user) : null,
      password: msg.password ? String(msg.password) : null
    };
    var con = msg.host + "-" + msg.port + "-" + escape(msg.db) + "-" + escape(msg.user);
    if (options.accept && !options.accept.test(con))
      return send(this, msg.echo, "connection-refused");
    var key = Crypto.createHash("sha256").update(salt + "-" + con + "-" + msg.password).digest("base64");
    if (dbs[key])
      return send(this, msg.echo, undefined, key);
    var ws = this;
    Db(msg, log, function (err) { (delete dbs[key]) }, function (err, db) {
      if (err)
        return send(ws, msg.echo, err);
      dbs[key] ? db.end() : dbs[key] = db;
      send(ws, msg.echo, undefined, key);
    });
  }

  server.on("connection", function (ws) {
    log.info("Socket connection");
    ws.__pong = true;
    ws.on("message", onmessage);
    ws.on("pong", onpong);
    ws.on("error", log.fail);
  });

  return function () {
    clearInterval(pinging);
    log.info("Server interupted");
    for (var hash in dbs)
      dbs[hash].end();
    for (var i=0; i<server.clients.length; i++)
      server.clients[i].close(1001, "server-interupted");
    server.close();
  }

}
