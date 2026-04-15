import React from 'react';
import './PriceInfo.css';

interface PriceInfoProps {
  priceScore: number;
}

export default function PriceInfo({ priceScore }: PriceInfoProps) {
  const getPriceLabel = () => {
    if (priceScore >= 0.8) return 'Excellent Price';
    if (priceScore >= 0.6) return 'Good Price';
    if (priceScore >= 0.4) return 'Fair Price';
    return 'High Price';
  };

  return (
    <div className="price-info">
      <h3>Price Analysis</h3>
      <div className="price-score">
        <div className="score-label">{getPriceLabel()}</div>
        <div className="score-bar">
          <div
            className="score-fill"
            style={{
              width: `${priceScore * 100}%`,
              backgroundColor: priceScore >= 0.7 ? '#4CAF50' : priceScore >= 0.5 ? '#FF9800' : '#F44336'
            }}
          />
        </div>
      </div>
    </div>
  );
}