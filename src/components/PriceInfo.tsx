import React from 'react';
import { ProductData, PriceHistory } from '../types';
import { analyzePrice } from '../services/priceHistoryService';

interface Props {
  product: ProductData;
  history?: PriceHistory | null;
  isPremium: boolean;
}

export const PriceInfo: React.FC<Props> = ({ product, history, isPremium }) => {
  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const priceAnalysis = history && history.points.length >= 2
    ? analyzePrice(history, product.price)
    : null;

  return (
    <div className="price-info">
      <div className="price-row">
        <span className="price-current">${product.price.toFixed(2)}</span>
        {product.originalPrice && (
          <span className="price-original">${product.originalPrice.toFixed(2)}</span>
        )}
        {discount !== null && (
          <span className="price-discount">-{discount}%</span>
        )}
      </div>

      {product.inStock === false && (
        <div className="stock-badge out-of-stock">Out of Stock</div>
      )}
      {product.inStock === true && (
        <div className="stock-badge in-stock">In Stock</div>
      )}

      {isPremium && priceAnalysis && (
        <div className="price-analysis">{priceAnalysis.message}</div>
      )}

      {isPremium && history && history.points.length >= 2 && (
        <div className="price-history-summary">
          <span>30-day low: <strong>${history.lowestPrice?.toFixed(2)}</strong></span>
          <span>Avg: <strong>${history.averagePrice?.toFixed(2)}</strong></span>
          <span>High: <strong>${history.highestPrice?.toFixed(2)}</strong></span>
        </div>
      )}

      {!isPremium && (
        <div className="premium-hint">
          🔒 Price history available with <strong>Premium</strong>
        </div>
      )}
    </div>
  );
};
