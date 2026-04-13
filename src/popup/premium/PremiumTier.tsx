import React, { useState } from 'react';
import { User } from '../../types';
import { getPremiumFeatures, openPaymentPage } from '../../services/premiumService';

interface Props {
  user: User | null;
  isPremium: boolean;
  onClose: () => void;
  onUserSaved: (user: User) => void;
}

export const PremiumTier: React.FC<Props> = ({ user, isPremium, onClose, onUserSaved }) => {
  const [email, setEmail] = useState(user?.email || '');
  const [step, setStep] = useState<'info' | 'signup' | 'payment'>('info');
  const features = getPremiumFeatures();

  const handleSignup = () => {
    if (!email.trim() || !email.includes('@')) return;

    const newUser: User = {
      id: user?.id || `user-${Date.now()}`,
      email: email.trim(),
      createdAt: user?.createdAt || Date.now(),
      subscription: user?.subscription || { tier: 'free' },
    };
    onUserSaved(newUser);
    setStep('payment');
  };

  const handlePayment = () => {
    openPaymentPage();
    onClose();
  };

  if (isPremium) {
    return (
      <div className="premium-tier premium-active">
        <div className="premium-header">
          <span className="premium-crown">👑</span>
          <h2>Premium Active</h2>
        </div>
        <p className="premium-email">{user?.email}</p>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-item feature-active">
              <span className="feature-icon">{f.icon}</span>
              <div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.description}</div>
              </div>
            </div>
          ))}
        </div>
        <button className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    );
  }

  if (step === 'payment') {
    return (
      <div className="premium-tier">
        <div className="premium-header">
          <span className="premium-crown">👑</span>
          <h2>Upgrade to Premium</h2>
        </div>
        <div className="payment-info">
          <div className="price-tag">$2.99 <span>/month</span></div>
          <p>You&apos;re one step away! Click below to complete your purchase securely via Stripe.</p>
          <ul className="payment-features">
            {features.map((f, i) => (
              <li key={i}>
                {f.icon} {f.title}
              </li>
            ))}
          </ul>
        </div>
        <button className="btn btn-primary btn-upgrade" onClick={handlePayment}>
          💳 Pay with Stripe
        </button>
        <button className="btn btn-ghost" onClick={() => setStep('info')}>
          ← Back
        </button>
      </div>
    );
  }

  if (step === 'signup') {
    return (
      <div className="premium-tier">
        <div className="premium-header">
          <span className="premium-crown">👑</span>
          <h2>Create Account</h2>
        </div>
        <p className="signup-subtitle">Enter your email to get started with Premium.</p>
        <input
          type="email"
          className="email-input"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
        />
        <button
          className="btn btn-primary"
          onClick={handleSignup}
          disabled={!email.includes('@')}
        >
          Continue →
        </button>
        <button className="btn btn-ghost" onClick={() => setStep('info')}>
          ← Back
        </button>
      </div>
    );
  }

  // Default: info step
  return (
    <div className="premium-tier">
      <div className="premium-header">
        <span className="premium-crown">👑</span>
        <h2>Should I Buy This? Premium</h2>
        <div className="price-tag">$2.99 <span>/month</span></div>
      </div>

      <div className="features-grid">
        {features.map((f, i) => (
          <div key={i} className="feature-item">
            <span className="feature-icon">{f.icon}</span>
            <div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.description}</div>
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn-primary btn-upgrade" onClick={() => setStep('signup')}>
        Upgrade Now — $2.99/month
      </button>
      <button className="btn btn-ghost" onClick={onClose}>
        Maybe later
      </button>
    </div>
  );
};
