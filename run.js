#!/usr/bin/env node
var Mariaws = require("./mariaws.js");
var Minimist = require("minimist");
var stop = Mariaws.start(Minimist(process.argv.slice(2)));
process.on("SIGINT", stop);
process.on("SIGTERM", stop);