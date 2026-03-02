// change this to reference the dataset you chose to work with.
import { gameSales as chartData } from "./data/gameSales.js";

// --- DOM helpers ---
const yearSelect = document.getElementById("yearSelect");
const platformSelect = document.getElementById("platformSelect");
const metricSelect = document.getElementById("metricSelect");
const chartTypeSelect = document.getElementById("chartType");
const renderBtn = document.getElementById("renderBtn");
const dataPreview = document.getElementById("dataPreview");
const canvas = document.getElementById("chartCanvas");

let currentChart = null;

// --- Populate dropdowns from data ---
const years = [...new Set(chartData.map(r => r.year))];
const platforms = [...new Set(chartData.map(r => r.platform))];

years.forEach(m => yearSelect.add(new Option(m, m)));
platforms.forEach(h => platformSelect.add(new Option(h, h)));

yearSelect.value = years[0];
platformSelect.value = platforms[0];

// Preview first 6 rows
dataPreview.textContent = JSON.stringify(chartData.slice(0, 6), null, 2);

// --- Main render ---
renderBtn.addEventListener("click", () => {
  const chartType = chartTypeSelect.value;
  const year = yearSelect.value;
  const platform = platformSelect.value;
  const metric = metricSelect.value;

  // Destroy old chart if it exists (common Chart.js gotcha)
  if (currentChart) currentChart.destroy();

  // Build chart config based on type
  const config = buildConfig(chartType, { year, platform, metric });

  currentChart = new Chart(canvas, config);
});

// --- Students: you’ll edit / extend these functions ---
function buildConfig(type, { year, platform, metric }) {
  if (type === "bar") return barByPlatforms(year, metric);
  if (type === "line") return lineOverTime(platform, ["trips", "revenueUSD"]);
  if (type === "scatter") return scatterTripsVsTemp(platform);
  if (type === "doughnut") return doughnutMemberVsCasual(year, platform);
  if (type === "radar") return radarComparePlatformss(year);
  return barByPlatforms(year, metric);
}

// Task A: BAR — compare Platformss for a given year
function barByPlatforms(year, metric) {
  const rows = chartData.filter(r => r.year === year);

  const labels = rows.map(r => r.platform);
  const values = rows.map(r => r[metric]);

  return {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: `${metric} in ${year}`,
        data: values
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: `Platform comparison (${year})` }
      },
      scales: {
        y: { title: { display: true, text: metric } },
        x: { title: { display: true, text: "Platforms" } }
      }
    }
  };
}

// Task B: LINE — trend over time for one Platforms (2 datasets)
function lineOverTime(platform, metrics) {
  const rows = chartData.filter(r => r.platform === platform);
  
  const labels = rows.map(r => r.year);

  const datasets = metrics.map(m => ({
    label: m,
    data: rows.map(r => r[m])
  }));

  return {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: `Trends over time: ${platform}` }
      },
      scales: {
        y: { title: { display: true, text: "Value" } },
        x: { title: { display: true, text: "year" } }
      }
    }
  };
}

// SCATTER — relationship between temperature and trips
function scatterTripsVsTemp(platform) {
  const rows = chartData.filter(r => r.platform === platform);

  const points = rows.map(r => ({ x: r.tempC, y: r.trips }));

  return {
    type: "scatter",
    data: {
      datasets: [{
        label: `Trips vs Temp (${platform})`,
        data: points
      }]
    },
    options: {
      plugins: {
        title: { display: true, text: `Does temperature affect trips? (${platform})` }
      },
      scales: {
        x: { title: { display: true, text: "Temperature (C)" } },
        y: { title: { display: true, text: "Trips" } }
      }
    }
  };
}

// DOUGHNUT — member vs casual share for one platform + year
function doughnutMemberVsCasual(year, platform) {
  const row = chartData.find(r => r.year === year && r.platform === platform);

  const member = Math.round(row.memberShare * 100);
  const casual = 100 - member;

  return {
    type: "doughnut",
    data: {
      labels: ["Members (%)", "Casual (%)"],
      datasets: [{ label: "Rider mix", data: [member, casual] }]
    },
    options: {
      plugins: {
        title: { display: true, text: `Rider mix: ${platform} (${year})` }
      }
    }
  };
}

// RADAR — compare Platformss across multiple metrics for one year
function radarComparePlatformss(year) {
  const rows = chartData.filter(r => r.year === year);

  const metrics = ["trips", "revenueUSD", "avgDurationMin", "incidents"];
  const labels = metrics;

  const datasets = rows.map(r => ({
    label: r.platform,
    data: metrics.map(m => r[m])
  }));

  return {
    type: "radar",
    data: { labels, datasets },
    options: {
      plugins: {
        title: { display: true, text: `Multi-metric comparison (${year})` }
      }
    }
  };
}