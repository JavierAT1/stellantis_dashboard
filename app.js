const palette = {
  primary: "#223D8F",
  dark: "#102C6B",
  veryDark: "#071C4D",
  success: "#1FA971",
  warning: "#F3B63F",
  danger: "#D64545",
  grid: "#DDE3EE",
  text: "#1C1C1C",
  secondary: "#707070"
};

const recentVehicles = [
  ["3C6UR5FL5RG123456", "RAM 2500", "DJ", "P20EE", "Roll Test", "High", "Active", "18 km"],
  ["3C6UR5GL8RG123489", "RAM 3500", "DD", "P0101", "ADAS", "Medium", "Active", "14 km"],
  ["3C6UR5FL1RG123502", "RAM 2500", "DJ", "P2002", "Final Configuration", "High", "Resolved", "21 km"],
  ["3C7WRMBL9RG123527", "RAM 3500", "D2", "U0100", "Receiving", "Medium", "Historical", "9 km"],
  ["3C6UR5JL6RG123544", "RAM 2500", "DJ", "C0035", "Dynamic Road Test", "Low", "Verified", "26 km"],
  ["3C6UR5KL2RG123581", "RAM 3500", "DD", "P20EE", "Roll Test", "High", "Active", "17 km"],
  ["3C6UR5HL7RG123609", "RAM 2500", "DJ", "P0101", "Final Configuration", "Medium", "Resolved", "12 km"]
];

function updateClock() {
  const now = new Date();
  document.getElementById("currentTime").textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  document.getElementById("currentDate").textContent = now.toLocaleDateString([], { year: "numeric", month: "short", day: "2-digit" });
}

function drawSparkline(canvas) {
  const values = canvas.dataset.values.split(",").map(Number);
  const context = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  context.scale(ratio, ratio);
  const padding = 3;
  const width = rect.width - padding * 2;
  const height = rect.height - padding * 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  context.clearRect(0, 0, rect.width, rect.height);
  context.beginPath();
  values.forEach((value, index) => {
    const x = padding + (index / (values.length - 1)) * width;
    const y = padding + height - ((value - min) / range) * height;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.lineWidth = 2.2;
  context.strokeStyle = palette.primary;
  context.stroke();
  const lastX = padding + width;
  const lastY = padding + height - ((values.at(-1) - min) / range) * height;
  context.beginPath();
  context.arc(lastX, lastY, 3.5, 0, Math.PI * 2);
  context.fillStyle = palette.success;
  context.fill();
}

function populateTable() {
  const table = document.getElementById("vehicleTable");
  table.innerHTML = recentVehicles.map((row) => {
    const severity = row[5].toLowerCase();
    const status = row[6].toLowerCase();
    return `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td><td>${row[3]}</td><td>${row[4]}</td><td><span class="badge ${severity}">${row[5]}</span></td><td><span class="badge ${status}">${row[6]}</span></td><td>${row[7]}</td></tr>`;
  }).join("");
}

function chartDefaults() {
  Chart.defaults.font.family = "Inter, Segoe UI, Arial, sans-serif";
  Chart.defaults.color = palette.secondary;
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.boxWidth = 8;
  Chart.defaults.plugins.tooltip.backgroundColor = "#071C4D";
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
  Chart.defaults.plugins.tooltip.padding = 12;
  Chart.defaults.plugins.tooltip.titleColor = "#FFFFFF";
  Chart.defaults.plugins.tooltip.bodyColor = "#FFFFFF";
}

function prepareCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  const frame = canvas.closest(".chart-frame") || canvas;
  const rect = frame.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(rect.width, 1);
  const height = Math.max(rect.height, 1);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, width, height };
}

