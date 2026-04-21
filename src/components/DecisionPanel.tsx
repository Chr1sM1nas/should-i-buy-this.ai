import React from 'react';
import type { DecisionResult } from '../types';
import PriceInfo from './PriceInfo';
import ActionButtons from './ActionButtons';
import Alternatives from './Alternatives';
import './DecisionPanel.css';

interface DecisionPanelProps {
  decision: DecisionResult;
  productTitle: string;
  onClose: () => void;
  onBuy: () => void;
  onSkip: () => void;
  onShare: () => void;
  onDragStart: (event: React.PointerEvent<HTMLDivElement>) => void;
}

export default function DecisionPanel({
  decision,
  productTitle,
  onClose,
  onBuy,
  onSkip,
  onShare,
  onDragStart
}: DecisionPanelProps) {
  const getRecommendationColor = () => {
    switch (decision.recommendationLevel) {
      case 'highly_recommended':
        return '#4CAF50';
      case 'recommended':
        return '#2196F3';
      case 'neutral':
        return '#FF9800';
      case 'not_recommended':
        return '#F44336';
      default:
        return '#6B7280';
    }
  };

  const getTimingLabel = () => {
    switch (decision.timingRecommendation) {
      case 'buy_now':
        return 'Buy Now';
      case 'wait':
        return 'Wait';
      default:
        return 'Watch Price';
    }
  };

  const getUrgencyLabel = () => {
    switch (decision.urgencyLevel) {
      case 'high':
        return 'High urgency';
      case 'low':
        return 'Low urgency';
      default:
        return 'Medium urgency';
    }
  };

  const getSavingsLabel = () => {
    if (typeof decision.estimatedSavingsPercent !== 'number') {
      return null;
    }

    if (decision.estimatedSavingsPercent <= 0) {
      return 'No immediate savings detected';
    }

    return `Estimated savings now: ${decision.estimatedSavingsPercent}%`;
  };

  const getDealQualityLabel = () => {
    switch (decision.dealQualityLabel) {
      case 'great_deal':
        return 'Great Deal';
      case 'overpriced':
        return 'Overpriced';
      case 'insufficient_data':
        return 'Insufficient Data';
      default:
        return 'Fair Price';
    }
  };

  const isLowConfidence = decision.confidence < 0.65 || decision.dataConfidence === 'low';
  const savingsLabel = getSavingsLabel();

  return (
    <section className="decision-panel">
      <div className="panel-drag-handle" onPointerDown={onDragStart}>
        Drag panel
      </div>
      <button type="button" className="panel-close" onClick={onClose}>
        Close
      </button>
      <p className="panel-eyebrow">Decision Summary</p>
      <h2 className="panel-title">{productTitle}</h2>
      <div className="panel-recommendation" style={{ borderColor: getRecommendationColor() }}>
        <strong style={{ color: getRecommendationColor() }}>
          {decision.recommendationLevel.replace(/_/g, ' ')}
        </strong>
        <span>{Math.round(decision.confidence * 100)}% confidence</span>
      </div>

      <div className="panel-deal-quality">
        <div className={`deal-quality-badge deal-quality-${decision.dealQualityLabel || 'fair_price'}`}>
          {getDealQualityLabel()}
          {typeof decision.dealQualityScore === 'number' ? ` ${decision.dealQualityScore}/100` : ''}
        </div>
        {decision.dealQualityNote && <p className="deal-quality-note">{decision.dealQualityNote}</p>}
      </div>

      {decision.marketComparison && (
        <div className="panel-market-intelligence">
          <p className="market-title">Market Radar</p>
          {decision.marketComparison.bestOverall && (
            <p className="market-line">
              Best overall: {decision.marketComparison.bestOverall.retailer} ${decision.marketComparison.bestOverall.price.toFixed(2)}
            </p>
          )}
          {decision.marketComparison.bestOnline && (
            <p className="market-line">
              Best online: {decision.marketComparison.bestOnline.retailer} ${decision.marketComparison.bestOnline.price.toFixed(2)}
            </p>
          )}
          {decision.marketComparison.bestOffline && (
            <p className="market-line">
              Best offline: {decision.marketComparison.bestOffline.retailer} ${decision.marketComparison.bestOffline.price.toFixed(2)}
            </p>
          )}
          <p className="market-summary">{decision.marketComparison.intelligenceSummary}</p>
        </div>
      )}

      {isLowConfidence && (
        <p className="panel-guardrail">
          Lower-confidence estimate. We could not verify all pricing signals on this page.
        </p>
      )}

      <div className="panel-timing-insight">
        <div className="timing-pill">{getTimingLabel()}</div>
        <span className="timing-urgency">{getUrgencyLabel()}</span>
        {savingsLabel && <p className="timing-savings">{savingsLabel}</p>}
        {decision.timingNote && <p className="timing-note">{decision.timingNote}</p>}
      </div>

      <div className="panel-reasons">
        {decision.reasons.length > 0 ? (
          <ul>
            {decision.reasons.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        ) : (
          <p>No detailed reasons available.</p>
        )}
      </div>

      <PriceInfo priceScore={decision.priceScore} />
      <Alternatives alternatives={decision.alternatives} />
      <ActionButtons
        onBuy={onBuy}
        onSkip={onSkip}
        onShare={onShare}
        isLowConfidence={isLowConfidence}
        recommendationLevel={decision.recommendationLevel}
      />
    </section>
  );
}
