import React from 'react';
import { ProductData } from '../types';
import { injectAffiliateTag } from '../services/affiliateService';

interface Props {
  product: ProductData;
  onSetAlert?: () => void;
  isPremium: boolean;
}

export const ActionButtons: React.FC<Props> = ({ product, onSetAlert, isPremium }) => {
  const affiliateUrl = injectAffiliateTag(product.url, product.source);
  const isAffiliate = affiliateUrl !== product.url;

  const handleBuyClick = () => {
    chrome.tabs.create({ url: affiliateUrl });
  };

  return (
    <div className="action-buttons">
      <button className="btn btn-primary" onClick={handleBuyClick}>
        View on {product.source === 'amazon' ? 'Amazon' : 'Store'}
      </button>

      {isPremium ? (
        <button className="btn btn-secondary" onClick={onSetAlert}>
          �� Set Price Alert
        </button>
      ) : (
        <button
          className="btn btn-secondary btn-locked"
          title="Upgrade to Premium to set price alerts"
          disabled
        >
          🔒 Set Price Alert
        </button>
      )}

      {isAffiliate && (
        <p className="affiliate-disclosure">
          * We may earn a commission on purchases. This doesn&apos;t affect our recommendations.
        </p>
      )}
    </div>
  );
};
