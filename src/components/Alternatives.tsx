import React from 'react';

interface Alternative {
  title: string;
  price: number;
  rating?: number;
  url: string;
  reason: string;
}

interface Props {
  alternatives: Alternative[];
  isPremium: boolean;
  onUpgrade: () => void;
}

export const Alternatives: React.FC<Props> = ({ alternatives, isPremium, onUpgrade }) => {
  if (!isPremium) {
    return (
      <div className="alternatives-locked">
        <div className="lock-icon">🔒</div>
        <p>Alternative product suggestions are a <strong>Premium</strong> feature.</p>
        <button className="btn btn-upgrade" onClick={onUpgrade}>
          Upgrade to Premium — $2.99/mo
        </button>
      </div>
    );
  }

  if (alternatives.length === 0) {
    return (
      <div className="alternatives-empty">
        <p>No alternatives found for this product.</p>
      </div>
    );
  }

  return (
    <div className="alternatives-list">
      <h3 className="section-title">💡 You might also consider:</h3>
      {alternatives.map((alt, i) => (
        <a
          key={i}
          href={alt.url}
          target="_blank"
          rel="noopener noreferrer"
          className="alternative-item"
        >
          <div className="alt-info">
            <span className="alt-title">{alt.title}</span>
            <span className="alt-reason">{alt.reason}</span>
          </div>
          <div className="alt-meta">
            <span className="alt-price">${alt.price.toFixed(2)}</span>
            {alt.rating && <span className="alt-rating">⭐ {alt.rating}</span>}
          </div>
        </a>
      ))}
    </div>
  );
};
