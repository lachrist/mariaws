# MariaWS


MariaWS is a simple WebSocket server for communicating to a MariaDB server (should also work with MySQL).

```Browser <---WebSocket---> MariaWS <---TCP---> MariaDB```

With MariaWS you can use your browser directly talk to a remote database.
A MariaWS server can be started with the command:

```node main.js log=LOG_LEVEL ws-port=WS_PORT heartrate=HEARTRATE sql-host=SQL_HOST sql-port=SQL_PORT```

Where:
* `LOG_LEVEL` is the granularity of the loggin information. The possible values are `info`, `warning` and `error`, the default value is `error`.
  * The `info` level logs pretty much everything into the standard output stream (e.g. incomming messages, responses and pings).
  * The `warning` level log into the standord output streams events that deviate from the standard behvior (e.g. ping timeout and WebSocket error).
  *The `error` level only logs programmatic and critical errors into the standard error stream.
* `WS_PORT` is the port the node WebSocket server should listen to, the default value is `8000`.
* `HEARTRATE` is the number of millisecond between successive pings, the default value is `30000`.
* `SQL_HOST` is the host address of the MariaDB server, the default value is `localhost`.
* `SQL_PORT` is the port that MariaDB server is listening to, the default value is `3306`.

To gracefully stop MariaWS, simply send the `SIGINT` or `SIGTERM` signal to the node process.
Note that you can use the `nohup` command to directly get the prompt back without stopping the server. For instance: `nohup node main.js 1>mariaws.log 2>mariaws.err &`.

## Protocol

### Connection
```{echo:1, user:"smith", password:"secret"}```

### Query
```{echo:1, key:"as2dK...w4=", sql:"SELECT * FROM car;"}```


## SQL console inside

To demonstrate the usage of MariaWS lets setup a SQL console within your browser.
To do so should:
1. Have a MariaDB server running locally and listening to port 3306 (should also work with MySQL).
2. Have a local HTTP server able to serve the index.html file from this repository and that forward Web Socket connections to http://localhost:8000. If you dont know how to do this you can:
  1. Get nginx.
  2. Create anywhere a file named nginx.conf with the below content:

      ```events { }
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
      }```

  3. Replace `PATH-TO-MARIAWS` with the path to the directory of MariaWS.
  4. Make sure everyone is able to read `index.html` ; if your system is Unix/OSX you can run `chmod a+x index.html`.
  5. Run in the terminal: `nginx -c nginx.conf`.
3. Run MariaWS with: `node main.js` (the default WebSocket port is 8000 and the default SQL port is 3306).
4. Open your preferred browser (should support web sockets) and navigate to `http://localhost/index.html`.
