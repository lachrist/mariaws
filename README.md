# MariaWS

MariaWS is a simple WebSocket server for communicating to a MariaDB server (should also work with MySQL).

```Browser <---WebSocket---> MariaWS <---TCP---> MariaDB/MySQL```

MariaWS enables browsers to directly talk to server-side databases using web sockets. To install MariaWS, run: `npm install mariaws -g`.

## Usage

```shell
mariaws --port=8000 --accept=/^localhost-3306-/ --heartrate=30 --log=error 
```

CLI Arguments:
  * `port`: Port to which the WebSocket server should listen; default value is `8000`.
  * `accept`: JavaScript regular expression to discriminate connections; tested against `host-port-db-user`.
  * `heartrate`: Number of seconds between successive pings; default value is `30`.
  * `log`: granularity of the logger; possible values are `info`, `warning`, `error`; default value is `error`.
    * The `info` level logs pretty much everything to stdout (e.g. incomming messages, responses and pings).
    * The `warning` level logs events that deviate the ideal behavior to stdout (e.g. ping timeouts and WebSocket errors).
    * The `error` level only logs critical errors stderr.

To gracefully stop MariaWS, send the `SIGINT` or `SIGTERM` signal to the node process. Note that if you are using Unix/OSX you can use the `nohup` command to daemonize MariaWS. For instance: `nohup mariaws 1>mariaws.log 2>mariaws.err &`.

## Protocol

MariaWS is a pull-based server: it will only respond to requests and never send messages on its own initiative. MariaWS recognizes two JSON templates:
  * `{echo:anything, host:string, port:number, db:string, user:string, password:string}`: Attempt to connect to a mariadb server.
  * `{echo:anything, key:string, sql:string}`: Perform an SQL query using a key obtained through a previous successfull connection.

Example of successful communication:

```json
>> {"echo":1, "host":"localhost", "port":3306, "db":"prod", "user":"smith", "password":"secret"}
<< {"echo":1, "error":null, "data":"as2dK...w4="}

>> {"echo":2, "key":"as2dK...w4=", "sql":"SELECT * FROM car;"}
<< {"echo":2, "error":null, "data":[[["mercedes", "65000€"], ["volkswaegen", "25000€"]]]}
```

Beside mysql error code, the error field can contain one of the below values:
  * `"not-a-json-object"`: The incoming message could not be parsed as a JSON object.
  * `"no-such-key"`: The given key is not recognized, the connection to the database might have crashed, a connection request should then be sent again.
  * `"connection-refused"`: The connection did not match the accept regex.

Note that MariaWS caches database connections, that is that multiple clients might use the same database connection.

## Demonstration

To demonstrate the usage of MariaWS, let's setup a SQL console within your browser:
  1. Start a MariaDB server locally which listens to port 3306.
  2. Start HTTP server which serves the file in `test/` and forwards WebSocket connections to `http://localhost:8000`. If you do not know how to do this you can use nginx with the below configuration:
        ```nginx
        events { }
        http {
          server {
            listen 80;
            root PATH-TO-MARIAWS;
            location = /ws {
              proxy_pass http://localhost:8000;
              proxy_http_version 1.1;
              proxy_set_header Upgrade $http_upgrade;
              proxy_set_header Connection "upgrade";
            }
          }
        }
        ```
  3. Start MariaWS: `npx mariaws`.
  4. Got to: `http://localhost/demo.html`.

## API

MariaWS also has a simple API:

```javascript
var Mariaws = require("mariaws");
var stop = Mariaws({ log: "info", port: 8000, heartrate: 30 });
process.on("SIGINT", stop);
```