function drawFallbackBar(canvas, labels, values, horizontal = false) {
  const { ctx, width, height } = prepareCanvas(canvas);
  const max = Math.max(...values);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = palette.secondary;
  ctx.font = "600 12px Inter, Segoe UI, Arial";
  ctx.strokeStyle = palette.grid;
  ctx.lineWidth = 1;
  if (horizontal) {
    const left = 74;
    const row = (height - 24) / values.length;
    labels.forEach((label, index) => {
      const y = 15 + index * row;
      const barWidth = ((width - left - 18) * values[index]) / max;
      ctx.fillStyle = palette.text;
      ctx.fillText(label, 8, y + 16);
      ctx.fillStyle = [palette.danger, palette.primary, palette.dark, palette.warning, palette.success][index];
      roundRect(ctx, left, y, barWidth, 22, 7);
      ctx.fill();
      ctx.fillStyle = palette.secondary;
      ctx.fillText(values[index], left + barWidth + 6, y + 16);
    });
  } else {
    const bottom = height - 46;
    const top = 14;
    const slot = (width - 28) / values.length;
    labels.forEach((label, index) => {
      const barHeight = ((bottom - top) * values[index]) / max;
      const x = 16 + index * slot + slot * 0.2;
      const y = bottom - barHeight;
      ctx.fillStyle = palette.primary;
      roundRect(ctx, x, y, slot * 0.58, barHeight, 7);
      ctx.fill();
      ctx.fillStyle = palette.secondary;
      ctx.textAlign = "center";
      ctx.fillText(label.split(" ")[0], x + slot * 0.29, bottom + 18);
      ctx.fillText(values[index], x + slot * 0.29, y - 6);
      ctx.textAlign = "left";
    });
  }
}

function drawFallbackDoughnut(canvas, labels, values) {
  const { ctx, width, height } = prepareCanvas(canvas);
  const total = values.reduce((sum, value) => sum + value, 0);
  const cx = width / 2;
  const cy = height / 2 - 8;
  const radius = Math.min(width, height) * 0.31;
  let start = -Math.PI / 2;
  ctx.clearRect(0, 0, width, height);
  values.forEach((value, index) => {
    const angle = (value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, start, start + angle);
    ctx.lineWidth = 30;
    ctx.strokeStyle = [palette.primary, palette.success, palette.warning][index];
    ctx.stroke();
    start += angle;
  });
  ctx.fillStyle = palette.secondary;
  ctx.font = "600 12px Inter, Segoe UI, Arial";
  labels.forEach((label, index) => {
    ctx.fillStyle = [palette.primary, palette.success, palette.warning][index];
    ctx.fillRect(42 + index * 72, height - 24, 10, 10);
    ctx.fillStyle = palette.secondary;
    ctx.fillText(`${label} ${values[index]}%`, 56 + index * 72, height - 15);
  });
}

