import React from 'react';
import './ActionButtons.css';

interface ActionButtonsProps {
  onBuy: () => void;
  onSkip: () => void;
  onShare: () => void;
  isLowConfidence: boolean;
  recommendationLevel: 'highly_recommended' | 'recommended' | 'neutral' | 'not_recommended';
}

export default function ActionButtons({
  onBuy,
  onSkip,
  onShare,
  isLowConfidence,
  recommendationLevel
}: ActionButtonsProps) {
  const buyLabel = isLowConfidence
    ? 'View on Amazon'
    : recommendationLevel === 'highly_recommended' || recommendationLevel === 'recommended'
      ? 'Buy on Amazon'
      : 'Check on Amazon';

  return (
    <div className="action-buttons">
      <button type="button" className="btn btn-primary" onClick={onBuy}>
        {buyLabel}
      </button>
      <button type="button" className="btn btn-secondary" onClick={onSkip}>
        Compare Later
      </button>
      <button type="button" className="btn btn-tertiary" onClick={onShare}>
        Share
      </button>
      <p className="affiliate-disclosure">We may earn from qualifying purchases.</p>
    </div>
  );
}