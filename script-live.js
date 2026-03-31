const STOCK_DATA = {
  TCS: {
    symbol: "TCS",
    apiSymbol: "TCS.NSE",
    name: "Tata Consultancy Services",
    sector: "Information Technology",
    description:
      "TCS is a leading Indian IT services and consulting company that provides software, cloud, analytics, and business solutions to clients around the world.",
    currentPrice: 4128.4,
    recentPrices: [3984.1, 4020.35, 4068.2, 4099.55, 4128.4]
  },
  RELIANCE: {
    symbol: "RELIANCE",
    apiSymbol: "RELIANCE.BSE",
    name: "Reliance Industries Limited",
    sector: "Conglomerate / Energy / Retail / Telecom",
    description:
      "Reliance Industries is one of India's biggest businesses, with operations in energy, petrochemicals, retail, digital services, and telecommunications.",
    currentPrice: 2962.75,
    recentPrices: [3015.2, 2998.1, 2982.5, 2973.8, 2962.75]
  },
  INFY: {
    symbol: "INFY",
    apiSymbol: "INFY",
    name: "Infosys Limited",
    sector: "Information Technology",
    description:
      "Infosys is an Indian multinational technology company known for IT consulting, software development, digital transformation, and outsourcing services.",
    currentPrice: 1518.2,
    recentPrices: [1515.2, 1517.4, 1516.9, 1518.1, 1518.2]
  }
};

const FINANCIAL_TERMS = [
  {
    term: "Stock",
    definition: "A stock represents ownership in a company. When you buy stock, you own a small part of that business."
  },
  {
    term: "Share",
    definition: "A share is one unit of stock. If a company is divided into many parts, each part is called a share."
  },
  {
    term: "Investment",
    definition: "An investment is money placed into something with the hope that it will grow in value over time."
  },
  {
    term: "Profit",
    definition: "Profit is the gain made when you sell something for more than what it cost you to buy."
  },
  {
    term: "Risk",
    definition: "Risk means the chance of losing money or not getting the result you expected from an investment."
  },
  {
    term: "Dividend",
    definition: "A dividend is a portion of a company's earnings paid to shareholders as a reward for owning the stock."
  }
];

const API_CONFIG = {
  apiKey: "demo",
  baseUrl: "https://www.alphavantage.co/query",
  autoRefreshMs: 1000
};

const elements = {
  heroSymbol: document.getElementById("hero-symbol"),
  stockSelect: document.getElementById("stock-select"),
  themeToggle: document.getElementById("theme-toggle"),
  statusPill: document.getElementById("status-pill"),
  companyName: document.getElementById("company-name"),
  stockPrice: document.getElementById("stock-price"),
  stockSector: document.getElementById("stock-sector"),
  companyDescription: document.getElementById("company-description"),
  sourceNote: document.getElementById("source-note"),
  updatedNote: document.getElementById("updated-note"),
  trendCard: document.getElementById("trend-card"),
  trendIcon: document.getElementById("trend-icon"),
  trendLabel: document.getElementById("trend-label"),
  trendReason: document.getElementById("trend-reason"),
  miniChart: document.getElementById("mini-chart"),
  chartArea: document.getElementById("chart-area"),
  chartLine: document.getElementById("chart-line"),
  chartGrid: document.getElementById("chart-grid"),
  chartPoints: document.getElementById("chart-points"),
  priceStrip: document.getElementById("price-strip"),
  literacyGrid: document.getElementById("literacy-grid")
};

let autoRefreshTimer = null;
let fallbackTick = 0;
let currentTheme = "dark";

function renderFinancialTerms() {
  elements.literacyGrid.innerHTML = FINANCIAL_TERMS.map(
    ({ term, definition }) => `
      <article class="literacy-card">
        <h3>${term}</h3>
        <p>${definition}</p>
      </article>
    `
  ).join("");
}

function applyTheme(theme) {
  currentTheme = theme;
  document.body.classList.toggle("light-theme", theme === "light");
  elements.themeToggle.textContent = theme === "light" ? "Switch To Dark Mode" : "Switch To Light Mode";
  try {
    localStorage.setItem("stock-sense-theme", theme);
  } catch (error) {
    console.warn("Unable to store theme preference:", error);
  }
}

function initializeTheme() {
  let savedTheme = "dark";

  try {
    savedTheme = localStorage.getItem("stock-sense-theme") || "dark";
  } catch (error) {
    console.warn("Unable to read theme preference:", error);
  }

  applyTheme(savedTheme === "light" ? "light" : "dark");
}

