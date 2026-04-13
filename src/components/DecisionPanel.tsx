import React from 'react';
import { DecisionResult } from '../types';

interface Props {
  result: DecisionResult;
}

const levelConfig = {
  highly_recommended: { emoji: '⭐', label: 'HIGHLY RECOMMENDED', color: '#16a34a' },
  recommended: { emoji: '✅', label: 'RECOMMENDED', color: '#22c55e' },
  neutral: { emoji: '🤔', label: 'NEUTRAL', color: '#f59e0b' },
  not_recommended: { emoji: '❌', label: 'NOT RECOMMENDED', color: '#ef4444' },
};

export const DecisionPanel: React.FC<Props> = ({ result }) => {
  const config = levelConfig[result.recommendationLevel];
  const confidencePct = Math.round(result.confidence * 100);

  return (
    <div className="decision-panel">
      <div className="decision-level" style={{ color: config.color }}>
        <span className="decision-emoji">{config.emoji}</span>
        <span className="decision-label">{config.label}</span>
      </div>

      <div className="confidence-bar-container">
        <div className="confidence-label">Confidence: {confidencePct}%</div>
        <div className="confidence-bar">
          <div
            className="confidence-fill"
            style={{ width: `${confidencePct}%`, backgroundColor: config.color }}
          />
        </div>
      </div>

      {result.reasons.length > 0 && (
        <ul className="reasons-list">
          {result.reasons.map((reason, i) => (
            <li key={i} className="reason-item">
              {reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
