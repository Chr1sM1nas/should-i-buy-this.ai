import { ProductData, DecisionResult } from '../types';

export function makeDecision(product: ProductData): DecisionResult {
  let confidence = 0.5;
  const reasons: string[] = [];
  let priceScore = 0.5;
  let ratingScore = 0.5;

  // Price analysis
  if (product.originalPrice && product.price < product.originalPrice) {
    const discount = ((product.originalPrice - product.price) / product.originalPrice) * 100;
    if (discount > 20) {
      priceScore = 0.8;
      reasons.push(`Good discount: ${discount.toFixed(0)}% off`);
    } else if (discount > 10) {
      priceScore = 0.6;
      reasons.push(`Moderate discount: ${discount.toFixed(0)}% off`);
    }
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

  // Stock analysis
  if (product.inStock === false) {
    reasons.push('Currently out of stock');
    confidence = 0.2;
    return {
      shouldBuy: false,
      confidence,
      reasons,
      priceScore,
      ratingScore,
      recommendationLevel: 'not_recommended',
    };
  }

  // Calculate final decision
  confidence = (priceScore + ratingScore) / 2;
  const shouldBuy = confidence >= 0.6;

  let recommendationLevel: DecisionResult['recommendationLevel'] = 'neutral';
  if (shouldBuy && confidence >= 0.8) {
    recommendationLevel = 'highly_recommended';
  } else if (shouldBuy) {
    recommendationLevel = 'recommended';
  } else if (confidence < 0.4) {
    recommendationLevel = 'not_recommended';
  }

  return {
    shouldBuy,
    confidence,
    reasons,
    priceScore,
    ratingScore,
    recommendationLevel,
  };
}
