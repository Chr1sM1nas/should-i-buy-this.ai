import React, { useState } from 'react';
import { ProductData, User, PriceHistory, PriceAlert } from '../types';
import { makeDecision } from '../services/decisionEngine';
import { getPremiumFeatures } from '../services/premiumService';
import { injectAffiliateTag } from '../services/affiliateService';
import { mockProducts } from '../services/mockData';
import { DecisionPanel } from '../components/DecisionPanel';
import { PriceInfo } from '../components/PriceInfo';
import { ActionButtons } from '../components/ActionButtons';
import { Alternatives } from '../components/Alternatives';
import { PremiumTier } from '../popup/premium/PremiumTier';
import { AffiliateInfo } from '../popup/affiliate/AffiliateInfo';
import { AlertSetupModal } from '../popup/alerts/AlertSetupModal';
import { PriceHistoryChart } from '../popup/charts/PriceHistoryChart';

// ---------------------------------------------------------------------------
// Mock data helpers
// ---------------------------------------------------------------------------

const MOCK_FREE_USER: User = {
  id: 'preview-user-free',
  email: 'free@example.com',
  createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
  subscription: { tier: 'free' },
};

const MOCK_PREMIUM_USER: User = {
  id: 'preview-user-premium',
  email: 'premium@example.com',
  createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  subscription: {
    tier: 'premium',
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    stripeCustomerId: 'cus_preview',
    stripeSubscriptionId: 'sub_preview',
  },
};

/** Generate a plausible 30-day price history for a product. */
function buildMockHistory(product: ProductData): PriceHistory {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const base = product.originalPrice ?? product.price;
  const points = Array.from({ length: 30 }, (_, i) => {
    const variance = (Math.sin(i * 0.7) * 0.08 + (Math.random() - 0.5) * 0.04) * base;
    return {
      price: Math.round((base + variance) * 100) / 100,
      timestamp: now - (29 - i) * DAY,
      url: product.url,
    };
  });
  const prices = points.map((p) => p.price);
  return {
    productUrl: product.url,
    productTitle: product.title,
    points,
    lowestPrice: Math.min(...prices),
    highestPrice: Math.max(...prices),
    averagePrice: Math.round((prices.reduce((s, p) => s + p, 0) / prices.length) * 100) / 100,
  };
}

const MOCK_HISTORIES = mockProducts.map(buildMockHistory);

// ---------------------------------------------------------------------------
// Scenario labels
// ---------------------------------------------------------------------------

const SCENARIOS = [
  { label: '✅ Great deal (Sony headphones)', index: 0 },
  { label: '⚠️  Average deal (AirPods Pro)', index: 1 },
  { label: '❌ Poor product (cheap knockoff)', index: 2 },
];

// ---------------------------------------------------------------------------
// Popup Frame — renders the real extension popup components
// ---------------------------------------------------------------------------

type PopupView = 'main' | 'premium' | 'affiliate';

interface PopupFrameProps {
  product: ProductData;
  user: User;
  history: PriceHistory;
  onUserChange: (u: User) => void;
}

