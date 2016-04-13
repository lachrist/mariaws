var Events = require("events");

function async_emit (emitter, event) {
  var args = [event];
  for (var i=2; i<arguments.length; i++)
    args.push(arguments[i]);
  setImmediate(function () { emitter.emit.apply(emitter, args) });
}

function connect (options) {
  console.log("MARIASQL-MOCK CONNECT " + JSON.stringify(options));
  this.__connected = true;
  async_emit(this, "connect");
}

function query (options) {
  console.log("MARIASQL-MOCK QUERY " + JSON.stringify(options));
  var results = new Events.EventEmitter();
  if (!this.__connected) {
    async_emit(results, "error");
  } else {
    setImmediate(function () {
      result1 = make_result1();
      results.emit("result", result1);
    });
    setImmediate(function () {
      result2 = make_result2();
      results.emit("result", result2);
    });
    setTimeout(function () { results.emit("end") }, 3000);
  }
  return results;
}

function end () { console.log("MARIASQL-MOCK END") }

function make_result1 () {
  var result = new Events.EventEmitter();
  async_emit(result, "row", [1,2,3]);
  async_emit(result, "row", [4,5,6]);
  async_emit(result, "row", [7,8,9]);
  async_emit(result, "end");
  return result;
}

function make_result2 () {
  var result = new Events.EventEmitter();
  async_emit(result, "row", ['a','b','c']);
  async_emit(result, "row", ['d','e','f']);
  async_emit(result, "end");
  return result
}

module.exports = function () {
  var client = new Events.EventEmitter();
  client.__connected = false;
  client.connect = connect;
  client.query = query;
  client.end = end;
  return client;
};
