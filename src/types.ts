export interface ProductData {
  title: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  url: string;
  imageUrl?: string;
  description?: string;
  inStock?: boolean;
  category?: string;
  source?: 'amazon' | 'shopify' | 'generic';
}

export interface DecisionResult {
  shouldBuy: boolean;
  confidence: number;
  reasons: string[];
  priceScore: number;
  ratingScore: number;
  recommendationLevel: 'highly_recommended' | 'recommended' | 'neutral' | 'not_recommended';
  dealQualityScore?: number;
  dealQualityLabel?: 'great_deal' | 'fair_price' | 'overpriced' | 'insufficient_data';
  dealQualityNote?: string;
  marketComparison?: MarketComparison;
  timingRecommendation?: 'buy_now' | 'wait' | 'watch';
  estimatedSavingsPercent?: number;
  urgencyLevel?: 'high' | 'medium' | 'low';
  timingNote?: string;
  dataConfidence?: 'high' | 'medium' | 'low';
  dataWarnings?: string[];
  alternatives?: ProductData[];
  priceHistory?: PricePoint[];
}

export interface PricePoint {
  date: string;
  price: number;
}

export interface MarketPricePoint {
  retailer: string;
  channel: 'online' | 'offline';
  price: number;
  availability: 'in_stock' | 'limited' | 'unknown';
  confidence: number;
  url?: string;
  distanceMiles?: number;
}

export interface MarketComparison {
  points: MarketPricePoint[];
  bestOnline?: MarketPricePoint;
  bestOffline?: MarketPricePoint;
  bestOverall?: MarketPricePoint;
  bestMarketSavingsPercent: number;
  intelligenceSummary: string;
}

export interface AffiliateClickEvent {
  timestamp: string;
  asin: string | null;
  outboundUrl: string;
}

export interface StorageData {
  decisions: DecisionResult[];
  affiliateClicks: AffiliateClickEvent[];
  telemetryEvents: TelemetryEvent[];
  preferences: UserPreferences;
}

export interface TelemetryEvent {
  timestamp: string;
  eventType:
    | 'product_detection_success'
    | 'product_detection_failed'
    | 'missing_original_price'
    | 'low_confidence_decision';
  source?: ProductData['source'];
  url?: string;
  details?: string;
}

export interface UserPreferences {
  maxPrice?: number;
  categories?: string[];
  brands?: string[];
}