function classifyTrend(recentPrices) {
  if (!Array.isArray(recentPrices) || recentPrices.length < 2) {
    return {
      trend: "stable",
      icon: "~",
      label: "Stable Trend",
      reason: "There is not enough recent price data, so the stock is treated as stable."
    };
  }

  const firstPrice = recentPrices[0];
  const lastPrice = recentPrices[recentPrices.length - 1];
  const percentageChange = ((lastPrice - firstPrice) / firstPrice) * 100;

  if (percentageChange > 1) {
    return {
      trend: "upward",
      icon: "^",
      label: "Upward Trend",
      reason: `The stock moved up by ${percentageChange.toFixed(2)}% across the recent price points.`
    };
  }

  if (percentageChange < -1) {
    return {
      trend: "downward",
      icon: "v",
      label: "Downward Trend",
      reason: `The stock moved down by ${Math.abs(percentageChange).toFixed(2)}% across the recent price points.`
    };
  }

  return {
    trend: "stable",
    icon: "~",
    label: "Stable Trend",
    reason: `The recent movement is only ${percentageChange.toFixed(2)}%, so the stock appears fairly steady.`
  };
}

function formatCurrency(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "--";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(value);
}

function formatUpdatedTime(date = new Date()) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function setStatus(type, message) {
  elements.statusPill.classList.remove("status-live", "status-loading", "status-fallback");
  elements.statusPill.classList.add(`status-${type}`);
  elements.statusPill.textContent = message;
}

function renderPriceStrip(prices) {
  const recentDisplayPrices = prices.slice(-5);

  elements.priceStrip.innerHTML = recentDisplayPrices
    .map(
      (price, index) => `
        <div class="price-chip">
          <span>Day ${index + 1}</span>
          <strong>${formatCurrency(price)}</strong>
        </div>
      `
    )
    .join("");
}

function renderMiniChart(prices) {
  const chartPrices = prices.slice(-5);
  const highestPrice = Math.max(...chartPrices);
  const lowestPrice = Math.min(...chartPrices);
  const range = Math.max(highestPrice - lowestPrice, 1);
  const width = 360;
  const height = 220;
  const paddingX = 26;
  const paddingTop = 24;
  const paddingBottom = 44;
  const stepX = (width - paddingX * 2) / (chartPrices.length - 1 || 1);

  const points = chartPrices.map((price, index) => {
    const x = paddingX + stepX * index;
    const scaledY = ((price - lowestPrice) / range) * (height - paddingTop - paddingBottom);
    const y = height - paddingBottom - scaledY;
    return { x, y, label: `Day ${index + 1}` };
  });

  const linePath = createSmoothPath(points);

  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${(height - paddingBottom).toFixed(2)} L ${points[0].x.toFixed(2)} ${(height - paddingBottom).toFixed(2)} Z`;

  elements.chartGrid.innerHTML = [0.25, 0.5, 0.75].map((fraction) => {
    const y = paddingTop + (height - paddingTop - paddingBottom) * fraction;
    return `<line class="chart-grid-line" x1="${paddingX}" y1="${y.toFixed(2)}" x2="${(width - paddingX).toFixed(2)}" y2="${y.toFixed(2)}"></line>`;
  }).join("");

  elements.chartLine.setAttribute("d", linePath);
  elements.chartArea.setAttribute("d", areaPath);
  elements.chartPoints.innerHTML = points
    .map(
      (point) => `
        <circle class="chart-point" cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="5"></circle>
        <text class="chart-point-label" x="${point.x.toFixed(2)}" y="${(height - 10).toFixed(2)}">${point.label}</text>
      `
    )
    .join("");
}

function createSmoothPath(points) {
  if (points.length < 2) {
    return "";
  }

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const controlX = ((current.x + next.x) / 2).toFixed(2);

    path += ` C ${controlX} ${current.y.toFixed(2)}, ${controlX} ${next.y.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
  }

  return path;
}

function renderTrend(recentPrices) {
  const trend = classifyTrend(recentPrices);

  elements.trendCard.classList.remove("trend-upward", "trend-downward", "trend-stable");
  elements.trendCard.classList.add(`trend-${trend.trend}`);
  elements.trendIcon.textContent = trend.icon;
  elements.trendLabel.textContent = trend.label;
  elements.trendReason.textContent = trend.reason;

  renderMiniChart(recentPrices);
  renderPriceStrip(recentPrices);
}

