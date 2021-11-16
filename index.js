const { OTLPTraceExporter } =  require('@opentelemetry/exporter-otlp-http');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { MeterProvider } = require('@opentelemetry/metrics');
const { OTLPMetricExporter } =  require('@opentelemetry/exporter-otlp-http');
const opentelemetry = require("@opentelemetry/sdk-node");
const config = require("./config.json")
let responseTime = require('response-time')
responseTime = responseTime()

const initializeTracing = (serviceName) => {
  const collectorOptions = {
    url: `${config.endpoint}/v1/traces`,
    serviceName,
  };

  const sdk = new opentelemetry.NodeSDK({
    traceExporter: new OTLPTraceExporter(collectorOptions),
    instrumentations: [getNodeAutoInstrumentations()]
  });

  sdk.start().then(() => console.log("Tracing initialized successfully."))
}

const initializeMetrics = () => {
  const collectorOptions = {
     url: `${config.endpoint}/v1/metrics`, 
  };

  const meter = new MeterProvider({
    exporter: new OTLPMetricExporter(collectorOptions),
    interval: 10000,
  }).getMeter('RC-meter');

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

const { countRequests, countErrors, startLatency, endLatency } = initializeMetrics()

module.exports = { countRequests, countErrors, startLatency, endLatency, Tracing: initializeTracing };