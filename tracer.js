const dotenv = require("dotenv");
dotenv.config();
const { NodeSDK } = require("@opentelemetry/sdk-node");
const {
  getNodeAutoInstrumentations,
} = require("@opentelemetry/auto-instrumentations-node");
const {
  OTLPTraceExporter,
} = require("@opentelemetry/exporter-trace-otlp-proto");
const {
  SEMRESATTRS_SERVICE_NAME,
} = require("@opentelemetry/semantic-conventions");
const { PrometheusExporter } = require("@opentelemetry/exporter-prometheus");
const { MeterProvider } = require("@opentelemetry/sdk-metrics");
const { Resource } = require("@opentelemetry/resources");

const start = (serviceName) => {
  const { endpoint, port } = PrometheusExporter.DEFAULT_OPTIONS;
  const exporter = new PrometheusExporter({}, () => {
    console.log(
      `prometheus scrape endpoint: http://localhost:${port}${endpoint}`
    );
  });
  const meterProvider = new MeterProvider({
    resource: new Resource({
      [SEMRESATTRS_SERVICE_NAME]: serviceName,
    }),
    readers: [exporter],
  });
  const meter = meterProvider.getMeter(process.env.PROMETHEUS_SERVICE_NAME);
  const traceExporter = new OTLPTraceExporter({
    url: process.env.JAEGER_SEND_TRACES_URL,
  });

  const sdk = new NodeSDK({
    traceExporter,
    serviceName: serviceName,
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": {
          enabled: false,
        },
      }),
    ],
  });

  sdk.start();
  return meter;
};

module.exports = start;