function renderStockInfo(stockData, mode = "fallback") {
  elements.heroSymbol.textContent = stockData.symbol;
  elements.companyName.textContent = stockData.name;
  elements.stockPrice.textContent = formatCurrency(stockData.currentPrice);
  elements.stockSector.textContent = stockData.sector;
  elements.companyDescription.textContent = stockData.description;
  elements.updatedNote.textContent = `Last updated: ${formatUpdatedTime()}`;

  renderTrend(stockData.recentPrices);

  if (mode === "live") {
    setStatus("live", "Live data loaded");
    elements.sourceNote.textContent =
      "Current price and recent closing prices were fetched dynamically from Alpha Vantage.";
    return;
  }

  setStatus("fallback", "Sample data shown");
  elements.sourceNote.textContent =
    "Live market data could not be loaded for this stock right now, so sample values are being shown.";
}

function buildAnimatedFallback(stockKey) {
  const base = STOCK_DATA[stockKey];
  fallbackTick += 1;

  const adjustedPrices = base.recentPrices.map((price, index) => {
    const wave = Math.sin((fallbackTick + index) / 2.2) * (price * 0.0018);
    return Number((price + wave).toFixed(2));
  });

  return {
    ...base,
    currentPrice: adjustedPrices[adjustedPrices.length - 1],
    recentPrices: adjustedPrices
  };
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

function isApiLimitPayload(payload) {
  return Boolean(payload.Note || payload.Information || payload["Error Message"]);
}

function normalizeOverview(rawOverview, fallback) {
  return {
    name: rawOverview.Name || fallback.name,
    sector: rawOverview.Sector || fallback.sector,
    description: rawOverview.Description || fallback.description
  };
}

function normalizeQuote(rawQuote, fallback) {
  const parsedPrice = Number.parseFloat(rawQuote["05. price"]);
  return Number.isFinite(parsedPrice) ? parsedPrice : fallback.currentPrice;
}

function normalizeHistory(rawHistory, fallback) {
  const timeSeries = rawHistory["Time Series (Daily)"];
  if (!timeSeries) {
    return fallback.recentPrices;
  }

  const prices = Object.values(timeSeries)
    .slice(0, 5)
    .map((entry) => Number.parseFloat(entry["4. close"]))
    .filter((value) => Number.isFinite(value))
    .reverse();

  return prices.length >= 2 ? prices : fallback.recentPrices;
}

async function fetchDynamicStockData(stockKey) {
  const fallback = STOCK_DATA[stockKey];
  const symbol = encodeURIComponent(fallback.apiSymbol);
  const quoteUrl = `${API_CONFIG.baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_CONFIG.apiKey}`;
  const overviewUrl = `${API_CONFIG.baseUrl}?function=OVERVIEW&symbol=${symbol}&apikey=${API_CONFIG.apiKey}`;
  const historyUrl = `${API_CONFIG.baseUrl}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${API_CONFIG.apiKey}`;

  const [quotePayload, overviewPayload, historyPayload] = await Promise.all([
    fetchJson(quoteUrl),
    fetchJson(overviewUrl),
    fetchJson(historyUrl)
  ]);

  if (isApiLimitPayload(quotePayload) || isApiLimitPayload(overviewPayload) || isApiLimitPayload(historyPayload)) {
    throw new Error("API limit reached or symbol unavailable");
  }

  const overview = normalizeOverview(overviewPayload, fallback);
  const currentPrice = normalizeQuote(quotePayload["Global Quote"] || {}, fallback);
  const recentPrices = normalizeHistory(historyPayload, fallback);

  return {
    symbol: fallback.symbol,
    name: overview.name,
    sector: overview.sector,
    description: overview.description,
    currentPrice,
    recentPrices
  };
}

async function loadStock(stockKey) {
  try {
    const liveData = await fetchDynamicStockData(stockKey);
    renderStockInfo(liveData, "live");
  } catch (error) {
    console.error(`Unable to load live stock data for ${stockKey}:`, error);
    renderStockInfo(buildAnimatedFallback(stockKey), "fallback");
  }
}

function startAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
  }

  autoRefreshTimer = setInterval(() => {
    loadStock(elements.stockSelect.value);
  }, API_CONFIG.autoRefreshMs);
}

function initializeApp() {
  initializeTheme();
  renderFinancialTerms();
  loadStock("TCS");
  startAutoRefresh();

  elements.stockSelect.addEventListener("change", (event) => {
    loadStock(event.target.value);
  });

  elements.themeToggle.addEventListener("click", () => {
    applyTheme(currentTheme === "dark" ? "light" : "dark");
  });
}

initializeApp();
