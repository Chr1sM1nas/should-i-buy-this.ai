import React, { useState } from 'react';
import { SponsoredDeal } from '../../types';

interface Props {
  deal: SponsoredDeal;
  onDealClick: (deal: SponsoredDeal) => void;
}

export const SponsoredBadge: React.FC<Props> = ({ deal, onDealClick }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = () => {
    onDealClick(deal);
    chrome.tabs.create({ url: deal.productUrl });
  };

  return (
    <div className="sponsored-badge-container">
      <button
        className="sponsored-badge"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={handleClick}
      >
        <span className="badge-icon">⭐</span>
        <span className="badge-text">{deal.badge}</span>
        <span className="badge-info">ℹ</span>
      </button>

      {showTooltip && (
        <div className="sponsored-tooltip">
          {deal.tooltip}
          <br />
          <span className="tooltip-brand">by {deal.brand}</span>
        </div>
      )}

      <div className="sponsored-product">
        <div className="sponsored-title">{deal.productTitle}</div>
        <button className="btn btn-small" onClick={handleClick}>
          View Deal →
        </button>
      </div>
    </div>
  );
};
