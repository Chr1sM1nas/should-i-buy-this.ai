import React from 'react';
import './ActionButtons.css';

interface ActionButtonsProps {
  onBuy: () => void;
  onSkip: () => void;
  onShare: () => void;
}

export default function ActionButtons({ onBuy, onSkip, onShare }: ActionButtonsProps) {

  return (
    <div className="action-buttons">
      <button type="button" className="btn btn-primary" onClick={onBuy}>
        Buy It
      </button>
      <button type="button" className="btn btn-secondary" onClick={onSkip}>
        Skip It
      </button>
      <button type="button" className="btn btn-tertiary" onClick={onShare}>
        Share
      </button>
    </div>
  );
}