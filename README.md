# Observability using nodejs,jaeger and prometheus

## Running Jaeger Without Docker on Windows

This guide will help you download and set up Jaeger locally on your Windows machine without using Docker.

## Prerequisites

- **Java Development Kit (JDK)**: Ensure JDK is installed on your Windows machine.
- **Apache Maven**: Required for building Jaeger from source (optional if downloading binaries).

## Steps

### 1. Download Jaeger Binary

- Visit the Jaeger releases page on GitHub: [Jaeger Releases](https://github.com/jaegertracing/jaeger/releases).
- Download the latest release binary for Windows, typically the `jaeger-{version}-windows-amd64.zip` file.
- Unzip the downloaded file to a directory of your choice, for example, `C:\jaeger`.

### 2. Set Environment Variables

- Add Jaeger binaries directory (`C:\jaeger`) to your system's PATH environment variable. This allows you to run Jaeger commands from any command prompt.

  Example for adding to PATH on Windows:

  - Right-click on **This PC** or **My Computer**, then click **Properties**.
  - Click on **Advanced system settings** on the left.
  - In the **System Properties** window, click on **Environment Variables...**.
  - In the **System Variables** section, select **Path**, then click **Edit**.
  - Click **New**, and add `C:\jaeger` as a new entry.
  - Click **OK** on all open windows to save the changes.

### 3. Start Jaeger All-In-One

- Open a command prompt (`cmd`) or PowerShell.

- Navigate to the directory where Jaeger binaries are extracted (e.g., `C:\jaeger`).

- Run the following command to start Jaeger All-In-One:

  ```bash
  jaeger-all-in-one.exe
  ```

  This command starts the Jaeger All-In-One executable, which includes all necessary components (collector, query, agent) in a single process.

### 4. Access Jaeger UI

- Once Jaeger All-In-One is running, open your web browser and go to [http://localhost:16686](http://localhost:16686) to access the Jaeger UI.

### 5. Explore Traces

- In the Jaeger UI ([http://localhost:16686](http://localhost:16686)), you can explore traces by searching for services or operations and viewing detailed trace information.

---

## Running Prometheus on Windows

Prometheus is a monitoring and alerting toolkit widely used in cloud-native environments. Follow these steps to set up Prometheus locally on your Windows machine as a standalone binary.

## Prerequisites

- **Download Prometheus**: Download the latest release of Prometheus from the official website: [Prometheus Downloads](https://prometheus.io/download/).

## Steps

### 1. Download Prometheus

- Download the Prometheus zip file suitable for Windows from the [Prometheus downloads page](https://prometheus.io/download/).

### 2. Extract Prometheus

- Extract the downloaded zip file to a directory of your choice. For example, extract it to `C:\prometheus`.

### 3. Configure Prometheus

- Inside the extracted directory (`C:\prometheus`), locate the `prometheus.yml` configuration file. This file defines the scraping targets for Prometheus.

  Example `prometheus.yml` configuration to scrape metrics from a local Node.js application:

  ```yaml
  global:
    scrape_interval: 15s

  scrape_configs:
    - job_name: "nodejs-app"
      static_configs:
        - targets: ["localhost:3000"] # Replace with your Node.js application's address
  ```

### 4. Run Prometheus

- Open a command prompt (`cmd`) or PowerShell and navigate to the Prometheus directory (`C:\prometheus`).

- Run Prometheus using the following command:

  ```bash
  prometheus.exe --config.file=prometheus.yml
  ```

  This command starts Prometheus with the configuration provided in `prometheus.yml`. It will start scraping metrics from the specified target (e.g., a local Node.js application running on `localhost:3000`).

### 5. Access Prometheus UI

- Once Prometheus is running, open your web browser and go to [http://localhost:9090](http://localhost:9090). This is the default address for the Prometheus web UI.

### 6. Explore Metrics

- In the Prometheus UI ([http://localhost:9090](http://localhost:9090)), you can explore metrics, execute queries using PromQL, and monitor targets configured in `prometheus.yml`.

---
