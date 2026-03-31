const STOCK_DATA = {
  TCS: {
    symbol: "TCS",
    name: "Tata Consultancy Services",
    sector: "Information Technology",
    description:
      "TCS is a leading Indian IT services and consulting company that provides software, cloud, analytics, and business solutions to clients around the world.",
    currentPrice: 4128.4,
    recentPrices: [3984.1, 4020.35, 4068.2, 4099.55, 4128.4]
  },
  RELIANCE: {
    symbol: "RELIANCE",
    name: "Reliance Industries Limited",
    sector: "Conglomerate / Energy / Retail / Telecom",
    description:
      "Reliance Industries is one of India’s biggest businesses, with operations in energy, petrochemicals, retail, digital services, and telecommunications.",
    currentPrice: 2962.75,
    recentPrices: [3015.2, 2998.1, 2982.5, 2973.8, 2962.75]
  },
  INFY: {
    symbol: "INFY",
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
    definition: "A dividend is a portion of a company’s earnings paid to shareholders as a reward for owning the stock."
  }
];

const elements = {
  heroSymbol: document.getElementById("hero-symbol"),
  stockSelect: document.getElementById("stock-select"),
  statusPill: document.getElementById("status-pill"),
  companyName: document.getElementById("company-name"),
  stockPrice: document.getElementById("stock-price"),
  stockSector: document.getElementById("stock-sector"),
  companyDescription: document.getElementById("company-description"),
  sourceNote: document.getElementById("source-note"),
  trendCard: document.getElementById("trend-card"),
  trendIcon: document.getElementById("trend-icon"),
  trendLabel: document.getElementById("trend-label"),
  trendReason: document.getElementById("trend-reason"),
  miniChart: document.getElementById("mini-chart"),
  priceStrip: document.getElementById("price-strip"),
  literacyGrid: document.getElementById("literacy-grid")
};

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
      icon: "↑",
      label: "Upward Trend",
      reason: `The stock moved up by ${percentageChange.toFixed(2)}% across the recent price points.`
    };
  }

  if (percentageChange < -1) {
    return {
      trend: "downward",
      icon: "↓",
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
  const highestPrice = Math.max(...prices);
  const lowestPrice = Math.min(...prices);
  const range = Math.max(highestPrice - lowestPrice, 1);

  elements.miniChart.innerHTML = prices
    .map((price, index) => {
      const height = 30 + ((price - lowestPrice) / range) * 80;
      return `
        <div class="chart-bar" style="height:${height}px">
          <span>P${index + 1}</span>
        </div>
      `;
    })
    .join("");
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

function renderStockInfo(stockData) {
  elements.heroSymbol.textContent = stockData.symbol;
  elements.companyName.textContent = stockData.name;
  elements.stockPrice.textContent = formatCurrency(stockData.currentPrice);
  elements.stockSector.textContent = stockData.sector;
  elements.companyDescription.textContent = stockData.description;

  renderTrend(stockData.recentPrices);
  elements.statusPill.classList.remove("status-live");
  elements.statusPill.classList.add("status-fallback");
  elements.statusPill.textContent = "Student project mode";
  elements.sourceNote.textContent =
    "The page uses selected business data and simple historical comparison to explain stock trends clearly.";
}

function initializeApp() {
  renderFinancialTerms();
  renderStockInfo(STOCK_DATA.TCS);
  elements.stockSelect.addEventListener("change", (event) => {
    const selectedStock = STOCK_DATA[event.target.value];
    renderStockInfo(selectedStock);
  });
}

initializeApp();
