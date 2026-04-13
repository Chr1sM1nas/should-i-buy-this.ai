import { PriceHistory, PricePoint } from '../types';

const MAX_HISTORY_DAYS = 30;
const MAX_POINTS_PER_PRODUCT = 90; // ~3 per day over 30 days

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Strip query params except ASIN-related ones for Amazon
    if (parsed.hostname.includes('amazon.')) {
      const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
      if (asinMatch) {
        return `${parsed.hostname}/dp/${asinMatch[1]}`;
      }
    }
    // For other sites strip query params
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return url;
  }
}

/**
 * Record a new price point for a product.
 */
export async function recordPricePoint(
  productUrl: string,
  productTitle: string,
  price: number
): Promise<PriceHistory> {
  const key = normalizeUrl(productUrl);
  const storageKey = `priceHistory_${key}`;

  return new Promise((resolve) => {
    chrome.storage.local.get([storageKey], (result) => {
      const existing: PriceHistory = result[storageKey] || {
        productUrl: key,
        productTitle,
        points: [],
      };

      const now = Date.now();
      const cutoff = now - MAX_HISTORY_DAYS * 24 * 60 * 60 * 1000;

      // Add new point and prune old ones
      const newPoint: PricePoint = { price, timestamp: now, url: productUrl };
      const points = [newPoint, ...existing.points]
        .filter((p) => p.timestamp >= cutoff)
        .slice(0, MAX_POINTS_PER_PRODUCT);

      const prices = points.map((p) => p.price);
      const updated: PriceHistory = {
        ...existing,
        productTitle,
        points,
        lowestPrice: Math.min(...prices),
        highestPrice: Math.max(...prices),
        averagePrice: prices.reduce((a, b) => a + b, 0) / prices.length,
      };

      chrome.storage.local.set({ [storageKey]: updated }, () => {
        resolve(updated);
      });
    });
  });
}

/**
 * Retrieve price history for a product URL.
 */
export async function getPriceHistory(productUrl: string): Promise<PriceHistory | null> {
  const key = normalizeUrl(productUrl);
  const storageKey = `priceHistory_${key}`;

  return new Promise((resolve) => {
    chrome.storage.local.get([storageKey], (result) => {
      resolve(result[storageKey] || null);
    });
  });
}

/**
 * Determine if the current price is a good deal relative to history.
 */
export function analyzePrice(
  history: PriceHistory,
  currentPrice: number
): {
  isLowest: boolean;
  isAboveAverage: boolean;
  percentBelowAverage: number;
  message: string;
} {
  if (!history.averagePrice || history.points.length < 2) {
    return {
      isLowest: false,
      isAboveAverage: false,
      percentBelowAverage: 0,
      message: 'Not enough price history yet',
    };
  }

  const isLowest = currentPrice <= (history.lowestPrice ?? currentPrice);
  const isAboveAverage = currentPrice > history.averagePrice;
  const percentBelowAverage =
    ((history.averagePrice - currentPrice) / history.averagePrice) * 100;

  let message: string;
  if (isLowest) {
    message = '🏆 Lowest price in 30 days!';
  } else if (percentBelowAverage > 10) {
    message = `📉 ${percentBelowAverage.toFixed(0)}% below 30-day average`;
  } else if (isAboveAverage) {
    message = `📈 Above 30-day average — consider waiting`;
  } else {
    message = 'Average price for this product';
  }

  return { isLowest, isAboveAverage, percentBelowAverage, message };
}

/**
 * Format price history data for chart display.
 * Returns sorted array of { date, price } objects.
 */
export function formatChartData(
  history: PriceHistory
): Array<{ date: string; price: number }> {
  return [...history.points]
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((p) => ({
      date: new Date(p.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      price: p.price,
    }));
}
