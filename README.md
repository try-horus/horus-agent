# Purpose
This npm package allows you to quickly and seamlessly add instrumentation to your app to automatically generate and export metrics and traces. It is used in the Horus infrastructure.

# Set Up
### Set Up Generation of Metrics & Traces

1. Install the package using `npm`.

```shell
npm install horus-capture

```

2. Import all functions from `horus-capture` at the top of code file.

```js
const { countRequests, countErrors, startLatency, endLatency, Tracing } = require("./horus-telemetry-setup")

```

3. Set up tracing by invoking the `Tracing` function and pass it the name you would like it to be identified by. Most people give it the name of the service/part of the app they are tracing. 

```js
Tracing("checkout-service")

```

4. Beneath the initialization of `express` but above all of your routing, pass `startLatency` and `countRequests` to the server.

```js
const express = require('express')
const app = express()

app.use(startLatency, countRequests)

// routes...
```

5. Beneath all the routes on the same page, pass `countErrors` and `endLatency` to the server.

```js
// routes...

app.use(countErrors, endLatency)

```

You're done!

### Set Up Exporting of Metrics & Traces

Change the `endpoint` in `config.json` to point to the endpoint of your choice. 

[ insert steps how to find that based on setting up Docker ]