
var Module = require("module");
var Fs = require("fs");
var Ws = require("ws");

Module._extensions[".js"] = function (module, filename) {
  if (filename.endsWith("/mariasql/lib/Client.js"))
    filename = __dirname + "/mariasql_mock.js";
  var content = Fs.readFileSync(filename, "utf8");
  if (content.charCodeAt(0) === 0xFEFF)
    content = content.slice(1);
  module._compile(content, filename);
};

var Mariaws = require("../main.js");

process.on("SIGINT", Mariaws({log:"info", port:8000, heartrate:10}));

setTimeout(function () {
  var ws = new Ws("ws://localhost:8000");
  log(ws, ["open", "close", "message", "error", "ping", "pong"]);  
  ws.on("open", function () {
    ws.send(JSON.stringify({echo:0,user:"smith"}));
  })
  ws.on("message", function (msg) {
    msg = JSON.parse(msg);
    if (msg.echo === 0)
      ws.send(JSON.stringify({echo:1,key:msg.data,sql:"yolo"}));
  });
}, 1000);

function log (emitter, events) {
  events.forEach(function (event) {
    emitter.on(event, function () {
      console.log("CLIENT " + event + ": ");
      for (var i=0; i<arguments.length; i++)
        console.log("   " + arguments[i]);
    });
  });
}


