import { DecisionResult, ProductData } from '../types';
import { buildMarketComparison } from './marketIntelligence';

export function makeDecision(product: ProductData): DecisionResult {
  let confidence = 0.5;
  const reasons: string[] = [];
  const dataWarnings: string[] = [];
  let priceScore = 0.5;
  let ratingScore = 0.5;
  let estimatedSavingsPercent = 0;

  // Price analysis
  if (product.originalPrice && product.price < product.originalPrice) {
    const discount = ((product.originalPrice - product.price) / product.originalPrice) * 100;
    estimatedSavingsPercent = Math.round(discount);
    if (discount > 20) {
      priceScore = 0.8;
      reasons.push(`Good discount: ${discount.toFixed(0)}% off`);
    } else if (discount > 10) {
      priceScore = 0.6;
      reasons.push(`Moderate discount: ${discount.toFixed(0)}% off`);
    }
  } else if (product.originalPrice && product.price >= product.originalPrice) {
    estimatedSavingsPercent = 0;
  } else {
    dataWarnings.push('No reliable list price found. Savings estimate is conservative.');
  }

  // Rating analysis
  if (product.rating) {
    if (product.rating >= 4.5) {
      ratingScore = 0.9;
      reasons.push('Excellent rating');
    } else if (product.rating >= 4.0) {
      ratingScore = 0.7;
      reasons.push('Good rating');
    } else if (product.rating < 3.0) {
      ratingScore = 0.3;
      reasons.push('Poor rating');
    }
  }
  if (!product.rating) {
    dataWarnings.push('Rating data unavailable on this page.');
  }

  // Stock analysis
  if (product.inStock === false) {
    reasons.push('Currently out of stock');
    confidence = 0.2;
  }

  // Calculate final decision
  confidence = (priceScore + ratingScore) / 2;
  const shouldBuy = confidence >= 0.6;

  let recommendationLevel: 'highly_recommended' | 'recommended' | 'neutral' | 'not_recommended' = 'neutral';
  if (shouldBuy && confidence >= 0.8) {
    recommendationLevel = 'highly_recommended';
  } else if (shouldBuy) {
    recommendationLevel = 'recommended';
  } else if (confidence < 0.4) {
    recommendationLevel = 'not_recommended';
  }

  // Timing insight: simple, explainable heuristic designed for fast UX feedback.
  let timingRecommendation: 'buy_now' | 'wait' | 'watch' = 'watch';
  let urgencyLevel: 'high' | 'medium' | 'low' = 'medium';
  let timingNote = 'Price may change soon. Keep this item on watch.';

  if (!product.inStock) {
    timingRecommendation = 'wait';
    urgencyLevel = 'low';
    timingNote = 'Out of stock right now, so waiting is the safest move.';
  } else if (estimatedSavingsPercent >= 20 && confidence >= 0.65) {
    timingRecommendation = 'buy_now';
    urgencyLevel = 'high';
    timingNote = 'Strong discount with decent confidence suggests buying now.';
  } else if (estimatedSavingsPercent <= 5 && confidence < 0.65) {
    timingRecommendation = 'wait';
    urgencyLevel = 'low';
    timingNote = 'No clear price edge yet and confidence is limited.';
  } else {
    timingRecommendation = 'watch';
    urgencyLevel = confidence >= 0.7 ? 'high' : 'medium';
    timingNote = 'Signals are mixed, so watch for a better entry point.';
  }

  const dataConfidence: 'high' | 'medium' | 'low' =
    dataWarnings.length === 0 ? 'high' : dataWarnings.length === 1 ? 'medium' : 'low';

  const marketComparison = buildMarketComparison(product);
  if (marketComparison.bestMarketSavingsPercent >= 8) {
    reasons.push(`Cross-market check found up to ${marketComparison.bestMarketSavingsPercent}% cheaper options.`);
  } else if (marketComparison.bestMarketSavingsPercent === 0) {
    reasons.push('Current listing is already near the best sampled market price.');
  }

  // Deal quality score: combines discount strength, confidence, rating, and data reliability.
  let dealQualityScore = 50;
  if (typeof product.originalPrice === 'number' && product.originalPrice > 0) {
    if (estimatedSavingsPercent >= 25) {
      dealQualityScore += 30;
    } else if (estimatedSavingsPercent >= 15) {
      dealQualityScore += 20;
    } else if (estimatedSavingsPercent >= 8) {
      dealQualityScore += 10;
    } else if (estimatedSavingsPercent <= 0) {
      dealQualityScore -= 15;
    }
  } else {
    dealQualityScore -= 8;
  }

  if (typeof product.rating === 'number') {
    if (product.rating >= 4.5) {
      dealQualityScore += 8;
    } else if (product.rating >= 4.0) {
      dealQualityScore += 4;
    } else if (product.rating < 3.0) {
      dealQualityScore -= 10;
    }
  }

  dealQualityScore += Math.round((confidence - 0.5) * 30);

  if (!product.inStock) {
    dealQualityScore -= 20;
  }

  if (dataConfidence === 'low') {
    dealQualityScore -= 10;
  } else if (dataConfidence === 'medium') {
    dealQualityScore -= 4;
  }

  if (marketComparison.bestMarketSavingsPercent >= 12) {
    dealQualityScore -= 12;
  } else if (marketComparison.bestMarketSavingsPercent >= 6) {
    dealQualityScore -= 6;
  } else if (marketComparison.bestMarketSavingsPercent === 0) {
    dealQualityScore += 4;
  }

  dealQualityScore = Math.max(0, Math.min(100, dealQualityScore));

  let dealQualityLabel: 'great_deal' | 'fair_price' | 'overpriced' | 'insufficient_data' = 'fair_price';
  if (!product.originalPrice && dataConfidence === 'low') {
    dealQualityLabel = 'insufficient_data';
  } else if (dealQualityScore >= 75) {
    dealQualityLabel = 'great_deal';
  } else if (dealQualityScore < 45) {
    dealQualityLabel = 'overpriced';
  }

  let dealQualityNote = 'Price appears reasonable for current market signals.';
  if (dealQualityLabel === 'great_deal') {
    dealQualityNote = 'Strong value right now compared with available price signals.';
  } else if (dealQualityLabel === 'overpriced') {
    dealQualityNote = 'This price looks high for the current signals. Consider waiting.';
  } else if (dealQualityLabel === 'insufficient_data') {
    dealQualityNote = 'Insufficient pricing context to call this a strong deal.';
  }

  return {
    shouldBuy,
    confidence,
    reasons,
    priceScore,
    ratingScore,
    recommendationLevel,
    dealQualityScore,
    dealQualityLabel,
    dealQualityNote,
    marketComparison,
    timingRecommendation,
    estimatedSavingsPercent,
    urgencyLevel,
    timingNote,
    dataConfidence,
    dataWarnings
  };
}