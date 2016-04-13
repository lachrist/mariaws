# MariaWS


MariaWS is a simple WebSocket server for communicating to a MariaDB server (should also work with MySQL).

```Browser <---WebSocket---> MariaWS <---TCP---> MariaDB/MySQL```

With MariaWS enalbes browsers to directly talk to server-side databases using web sockets.
To install MariaWS, run: `npm install mariaws -g`.

## Usage

```shell
mariaws --port=8000 --accept=/^localhost-3306-/ --heartrate=30 --log=error 
```

Understood arguments are:
  * `port`: port to which the WebSocket server should listen; default value is `8000`.
  * `accept`: JavaScript regular expression to discriminate connections; tested against `host-port-db-user`
  * `heartrate`: number of seconds between successive pings; default value is `30`.
  * `log`: granularity of the logger; possible values are `info`, `warning`, `error`; default value is `error`.
    * The `info` level logs pretty much everything into the standard output stream (e.g. incomming messages, responses and pings).
    * The `warning` level logs into the standard output streams events that deviate the ideal behavior (e.g. ping timeouts and WebSocket errors).
    * The `error` level only logs critical errors into the standard error stream.

To gracefully stop MariaWS, send the `SIGINT` or `SIGTERM` signal to the node process.
Note that if you are using Unix/OSX you can use the `nohup` command to cheaply daemonize MariaWS. For instance: `nohup mariaws 1>mariaws.log 2>mariaws.err &`.

## Protocol

MariaWS is a pull-based server: it will only respond to clients' requests and never send messages on its own initiative.
The JSON format is used to encode data through the WebSocket channel.
MariaWS does its best to recognize two JSON templates:
  * `{echo:anything, host:string, port:number, db:string, user:string, password:string}`: Attempting to connect to a mariadb server.
  * `{echo:anything, key:string, sql:string}`: Performs an sql query using a key obtained through a previous successfull connection.

Below is example of successful communication:
```json
>> {"echo":1, "host":"localhost", "port":3306, "db":"prod", "user":"smith", "password":"secret"}
<< {"echo":1, "error":null, "data":"as2dK...w4="}

>> {"echo":2, "key":"as2dK...w4=", "sql":"SELECT * FROM car;"}
<< {"echo":2, "error":null, "data":[[["mercedes", "65000€"], ["volkswaegen", "25000€"]]]}
```

Beside mysql error code, the error field can contain one of the below values:
  * `"not-a-json-object"`: the incoming message could not be parsed as a JSON object.
  * `"no-such-key"`: the given key is not recognized, the connection to the database might have crashed, a connection request should then be sent again.
  * `"connection-refused"`: the connection did not match the accept regex.

Note that MariaWS caches database connections, that is that multiple clients might use the same database connection.

## Demonstration

To demonstrate the usage of MariaWS, we propose to setup a SQL console within your browser.
To do so, you should:
  1. Have a MariaDB server running locally and listening to port 3306.
  2. Have a local HTTP server able to serve the `index.html` file from this repository and that forward Web Socket connections to `http://localhost:8000`. If you do not know how to do this you can:
    1. Get nginx.
    2. Create anywhere a file named nginx.conf with the below content:

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

    3. Replace `PATH-TO-MARIAWS` with the absolute path to the installation directory of MariaWS.
    4. Make sure everyone is able to read `index.html` ; if your system is Unix/OSX you can run `chmod a+r demo.html`.
    5. Run `nginx -c PATH-TO-NGINX`, where `PATH-TO-NGINX` is the absolute path to the `nginx.conf` file.
  3. Start MariaWS: `mariaws `.
  4. Open your preferred browser (should support WebSockets) and navigate to `http://localhost/index.html`.

## API

MariaWS also has a simple API closes to its command line interface:

```javascript
var Mariaws = require("mariaws");
var stop = Mariaws({log:"info", port:8000, heartrate:30});
process.on("SIGINT", stop);
```


