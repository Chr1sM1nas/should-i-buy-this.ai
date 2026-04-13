import { User, Subscription, SubscriptionTier, PriceAlert } from '../types';

const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/shouldibuythis_premium'; // replace with real link

export function createFreeUser(email: string): User {
  return {
    id: `user-${Date.now()}`,
    email,
    createdAt: Date.now(),
    subscription: {
      tier: 'free',
    },
  };
}

export function isPremium(user: User | null): boolean {
  if (!user) return false;
  const { subscription } = user;
  if (subscription.tier !== 'premium') return false;
  if (subscription.expiresAt && subscription.expiresAt < Date.now()) return false;
  return true;
}

export function getSubscriptionTier(user: User | null): SubscriptionTier {
  if (!user) return 'free';
  if (!isPremium(user)) return 'free';
  return 'premium';
}

/**
 * Persist user to chrome.storage.sync (syncs across devices).
 */
export async function saveUser(user: User): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ user }, resolve);
  });
}

/**
 * Retrieve user from chrome.storage.sync.
 */
export async function getUser(): Promise<User | null> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['user'], (result) => {
      resolve(result.user || null);
    });
  });
}

/**
 * Open the Stripe payment page for premium subscription.
 */
export function openPaymentPage(): void {
  chrome.tabs.create({ url: STRIPE_PAYMENT_LINK });
}

/**
 * Get all premium features list for display.
 */
export function getPremiumFeatures(): Array<{ title: string; description: string; icon: string }> {
  return [
    {
      title: 'Price History',
      description: '30-day price chart so you never overpay',
      icon: '📈',
    },
    {
      title: 'Price Drop Alerts',
      description: 'Email notification when price drops to your target',
      icon: '🔔',
    },
    {
      title: 'Alternative Suggestions',
      description: 'See cheaper or better-rated alternatives',
      icon: '💡',
    },
    {
      title: 'Ad-Free Experience',
      description: 'No sponsored content or ads',
      icon: '🚫',
    },
    {
      title: 'Advanced Analytics',
      description: 'Detailed insights on your shopping habits',
      icon: '📊',
    },
  ];
}

/**
 * Save a price drop alert.
 */
export async function savePriceAlert(alert: PriceAlert): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['priceAlerts'], (result) => {
      const existing: PriceAlert[] = result.priceAlerts || [];
      // Replace if same product URL already exists
      const filtered = existing.filter((a) => a.productUrl !== alert.productUrl);
      const updated = [alert, ...filtered];
      chrome.storage.sync.set({ priceAlerts: updated }, resolve);
    });
  });
}

/**
 * Get all price alerts.
 */
export async function getPriceAlerts(): Promise<PriceAlert[]> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['priceAlerts'], (result) => {
      resolve(result.priceAlerts || []);
    });
  });
}

/**
 * Check if a price alert should be triggered and mark it.
 */
export async function checkPriceAlerts(productUrl: string, currentPrice: number): Promise<PriceAlert[]> {
  const alerts = await getPriceAlerts();
  const triggered: PriceAlert[] = [];

  const updated = alerts.map((alert) => {
    if (
      alert.productUrl === productUrl &&
      !alert.triggered &&
      currentPrice <= alert.targetPrice
    ) {
      triggered.push({ ...alert, triggered: true, currentPrice });
      return { ...alert, triggered: true, currentPrice };
    }
    return alert;
  });

  if (triggered.length > 0) {
    await new Promise<void>((resolve) =>
      chrome.storage.sync.set({ priceAlerts: updated }, resolve)
    );
  }

  return triggered;
}
