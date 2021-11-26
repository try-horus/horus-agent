const { OTLPTraceExporter } =  require('@opentelemetry/exporter-otlp-http');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { MeterProvider } = require('@opentelemetry/metrics');
const { OTLPMetricExporter } =  require('@opentelemetry/exporter-otlp-http');
const { BatchSpanProcessor} = require('@opentelemetry/sdk-trace-base')
const { MongooseInstrumentation } = require('opentelemetry-instrumentation-mongoose');

const opentelemetry = require("@opentelemetry/sdk-node");
const config = require("./config.json")
let responseTime = require('response-time')
responseTime = responseTime()

const initializeTracing = (serviceName) => {
  const collectorOptions = {
    url: `${config.endpoint}:3002/v1/traces`,
    serviceName,
  };

  const exporter = new OTLPTraceExporter(collectorOptions)

  const sdk = new opentelemetry.NodeSDK({
    traceExporter: exporter,
    instrumentations: [getNodeAutoInstrumentations(), new MongooseInstrumentation()],
    spanProcessor: new BatchSpanProcessor(exporter, {
      maxQueueSize: 12000,
      maxExportBatchSize: 10000,
      scheduledDelayMillis: 10000,
      exportTimeoutMillis: 30000,
    })
  });

  sdk.start().then(() => console.log("Tracing initialized successfully."))
}

const initializeMetrics = () => {
  const collectorOptions = {
     url: `${config.endpoint}:3002/v1/metrics`, 
  };

  const meter = new MeterProvider({
    exporter: new OTLPMetricExporter(collectorOptions),
    interval: 10000,
  }).getMeter('Horus-meter');

  const requestCounter = meter.createCounter("request_count", {
    description: "Count all incoming requests"
  });

  const errorCounter = meter.createCounter("error_count", {
    description: "Count of total errors"
  })

  errorCounter.add(0)

  const requestLatency = meter.createValueRecorder("request_latency", {
    description: "Record latency for incoming requests",
    boundaries: [500, 1500], 
  })

  function countRequests(req, res, next) {
    requestCounter.add(1);
    next();
  };

  function countErrors(error, req, res, next) {
    errorCounter.add(1)
    next();
  }

  const startLatency = (() => {
    return responseTime
  })()

  function endLatency(req, res, next) {
    const labels = { route: req.path };    
    if (!res._header) return;

    const latency = parseFloat(res._header.split('\r\n')
                       .find(str => str.includes("X-Response-Time"))
                       .split(": ")[1]
                       .split("m")[0])
    requestLatency.record(latency, labels)
    next()
  }
  
  console.log("Metrics initialized successfully")
  return { countRequests, countErrors, startLatency, endLatency }
}

module.exports = { MetricsAgent: initializeMetrics(), TracingAgent: initializeTracing };
