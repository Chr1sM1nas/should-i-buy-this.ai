import React, { useEffect, useState } from 'react';
import { getAffiliateClicks, getDecisionHistory, getPreferences, getTelemetryEvents } from '../utils/storage';
import type { AffiliateClickEvent, DecisionResult, TelemetryEvent, UserPreferences } from '../types';
import './Popup.css';

export default function Popup() {
  const [history, setHistory] = useState<DecisionResult[]>([]);
  const [affiliateClicks, setAffiliateClicks] = useState<AffiliateClickEvent[]>([]);
  const [telemetryEvents, setTelemetryEvents] = useState<TelemetryEvent[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      const historyData = await getDecisionHistory();
      const affiliateClickData = await getAffiliateClicks();
      const telemetryData = await getTelemetryEvents();
      const preferencesData = await getPreferences();
      setHistory(historyData || []);
      setAffiliateClicks(affiliateClickData || []);
      setTelemetryEvents(telemetryData || []);
      setPreferences(preferencesData || {});
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="popup">Loading...</div>;
  }

  const latestDecision = history.length > 0 ? history[history.length - 1] : null;
  const recentClicks = affiliateClicks.slice(-5).reverse();
  const recentTelemetry = telemetryEvents.slice(-10).reverse();

  const formatTimingSummary = (decision: DecisionResult) => {
    const timing = decision.timingRecommendation?.replace('_', ' ') || 'watch';

    if (typeof decision.estimatedSavingsPercent !== 'number') {
      return `Timing: ${timing}`;
    }

    if (decision.estimatedSavingsPercent <= 0) {
      return `Timing: ${timing} (no immediate savings detected)`;
    }

    return `Timing: ${timing} (${decision.estimatedSavingsPercent}% savings)`;
  };

  const hasGuardrail =
    !!latestDecision && (latestDecision.confidence < 0.65 || latestDecision.dataConfidence === 'low');

  const formatDealQualityLabel = (label?: DecisionResult['dealQualityLabel']) => {
    switch (label) {
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

  const formatTelemetryEventType = (eventType: TelemetryEvent['eventType']) => {
    return eventType
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  async function handleCopyClick(click: AffiliateClickEvent) {
    try {
      const json = JSON.stringify(click, null, 2);
      await navigator.clipboard.writeText(json);
      alert('Click log JSON copied to clipboard.');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  return (
    <div className="popup">
      <header className="popup-header">
        <div>
          <h1>Should I Buy This?</h1>
          <p>Quick view of your recent shopping decisions.</p>
        </div>
      </header>

      <section className="popup-section">
        <h2>Recent Buy Clicks</h2>
        {recentClicks.length > 0 ? (
          <div className="click-log-list">
            {recentClicks.map((click, index) => (
              <div className="click-log-item" key={`${click.timestamp}-${index}`}>
                <p className="click-log-time">{new Date(click.timestamp).toLocaleString()}</p>
                <p className="click-log-asin">ASIN: {click.asin || 'N/A'}</p>
                <a
                  className="click-log-link"
                  href={click.outboundUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {click.outboundUrl}
                </a>
                <button
                  type="button"
                  className="click-log-copy-btn"
                  onClick={() => handleCopyClick(click)}
                >
                  Copy JSON
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No buy clicks recorded yet.</div>
        )}
      </section>

      <section className="popup-section">
        <h2>Latest Decision</h2>
        {latestDecision ? (
          <div className="decision-card">
            <div className={`decision-badge decision-${latestDecision.recommendationLevel}`}>
              {latestDecision.recommendationLevel.replace(/_/g, ' ')}
            </div>
            <p className="decision-deal-quality-row">
              <span className={`deal-quality-badge deal-quality-${latestDecision.dealQualityLabel || 'fair_price'}`}>
                {formatDealQualityLabel(latestDecision.dealQualityLabel)}
                {typeof latestDecision.dealQualityScore === 'number' ? ` ${latestDecision.dealQualityScore}/100` : ''}
              </span>
            </p>
            {latestDecision.dealQualityNote && (
              <p className="decision-deal-quality-note">{latestDecision.dealQualityNote}</p>
            )}
            {latestDecision.marketComparison && (
              <div className="decision-market-intelligence">
                {latestDecision.marketComparison.bestOverall && (
                  <p className="decision-market-line">
                    Best overall: {latestDecision.marketComparison.bestOverall.retailer} ${latestDecision.marketComparison.bestOverall.price.toFixed(2)}
                  </p>
                )}
                {latestDecision.marketComparison.bestMarketSavingsPercent > 0 && (
                  <p className="decision-market-line">
                    Up to {latestDecision.marketComparison.bestMarketSavingsPercent}% cheaper elsewhere.
                  </p>
                )}
                <p className="decision-market-summary">
                  {latestDecision.marketComparison.intelligenceSummary}
                </p>
              </div>
            )}
            <p className="decision-confidence">
              Confidence {Math.round(latestDecision.confidence * 100)}%
            </p>
            {hasGuardrail && (
              <p className="decision-guardrail">
                Lower-confidence result. Price context was partially missing.
              </p>
            )}
            {latestDecision.timingRecommendation && (
              <p className="decision-timing">
                {formatTimingSummary(latestDecision)}
              </p>
            )}
            {latestDecision.timingNote && <p className="decision-timing-note">{latestDecision.timingNote}</p>}
            <ul className="reason-list">
              {latestDecision.reasons.length > 0 ? (
                latestDecision.reasons.map((reason, index) => <li key={index}>{reason}</li>)
              ) : (
                <li>No saved reasoning yet.</li>
              )}
            </ul>
          </div>
        ) : (
          <div className="empty-state">No decisions saved yet. Visit a supported product page to analyze one.</div>
        )}
      </section>

      <section className="popup-section compact-grid">
        <div className="stat-card">
          <span className="stat-label">Saved Decisions</span>
          <strong className="stat-value">{history.length}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Price Limit</span>
          <strong className="stat-value">
            {preferences.maxPrice ? `$${preferences.maxPrice}` : 'Not set'}
          </strong>
        </div>
      </section>

      <section className="popup-section">
        <h2>Preferences</h2>
        <div className="preference-row">
          <span>Tracked categories</span>
          <strong>{preferences.categories?.length ?? 0}</strong>
        </div>
        <div className="preference-row">
          <span>Tracked brands</span>
          <strong>{preferences.brands?.length ?? 0}</strong>
        </div>
      </section>

      <section className="popup-section">
        <h2>Diagnostics</h2>
        {recentTelemetry.length > 0 ? (
          <div className="diagnostic-list">
            {recentTelemetry.map((event, index) => (
              <div className="diagnostic-item" key={`${event.timestamp}-${event.eventType}-${index}`}>
                <p className="diagnostic-headline">{formatTelemetryEventType(event.eventType)}</p>
                <p className="diagnostic-meta">{new Date(event.timestamp).toLocaleString()}</p>
                <p className="diagnostic-meta">Source: {event.source || 'unknown'}</p>
                {event.details && <p className="diagnostic-details">{event.details}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No telemetry events yet.</div>
        )}
      </section>

    </div>
  );
}
