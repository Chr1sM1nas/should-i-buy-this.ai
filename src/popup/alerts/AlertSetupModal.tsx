import React, { useState } from 'react';
import { ProductData, PriceAlert } from '../../types';

interface Props {
  product: ProductData;
  userEmail: string;
  onSave: (alert: PriceAlert) => void;
  onClose: () => void;
}

export const AlertSetupModal: React.FC<Props> = ({ product, userEmail, onSave, onClose }) => {
  const [targetPrice, setTargetPrice] = useState(
    (product.price * 0.9).toFixed(2)
  );
  const [email, setEmail] = useState(userEmail);

  const handleSave = () => {
    const parsed = parseFloat(targetPrice);
    if (isNaN(parsed) || parsed <= 0 || !email.includes('@')) return;

    const alert: PriceAlert = {
      id: `alert-${Date.now()}`,
      productUrl: product.url,
      productTitle: product.title,
      targetPrice: parsed,
      currentPrice: product.price,
      email,
      createdAt: Date.now(),
    };

    onSave(alert);
  };

  const savings = product.price - parseFloat(targetPrice || '0');
  const savingsPct = product.price > 0 ? (savings / product.price) * 100 : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🔔 Set Price Alert</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p className="modal-product-title">{product.title}</p>
          <p className="modal-current-price">
            Current price: <strong>${product.price.toFixed(2)}</strong>
          </p>

          <label className="form-label">Alert me when price drops to:</label>
          <div className="price-input-row">
            <span className="currency-symbol">$</span>
            <input
              type="number"
              className="price-input"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              step="0.01"
              min="0.01"
              max={product.price}
            />
          </div>

          {savings > 0 && (
            <div className="savings-preview">
              You&apos;ll save <strong>${savings.toFixed(2)}</strong> ({savingsPct.toFixed(0)}% off)
            </div>
          )}

          <label className="form-label">Notify me at:</label>
          <input
            type="email"
            className="email-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
          />

          <p className="form-note">
            We&apos;ll email you when this product reaches your target price.
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={handleSave}>
            Set Alert
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
