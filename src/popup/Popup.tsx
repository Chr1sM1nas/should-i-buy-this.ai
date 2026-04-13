import React, { useEffect, useState } from 'react';
import { ProductData, DecisionResult, User, PriceHistory, SponsoredDeal, PriceAlert } from '../types';
import { makeDecision } from '../services/decisionEngine';
import { isPremium } from '../services/premiumService';
import { sendMessage } from '../utils/messaging';
import { DecisionPanel } from '../components/DecisionPanel';
import { PriceInfo } from '../components/PriceInfo';
import { ActionButtons } from '../components/ActionButtons';
import { Alternatives } from '../components/Alternatives';
import { PremiumTier } from './premium/PremiumTier';
import { AffiliateInfo } from './affiliate/AffiliateInfo';
import { SponsoredBadge } from './sponsored/SponsoredBadge';
import { PriceHistoryChart } from './charts/PriceHistoryChart';
import { AlertSetupModal } from './alerts/AlertSetupModal';

type View = 'main' | 'premium' | 'affiliate';

export const Popup: React.FC = () => {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [decision, setDecision] = useState<DecisionResult | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory | null>(null);
  const [sponsoredDeals, setSponsoredDeals] = useState<SponsoredDeal[]>([]);
  const [view, setView] = useState<View>('main');
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userIsPremium = isPremium(user);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      // Get user from storage
      const userRes = await sendMessage<User>({ type: 'GET_USER' });
      if (userRes.success && userRes.data) {
        setUser(userRes.data);
      }

      // Get product from active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        setError('No active tab found.');
        return;
      }

      const productRes = await sendMessage<ProductData>({
        type: 'GET_PRODUCT',
      });

      // Try sending directly to tab's content script
      let detectedProduct: ProductData | null = null;
      try {
        const tabRes = await new Promise<{ success: boolean; data?: ProductData }>((resolve) => {
          chrome.tabs.sendMessage(tab.id!, { type: 'GET_PRODUCT' }, (response) => {
            if (chrome.runtime.lastError) {
              resolve({ success: false });
            } else {
              resolve(response || { success: false });
            }
          });
        });
        if (tabRes.success && tabRes.data) {
          detectedProduct = tabRes.data;
        }
      } catch {
        // Content script may not be running
      }

      if (!detectedProduct && productRes.success && productRes.data) {
        detectedProduct = productRes.data;
      }

      if (detectedProduct) {
        setProduct(detectedProduct);
        const result = makeDecision(detectedProduct);
        setDecision(result);

        // Load price history (premium feature)
        const historyRes = await sendMessage<PriceHistory>({
          type: 'GET_PRICE_HISTORY',
          payload: detectedProduct.url,
        });
        if (historyRes.success && historyRes.data) {
          setPriceHistory(historyRes.data);
        }
      }

      // Load sponsored deals
      const dealsRes = await sendMessage<SponsoredDeal[]>({ type: 'GET_SPONSORED_DEALS' });
      if (dealsRes.success && dealsRes.data) {
        setSponsoredDeals(dealsRes.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  function handleUserSaved(newUser: User) {
    setUser(newUser);
    void sendMessage({ type: 'SAVE_USER', payload: newUser });
  }

  function handleAlertSaved(alert: PriceAlert) {
    void sendMessage({ type: 'SET_PRICE_ALERT', payload: alert });
    setShowAlertModal(false);
  }

  function handleSponsoredClick(deal: SponsoredDeal) {
    void sendMessage({
      type: 'TRACK_EVENT',
      payload: {
        type: 'sponsored_click',
        data: { dealId: deal.id, brand: deal.brand },
        timestamp: Date.now(),
      },
    });
  }

  if (view === 'premium') {
    return (
      <div className="popup">
        <PremiumTier
          user={user}
          isPremium={userIsPremium}
          onClose={() => setView('main')}
          onUserSaved={handleUserSaved}
        />
      </div>
    );
  }

  if (view === 'affiliate') {
    return (
      <div className="popup">
        <AffiliateInfo onClose={() => setView('main')} />
      </div>
    );
  }

  return (
    <div className="popup">
      {/* Header */}
      <div className="header">
        <div className="header-title">
          <span className="header-icon">🛍️</span>
          <h1>Should I Buy This?</h1>
        </div>
        <div className="header-actions">
          <button
            className={`btn-icon ${userIsPremium ? 'btn-premium-active' : ''}`}
            title={userIsPremium ? 'Premium Active' : 'Upgrade to Premium'}
            onClick={() => setView('premium')}
          >
            {userIsPremium ? '👑' : '⭐'}
          </button>
          <button
            className="btn-icon"
            title="About affiliate links"
            onClick={() => setView('affiliate')}
          >
            ℹ
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <p>Analyzing product...</p>
        </div>
      )}

      {!loading && error && (
        <div className="error-state">
          <p>{error}</p>
          <button className="btn btn-secondary" onClick={loadData}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && !product && (
        <div className="no-product-state">
          <div className="no-product-icon">🔍</div>
          <h2>No product detected</h2>
          <p>Navigate to a product page on Amazon or another shopping site to get an AI recommendation.</p>
        </div>
      )}

      {!loading && !error && product && decision && (
        <div className="product-content">
          {/* Product header */}
          <div className="product-header">
            {product.image && (
              <img src={product.image} alt={product.title} className="product-image" />
            )}
            <h2 className="product-title">{product.title}</h2>
          </div>

          {/* Decision result */}
          <DecisionPanel result={decision} />

          {/* Price info */}
          <PriceInfo
            product={product}
            history={priceHistory}
            isPremium={userIsPremium}
          />

          {/* Price history chart (premium) */}
          {userIsPremium && priceHistory && priceHistory.points.length >= 2 && (
            <PriceHistoryChart history={priceHistory} currentPrice={product.price} />
          )}

          {/* Action buttons */}
          <ActionButtons
            product={product}
            isPremium={userIsPremium}
            onSetAlert={() => setShowAlertModal(true)}
          />

          {/* Alternatives (premium) */}
          <Alternatives
            alternatives={[]}
            isPremium={userIsPremium}
            onUpgrade={() => setView('premium')}
          />

          {/* Sponsored deals (only for free users, hidden for premium) */}
          {!userIsPremium && sponsoredDeals.length > 0 && (
            <div className="sponsored-section">
              <div className="section-divider" />
              {sponsoredDeals.slice(0, 1).map((deal) => (
                <SponsoredBadge key={deal.id} deal={deal} onDealClick={handleSponsoredClick} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Alert modal */}
      {showAlertModal && product && user && (
        <AlertSetupModal
          product={product}
          userEmail={user.email}
          onSave={handleAlertSaved}
          onClose={() => setShowAlertModal(false)}
        />
      )}
    </div>
  );
};
