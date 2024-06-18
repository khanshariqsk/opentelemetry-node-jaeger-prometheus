const dotenv = require("dotenv");
dotenv.config();
const os = require("os");
const fs = require("fs");
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
  sendServerUsageToPrometheus(meter);
  return meter;
};

const sendServerUsageToPrometheus = (meter) => {
  const cpu = meter.createCounter("cpu_usage");
  const memory = meter.createCounter("memory_usage");
  const disk = meter.createCounter("disk_usage");

  // Periodically record metrics
  let metricInterval = setInterval(async () => {
    try {
      const cpuUsage = await getCPUUsage();
      const memoryUsage = await getMemoryUsage();
      const diskUsage = await getDiskUsage();

      cpu.add(cpuUsage, { description: "CPU usage" });
      memory.add(memoryUsage, { description: "Memory usage" });
      disk.add(diskUsage, { description: "Disk usage" });

      console.log("Metrics recorded:", { cpuUsage, memoryUsage, diskUsage });
    } catch (error) {
      console.error("Error recording metrics:", error);
    }
  }, 10000);

  // Function to get CPU usage
  async function getCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0,
      totalTick = 0;
    for (let i = 0; i < cpus.length; i++) {
      const cpu = cpus[i];
      for (type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }
    const cpuUsage = 100 - (totalIdle / totalTick) * 100;
    return cpuUsage;
  }

  // Function to get memory usage
  async function getMemoryUsage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;
    return memoryUsage;
  }

  // Function to get disk usage
  async function getDiskUsage() {
    const stats = fs.statSync("/");
    const diskUsage = (stats.size / stats.blksize) * 100;
    return diskUsage;
  }

  // Handle shutdown events
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  function stopMetricInterval() {
    clearInterval(metricInterval);
  }

  async function shutdown() {
    console.log("Shutting down...");

    // Stop the metric interval
    stopMetricInterval();

    // Exit the process
    process.exit(0);
  }
};

module.exports = start;
