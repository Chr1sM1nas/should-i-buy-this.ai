import React from 'react';

interface Props {
  onClose: () => void;
}

export const AffiliateInfo: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="affiliate-info">
      <h3>About Affiliate Links</h3>
      <p>
        When you click product links in this extension, we may use affiliate links
        (e.g. Amazon Associates). This means we may earn a small commission on
        qualifying purchases at no extra cost to you.
      </p>
      <p>
        Affiliate relationships never influence our recommendations — our advice
        is based purely on price, rating, and availability data.
      </p>
      <a
        href="https://affiliate-program.amazon.com/home/mediapolicy"
        target="_blank"
        rel="noopener noreferrer"
        className="link"
      >
        Learn about Amazon Associates →
      </a>
      <button className="btn btn-secondary" onClick={onClose}>
        Got it
      </button>
    </div>
  );
};
