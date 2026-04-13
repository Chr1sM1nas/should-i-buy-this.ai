// Core product data
export interface ProductData {
  title: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  inStock?: boolean;
  url: string;
  image?: string;
  source: 'amazon' | 'shopify' | 'generic';
  asin?: string;
}

// Decision engine result
export interface DecisionResult {
  shouldBuy: boolean;
  confidence: number;
  reasons: string[];
  priceScore: number;
  ratingScore: number;
  recommendationLevel: 'highly_recommended' | 'recommended' | 'neutral' | 'not_recommended';
}

// User account
export interface User {
  id: string;
  email: string;
  createdAt: number;
  subscription: Subscription;
}

// Subscription tiers
export type SubscriptionTier = 'free' | 'premium';

export interface Subscription {
  tier: SubscriptionTier;
  expiresAt?: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

// Affiliate tracking
export interface AffiliateClick {
  id: string;
  url: string;
  affiliateUrl: string;
  productTitle: string;
  productPrice: number;
  platform: string;
  timestamp: number;
  converted?: boolean;
}

export interface AffiliateConfig {
  amazonTag: string;
  enabled: boolean;
}

// Price history
export interface PricePoint {
  price: number;
  timestamp: number;
  url: string;
}

export interface PriceHistory {
  productUrl: string;
  productTitle: string;
  points: PricePoint[];
  lowestPrice?: number;
  highestPrice?: number;
  averagePrice?: number;
}

// Price drop alert
export interface PriceAlert {
  id: string;
  productUrl: string;
  productTitle: string;
  targetPrice: number;
  currentPrice: number;
  email: string;
  createdAt: number;
  triggered?: boolean;
}

// Sponsored deal
export interface SponsoredDeal {
  id: string;
  productTitle: string;
  productUrl: string;
  brand: string;
  badge: string;
  tooltip: string;
  imageUrl?: string;
  campaignId: string;
  impressions: number;
  clicks: number;
  active: boolean;
  relevantCategories: string[];
}

// Analytics event
export interface AnalyticsEvent {
  type: 'affiliate_click' | 'premium_view' | 'sponsored_impression' | 'sponsored_click' | 'decision_made' | 'alert_set';
  data: Record<string, unknown>;
  timestamp: number;
}

// Messages between popup/content/background
export type MessageType =
  | 'GET_PRODUCT'
  | 'PRODUCT_DETECTED'
  | 'MAKE_DECISION'
  | 'TRACK_AFFILIATE_CLICK'
  | 'GET_PRICE_HISTORY'
  | 'SAVE_PRICE_POINT'
  | 'GET_USER'
  | 'SAVE_USER'
  | 'GET_SPONSORED_DEALS'
  | 'TRACK_EVENT'
  | 'SET_PRICE_ALERT'
  | 'GET_PRICE_ALERTS';

export interface Message {
  type: MessageType;
  payload?: unknown;
}

export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