const PopupFrame: React.FC<PopupFrameProps> = ({ product, user, history, onUserChange }) => {
  const [view, setView] = useState<PopupView>('main');
  const [showAlert, setShowAlert] = useState(false);

  const decision = makeDecision(product);
  const premium = user.subscription.tier === 'premium';

  const handleAlertSaved = (_alert: PriceAlert) => {
    setShowAlert(false);
  };

  if (view === 'premium') {
    return (
      <div className="popup">
        <PremiumTier
          user={user}
          isPremium={premium}
          onClose={() => setView('main')}
          onUserSaved={(u) => {
            onUserChange(u);
            setView('main');
          }}
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
            className={`btn-icon ${premium ? 'btn-premium-active' : ''}`}
            title={premium ? 'Premium Active' : 'Upgrade to Premium'}
            onClick={() => setView('premium')}
          >
            {premium ? '👑' : '⭐'}
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

      <div className="product-content">
        {/* Product header */}
        <div className="product-header">
          {product.image && (
            <img src={product.image} alt={product.title} className="product-image" />
          )}
          <h2 className="product-title">{product.title}</h2>
        </div>

        {/* Decision panel */}
        <DecisionPanel result={decision} />

        {/* Price info */}
        <PriceInfo
          product={product}
          history={premium ? history : null}
          isPremium={premium}
        />

        {/* Price history chart (premium only) */}
        {premium && history.points.length >= 2 && (
          <PriceHistoryChart history={history} currentPrice={product.price} />
        )}

        {/* Action buttons */}
        <ActionButtons
          product={product}
          isPremium={premium}
          onSetAlert={() => setShowAlert(true)}
        />

        {/* Alternatives */}
        <Alternatives
          alternatives={[]}
          isPremium={premium}
          onUpgrade={() => setView('premium')}
        />
      </div>

      {/* Alert modal */}
      {showAlert && premium && (
        <AlertSetupModal
          product={product}
          userEmail={user.email}
          onSave={handleAlertSaved}
          onClose={() => setShowAlert(false)}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Affiliate Demo section
// ---------------------------------------------------------------------------

const AffiliateDemo: React.FC<{ product: ProductData }> = ({ product }) => {
  const affiliateUrl = injectAffiliateTag(product.url, product.source);
  const isModified = affiliateUrl !== product.url;

  return (
    <div className="preview-section">
      <h3 className="preview-section-title">🔗 Affiliate Tag Injection</h3>
      <p className="preview-section-desc">
        When a user clicks "View on Amazon", the extension appends the affiliate tag to the
        product URL automatically.
      </p>
      <div className="affiliate-demo-table">
        <div className="affiliate-row">
          <span className="affiliate-label">Original URL</span>
          <code className="affiliate-url affiliate-url--original">{product.url}</code>
        </div>
        <div className="affiliate-row">
          <span className="affiliate-label">With affiliate tag</span>
          <code className={`affiliate-url ${isModified ? 'affiliate-url--modified' : ''}`}>
            {affiliateUrl}
          </code>
        </div>
        {isModified && (
          <div className="affiliate-badge">
            ✅ Tag <strong>agenticcollec-20</strong> injected via{' '}
            <code>?tag=agenticcollec-20</code>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Payment flow explainer
// ---------------------------------------------------------------------------

type PaymentStep = 'info' | 'signup' | 'payment' | 'success';

const PaymentFlowDemo: React.FC = () => {
  const [step, setStep] = useState<PaymentStep>('info');
  const [email, setEmail] = useState('');
  const features = getPremiumFeatures();

  const handleResetDemo = () => {
    setStep('info');
    setEmail('');
  };

  const stepLabels: Record<PaymentStep, string> = {
    info: '1. Feature overview',
    signup: '2. Email sign-up',
    payment: '3. Stripe payment',
    success: '4. Success',
  };

  return (
    <div className="preview-section">
      <h3 className="preview-section-title">💳 Mock Stripe Payment Flow</h3>
      <p className="preview-section-desc">
        Click through each step to simulate the premium subscription flow.
      </p>

      {/* Step breadcrumb */}
      <div className="payment-steps">
        {(Object.keys(stepLabels) as PaymentStep[]).map((s) => (
          <span
            key={s}
            className={`payment-step-pill ${step === s ? 'payment-step-pill--active' : ''} ${
              Object.keys(stepLabels).indexOf(s) <
              Object.keys(stepLabels).indexOf(step)
                ? 'payment-step-pill--done'
                : ''
            }`}
          >
            {stepLabels[s]}
          </span>
        ))}
      </div>

      {/* Step content */}
      <div className="payment-step-content">
        {step === 'info' && (
          <div>
            <p className="payment-price-tag">$2.99 / month</p>
            <ul className="payment-features-list">
              {features.map((f, i) => (
                <li key={i}>
                  {f.icon} <strong>{f.title}</strong> — {f.description}
                </li>
              ))}
            </ul>
            <button className="btn btn-primary btn-upgrade" onClick={() => setStep('signup')}>
              Upgrade Now — $2.99/month
            </button>
          </div>
        )}

        {step === 'signup' && (
          <div>
            <p>Enter your email to create a free account and enable the payment step.</p>
            <input
              type="email"
              className="email-input"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && email.includes('@') && setStep('payment')}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                className="btn btn-primary"
                disabled={!email.includes('@')}
                onClick={() => setStep('payment')}
              >
                Continue →
              </button>
              <button className="btn btn-ghost" onClick={() => setStep('info')}>
                ← Back
              </button>
            </div>
          </div>
        )}

        {step === 'payment' && (
          <div>
            <p className="payment-price-tag">$2.99 / month</p>
            <p>
              Account: <strong>{email}</strong>
            </p>
            <p>
              Clicking the button below opens your{' '}
              <strong>Stripe payment page</strong> in a new tab. Use Stripe test card{' '}
              <code>4242 4242 4242 4242</code> with any future expiry and any CVC.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                className="btn btn-primary btn-upgrade"
                onClick={() => {
                  // In preview mode we skip opening Stripe and jump to success
                  setStep('success');
                }}
              >
                💳 Pay with Stripe (simulated)
              </button>
              <button className="btn btn-ghost" onClick={() => setStep('signup')}>
                ← Back
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="payment-success">
            <div className="payment-success-icon">🎉</div>
            <h4>Payment Successful!</h4>
            <p>
              Welcome to <strong>Premium</strong>, {email}! Your subscription is now active.
            </p>
            <p>
              In the real extension, the background script verifies the Stripe webhook,
              updates <code>chrome.storage.sync</code>, and unlocks premium features
              automatically.
            </p>
            <button className="btn btn-secondary" onClick={handleResetDemo}>
              ↩ Reset demo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main UIPreview component
// ---------------------------------------------------------------------------

export const UIPreview: React.FC = () => {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [userType, setUserType] = useState<'free' | 'premium'>('free');
  const [user, setUser] = useState<User>(MOCK_FREE_USER);

  const product = mockProducts[scenarioIndex];
  const history = MOCK_HISTORIES[scenarioIndex];
  const activeUser = userType === 'premium' ? MOCK_PREMIUM_USER : user;

  const handleUserTypeChange = (type: 'free' | 'premium') => {
    setUserType(type);
    setUser(type === 'premium' ? MOCK_PREMIUM_USER : MOCK_FREE_USER);
  };

  return (
    <div className="preview-root">
      {/* Page header */}
      <header className="preview-header">
        <h1>🛍️ Should I Buy This? — UI Preview</h1>
        <p>Development-only testing page. Simulates the extension popup without loading Chrome.</p>
      </header>

      <div className="preview-layout">
        {/* Controls sidebar */}
        <aside className="preview-controls">
          <div className="preview-control-group">
            <label className="preview-control-label">Product Scenario</label>
            {SCENARIOS.map((s) => (
              <button
                key={s.index}
                className={`preview-control-btn ${scenarioIndex === s.index ? 'preview-control-btn--active' : ''}`}
                onClick={() => setScenarioIndex(s.index)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="preview-control-group">
            <label className="preview-control-label">User Type</label>
            <button
              className={`preview-control-btn ${userType === 'free' ? 'preview-control-btn--active' : ''}`}
              onClick={() => handleUserTypeChange('free')}
            >
              👤 Free user
            </button>
            <button
              className={`preview-control-btn ${userType === 'premium' ? 'preview-control-btn--active' : ''}`}
              onClick={() => handleUserTypeChange('premium')}
            >
              👑 Premium user
            </button>
          </div>

          <div className="preview-meta">
            <p>
              <strong>Product:</strong> {product.title.slice(0, 40)}…
            </p>
            <p>
              <strong>Price:</strong> ${product.price.toFixed(2)}
              {product.originalPrice ? ` (was $${product.originalPrice.toFixed(2)})` : ''}
            </p>
            {product.rating && (
              <p>
                <strong>Rating:</strong> ⭐ {product.rating}
              </p>
            )}
            <p>
              <strong>User:</strong> {activeUser.subscription.tier === 'premium' ? '👑 Premium' : '👤 Free'}
            </p>
          </div>
        </aside>

        {/* Popup preview */}
        <main className="preview-main">
          <section className="preview-section">
            <h3 className="preview-section-title">📱 Extension Popup Preview</h3>
            <p className="preview-section-desc">
              This is exactly what users see when they click the extension icon on a product page.
              Use the controls on the left to switch between scenarios and user types.
              Buttons that open external pages (View on Amazon, Pay with Stripe) will open in a
              new tab.
            </p>
            <div className="popup-frame">
              <PopupFrame
                key={`${scenarioIndex}-${userType}`}
                product={product}
                user={activeUser}
                history={history}
                onUserChange={setUser}
              />
            </div>
          </section>

          {/* Affiliate demo */}
          <AffiliateDemo product={product} />

          {/* Payment flow demo */}
          <PaymentFlowDemo />
        </main>
      </div>
    </div>
  );
};
