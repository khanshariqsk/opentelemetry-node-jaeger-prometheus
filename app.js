const start = require("./tracer");
const { meter, tracer } = start(process.env.JAEGER_SERVICE_NAME);
const express = require("express");
const calls = meter.createHistogram("http-calls");
const { context, trace } = require("@opentelemetry/api");
const app = express();
const port = process.env.PORT || 3000;

const traceMiddleware = (req, res, next) => {
  const span = trace.getActiveSpan();

  // span.updateName(req.method + " " + req.path);  //can be used in future

  // Set tags for the span
  span.setAttribute("http.method", req.method);
  span.setAttribute("http.url", req.originalUrl);

  // Set the current span to the request context
  context.with(trace.setSpan(context.active(), span), () => {
    res.on("finish", () => {
      span.end();
    });

    // Add the span to the request object to be used in route handlers
    req.span = span;

    next();
  });
};

// Apply the traceMiddleware to all routes
app.use(traceMiddleware);

app.use((req, res, next) => {
  const startTime = Date.now();
  req.on("end", () => {
    const endTime = Date.now();
    calls.record(endTime - startTime, {
      route: req.route?.path,
      status: res.statusCode,
      method: req.method,
    });
  });
  next();
});

const tracedFunction = async (req, fn, ...args) => {
  const span = tracer.startSpan(fn.name, { childOf: req.span });

  try {
    await fn(req, span, ...args);
  } catch (error) {
    console.error(`Error in ${fn.name}:`, error);
    span.setAttribute("error", true);
    span.addEvent("error", { error: error.message });
    throw error;
  } finally {
    span.end();
  }
};

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const functionA = async (req, span, arg1, arg2) => {
  await sleep(300);
  console.log("Function A executed with arguments:", arg1, arg2);
};

const functionB = async (req, span, arg1) => {
  await sleep(500);
  console.log("Function B executed with argument:", arg1);
};

const functionC = async (req, span) => {
  await sleep(700);
  console.log("Function C executed");
};

const functionD = async (req, span, arg1, arg2, arg3) => {
  await sleep(200);
  console.log("Function D executed with arguments:", arg1, arg2, arg3);
};

const functionE = async (req, span) => {
  await sleep(400);
  console.log("Function E executed");
};

app.get("/test", async (req, res) => {
  try {
    await tracedFunction(req, functionA, "arg1A", "arg2A");
    await tracedFunction(req, functionB, "arg1B");
    await tracedFunction(req, functionC);
    await tracedFunction(req, functionD, "arg1D", "arg2D", "arg3D");
    await tracedFunction(req, functionE);

    res.send("Functions executed successfully!");
  } catch (error) {
    console.error("Error processing functions:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/", (req, res) => {
  res.send("Hello Jaeger!");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
