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
platformSelect.add(new Option("E-Sports", "E-Sports"));

yearSelect.value = years[0];
platformSelect.value = platforms[0];


// Preview first 6 rows
dataPreview.textContent = JSON.stringify(chartData.slice(0, 6), null, 2);

// --- Main render ---
renderBtn.addEventListener("click", () => {
  const chartType = chartTypeSelect.value;
  const year = Number(yearSelect.value);
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
  if (type === "line") return lineOverTime(platform, ["unitsM", "revenueUSD"]);
  if (type === "scatter") return scatterTripsVsTemp(platform);
  if (type === "doughnut") return doughnutMemberVsCasual(year, platform);
  if (type === "radar") return radarComparePlatformss(year);
  return barByPlatforms(year, metric);
}

function getRowsForPlatform(platform) {
  if (platform === "E-Sports") return chartData.filter(r => !!r.esports);
  return chartData.filter(r => r.platform === platform);
}

// Task A: BAR — compare Platformss for a given year
function barByPlatforms(year, metric) {
  const rows = chartData.filter(r => r.year === year);

  const platformSums = rows.reduce((acc, r) => {
    const p = r.platform;
    const val = r[metric];
    acc[p] = (acc[p] || 0) + val;
    if (r.esports) {
      acc['E-Sports'] = (acc['E-Sports'] || 0) + val;
    }
    return acc;
  }, {});

  const labels = Object.keys(platformSums);
  const values = labels.map(l => platformSums[l]);

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
  const rows = getRowsForPlatform(platform);

  const byYear = rows.reduce((acc, r) => {
    const y = r.year;
    acc[y] = acc[y] || { year: y };
    metrics.forEach(m => {
      acc[y][m] = (acc[y][m] || 0) +  r[m];
    });
    return acc;
  }, {});

  const labels = Object.keys(byYear).map(k => Number(k)).sort((a,b) => a-b);

  const datasets = metrics.map(m => ({
    label: m,
    data: labels.map(y => byYear[y][m] || 0)
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
  const rows = getRowsForPlatform(platform);

  const points = rows.map(r => ({ x: typeof r.unitsM === 'number' ? r.unitsM : 0, y: typeof r.revenueUSD === 'number' ? r.revenueUSD : 0 }));

  return {
    type: "scatter",
    data: {
      datasets: [{
        label: `Units vs Revenue (${platform})`,
        data: points
      }]
    },
    options: {
      plugins: {
        title: { display: true, text: `Units (M) vs Revenue (USD): ${platform}` }
      },
      scales: {
        x: { title: { display: true, text: "Units (M)" } },
        y: { title: { display: true, text: "Revenue (USD)" } }
      }
    }
  };
}

// DOUGHNUT — member vs casual share for one platform + year
function doughnutMemberVsCasual(year, platform) {
  const rows = getRowsForPlatform(platform).filter(r => r.year === year);

  const regionSums = rows.reduce((acc, r) => {
    const region = r.region;
    const rev = r.revenueUSD;
    acc[region] = (acc[region] || 0) + rev;
    return acc;
  }, {});

  const labels = Object.keys(regionSums);
  const data = labels.map(l => regionSums[l]);

  return {
    type: "doughnut",
    data: {
      labels,
      datasets: [{ label: "Revenue (USD)", data }]
    },
    options: {
      plugins: {
        title: { display: true, text: `Revenue by region: ${platform} (${year})` }
      }
    }
  };
}

// RADAR — compare Platformss across multiple metrics for one year
function radarComparePlatformss(year) {
  const rows = chartData.filter(r => r.year === year);
  const metrics = ["unitsM", "revenueUSD", "reviewScore", "priceUSD"];
  const labels = metrics;

  const perPlatform = rows.reduce((acc, r) => {
    const p = r.platform;
    acc[p] = acc[p] || {};
    metrics.forEach(m => {
      acc[p][m] = (acc[p][m] || 0) + r[m];
    });
    return acc;
  }, {});

  const datasets = Object.keys(perPlatform).map(p => ({
    label: p,
    data: metrics.map(m => perPlatform[p][m] || 0)
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