
var MariaSql = require("mariasql");

function end () {
  this.__client.removeAllListeners("close");
  this.__client.end();
}

function query (sql, k) {
  var error = undefined;
  var rowss = [];
  this.__client.query(sql, true)
    .on("end", function () { k(error, rowss) })
    .on("error", function (err) { error = err })
    .on("result", function (res) {
      var rows = [];
      res.on("row", function (row) { rows.push(row) });
      res.on("end", function () { rowss.push(rows) });
    });
}

module.exports = function (options, log, oncrash, k) {
  options.keepQueries = false;
  options.multiStatements = true;
  var client = new MariaSql();
  client.on("error", function (err) { k(err.code) });
  client.on("connect", function () {
    client.removeAllListeners("error");
    client.on("error", log.fail);
    client.on("close", oncrash);
    k(undefined, {__client:client, end:end, query:query});
  });
  client.connect(options);
};
