import { AffiliateClick, AffiliateConfig } from '../types';
import { AMAZON_AFFILIATE_TAG } from '../config';

export function getAffiliateConfig(): AffiliateConfig {
  return {
    amazonTag: AMAZON_AFFILIATE_TAG,
    enabled: true,
  };
}

/**
 * Inject Amazon Associates affiliate tag into an Amazon product URL.
 * Returns the modified URL, or the original if not an Amazon URL.
 */
export function injectAmazonAffiliateTag(url: string, tag?: string): string {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('amazon.')) {
      return url;
    }
    const affiliateTag = tag || AMAZON_AFFILIATE_TAG;
    parsed.searchParams.set('tag', affiliateTag);
    // Remove any existing associate tags that might conflict
    parsed.searchParams.delete('ref');
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Inject affiliate tag into any supported platform URL.
 */
export function injectAffiliateTag(url: string, platform: string): string {
  const config = getAffiliateConfig();
  if (!config.enabled) return url;

  if (platform === 'amazon') {
    return injectAmazonAffiliateTag(url, config.amazonTag);
  }
  return url;
}

/**
 * Build an affiliate click record.
 */
export function buildAffiliateClick(
  url: string,
  affiliateUrl: string,
  productTitle: string,
  productPrice: number,
  platform: string
): AffiliateClick {
  return {
    id: `click-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    url,
    affiliateUrl,
    productTitle,
    productPrice,
    platform,
    timestamp: Date.now(),
    converted: false,
  };
}

/**
 * Persist an affiliate click to chrome.storage.local.
 */
export async function trackAffiliateClick(click: AffiliateClick): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['affiliateClicks'], (result) => {
      const existing: AffiliateClick[] = result.affiliateClicks || [];
      // Keep last 500 clicks
      const updated = [click, ...existing].slice(0, 500);
      chrome.storage.local.set({ affiliateClicks: updated }, resolve);
    });
  });
}

/**
 * Retrieve stored affiliate clicks.
 */
export async function getAffiliateClicks(): Promise<AffiliateClick[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['affiliateClicks'], (result) => {
      resolve(result.affiliateClicks || []);
    });
  });
}

/**
 * Calculate estimated earnings from affiliate clicks.
 * Amazon Associates earns roughly 3% commission on most categories.
 */
export function estimateEarnings(clicks: AffiliateClick[]): number {
  const COMMISSION_RATE = 0.03;
  return clicks
    .filter((c) => c.converted)
    .reduce((sum, c) => sum + c.productPrice * COMMISSION_RATE, 0);
}