function drawFallbackGauge(canvas) {
  const { ctx, width, height } = prepareCanvas(canvas);
  const cx = width / 2;
  const cy = height - 18;
  const radius = Math.min(width * 0.36, height * 0.75);
  ctx.clearRect(0, 0, width, height);
  ctx.lineWidth = 24;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, Math.PI, Math.PI * 2);
  ctx.strokeStyle = "#E8EDF5";
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, Math.PI, Math.PI * 2);
  ctx.strokeStyle = palette.success;
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = palette.veryDark;
  ctx.font = "700 22px Inter, Segoe UI, Arial";
  ctx.fillText("100%", cx, cy - 28);
  ctx.fillStyle = palette.secondary;
  ctx.font = "600 12px Inter, Segoe UI, Arial";
  ctx.fillText("Recovered Successfully", cx, cy - 6);
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function makeCanvasFallbackCharts() {
  drawFallbackGauge(document.getElementById("qrGauge"));
  drawFallbackBar(document.getElementById("dtcChart"), ["P20EE", "P0101", "P2002", "U0100", "C0035"], [18, 13, 9, 7, 5], true);
  drawFallbackDoughnut(document.getElementById("programChart"), ["DJ", "DD", "D2"], [62, 27, 11]);
  drawFallbackBar(document.getElementById("stageChart"), ["Receiving", "Final Configuration", "ADAS", "Roll Test", "Dynamic Road Test"], [4, 9, 7, 18, 5]);
}
function makeCharts() {
  if (!window.Chart) {
    makeCanvasFallbackCharts();
    return;
  }
  chartDefaults();
  new Chart(document.getElementById("dtcChart"), {
    type: "bar",
    data: { labels: ["P20EE", "P0101", "P2002", "U0100", "C0035"], datasets: [{ label: "Occurrences", data: [18, 13, 9, 7, 5], borderRadius: 8, backgroundColor: [palette.danger, palette.primary, palette.dark, palette.warning, palette.success], barThickness: 24 }] },
    options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, animation: { duration: 900, easing: "easeOutQuart" }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (item) => `${item.raw} vehicles flagged` } } }, scales: { x: { beginAtZero: true, grid: { color: palette.grid }, border: { display: false }, ticks: { precision: 0 } }, y: { grid: { display: false }, border: { display: false }, ticks: { color: palette.text, font: { weight: 700 } } } } }
  });
  new Chart(document.getElementById("programChart"), {
    type: "doughnut",
    data: { labels: ["DJ", "DD", "D2"], datasets: [{ data: [62, 27, 11], backgroundColor: [palette.primary, palette.success, palette.warning], borderColor: "#FFFFFF", borderWidth: 4, hoverOffset: 6 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: "68%", animation: { duration: 900, easing: "easeOutQuart" }, plugins: { legend: { position: "bottom" }, tooltip: { callbacks: { label: (item) => `${item.label}: ${item.raw}% of scanned vehicles` } } } }
  });
  new Chart(document.getElementById("stageChart"), {
    type: "bar",
    data: { labels: ["Receiving", "Final Configuration", "ADAS", "Roll Test", "Dynamic Road Test"], datasets: [{ label: "DTCs detected", data: [4, 9, 7, 18, 5], backgroundColor: palette.primary, borderRadius: 8, barThickness: 28 }] },
    options: { responsive: true, maintainAspectRatio: false, animation: { duration: 900, easing: "easeOutQuart" }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (item) => `${item.raw} DTCs detected` } } }, scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: palette.text, maxRotation: 0, autoSkip: false } }, y: { beginAtZero: true, grid: { color: palette.grid }, border: { display: false }, ticks: { precision: 0 } } } }
  });
  new Chart(document.getElementById("qrGauge"), {
    type: "doughnut",
    data: { labels: ["Recovered", "Remaining"], datasets: [{ data: [100, 0], backgroundColor: [palette.success, "#E8EDF5"], borderWidth: 0, circumference: 180, rotation: 270, cutout: "74%" }] },
    options: { responsive: true, maintainAspectRatio: false, animation: { duration: 850, easing: "easeOutQuart" }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: () => "100% recovered successfully" } } } },
    plugins: [{ id: "gaugeCenter", afterDraw(chart) { const { ctx, chartArea } = chart; const x = (chartArea.left + chartArea.right) / 2; const y = chartArea.bottom - 8; ctx.save(); ctx.textAlign = "center"; ctx.fillStyle = palette.veryDark; ctx.font = "700 22px Inter, Segoe UI, Arial"; ctx.fillText("100%", x, y - 14); ctx.fillStyle = palette.secondary; ctx.font = "600 12px Inter, Segoe UI, Arial"; ctx.fillText("Recovered Successfully", x, y + 8); ctx.restore(); } }]
  });
}

function resizeSparklines() { document.querySelectorAll(".sparkline").forEach(drawSparkline); }
function resizeFallbackCharts() { if (!window.Chart) makeCanvasFallbackCharts(); }

document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) lucide.createIcons();
  updateClock();
  setInterval(updateClock, 1000);
  populateTable();
  resizeSparklines();
  makeCharts();
});
window.addEventListener("resize", () => window.requestAnimationFrame(() => { resizeSparklines(); resizeFallbackCharts(); }));



