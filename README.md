# Purpose
This npm package allows you to quickly and seamlessly add instrumentation to the backend of your application. It will automatically generate and export metrics and traces. It is used in the Horus infrastructure.

# Set Up
### Set Up Generation of Metrics & Traces

1. Install the package using `npm`.

```shell
npm install horus-agent

```

2. Import agents from `horus-agent` at the top of code file.

```js
const { MetricsAgent, TracingAgent} = require("horus-agent")

```

3. Set up tracing by invoking the `TracingAgent` function and pass it the name you would like it to be identified by. **This should be invoked directly beneath your imported agents and before any other services**. Most people give it the name of the service/part of the app they are tracing. 

```js
// imported agents...

TracingAgent("checkout-service")

// all other services...
```

4. Beneath the initialization of `express` but above all of your routing, pass `startLatency` and `countRequests` from `MetricsAgent`to the server.

```js
const express = require('express');
const app = express();

app.use(
  MetricsAgent.startLatency,
  MetricsAgent.countRequests
)

// routes...
```

5. Beneath all the routes on the same page, pass `countErrors` and `endLatency` from `MetricsAgent`to the server.

```js
// routes...

app.use(
  MetricsAgent.countErrors,
  MetricsAgent.endLatency
)
```

6. In every route (or every route that you'd like to monitor), pass in `next` as a parameter and invoke `next()` at the very end.

```js
// example route

app.get('/dashboard', async (req, res, next) => {
  const movies = await getUrlContents('http://localhost:4000/movies', nodeFetch);

  res.type('json');
  res.send(JSON.stringify({ dashboard: movies }));

  next(); // next() is the last line of the route
})

```

7. In order for errors to be detected by `MetricsAgent`, you must explicitly throw an error within a middleware or in a route handler. This is because when there is an error in Express, by default it will give a status code that matches the error, but it will not _throw_ an error unless you explictly tell it to. 

You can throw an error in a route:

```js
app.get('/dashboard', async (req, res, next) => {
  const movies = await axios.get('http://localhost/information');
  
  if (movies.body.length === 0) {
    return next (new Error('500')); // custom error to be thrown if information is empty
  }

  res.type('json');
  res.send(JSON.stringify({ dashboard: movies }));

  next(); // next() is the last line of the route
})
```

Or you can use a custom catch all middleware, placed beneath all other route handlers in the file:

```js
// all other route handlers

app.use(function(req, res, next) {
  if (!req.route) {                     // if the route does not exist (can add to this if/else conditional)
      return next (new Error('404'));   // throw a 404 error
    }  

  next();                              // send the req to the next middleware
})

// app.listen....
```

You're done!

### Set Up Exporting of Metrics & Traces

Change the `endpoint` in `config.json` to point to the host of your choice. 

If you are hosting Horus via Docker on your local machine, you can keep the endpoint at `localhost` (default). Otherwise, if you are hosting Horus via Docker on a VPS (e.g. Digital Ocean or AWS), replace it with the IP address or domain name.
