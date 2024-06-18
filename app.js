const start = require("./tracer");
const meter = start(process.env.JAEGER_SERVICE_NAME);
const express = require("express");
const axios = require("axios");
const calls = meter.createHistogram("http-calls");

const app = express();
const port = process.env.PORT || 3000;

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

app.get("/", (req, res) => {
  res.send("Hello Jaeger!");
});

app.get("/api/user/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const response = await axios.get(
      `https://jsonplaceholder.typicode.com/users/${userId}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

app.post("/api/user", async (req, res) => {
  try {
    const response = await axios.post(
      "https://jsonplaceholder.typicode.com/users",
      req.body
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
