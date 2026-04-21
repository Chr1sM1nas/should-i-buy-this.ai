import type { ProductData } from '../types';

const AFFILIATE_CONFIG = {
  // Replace with your Amazon Associates tracking ID, e.g. "yourstore-20".
  amazonTag: 'agenticcollec-20'
};

function extractAmazonAsin(url: URL): string | null {
  const match = url.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?]|$)/i);
  return match ? match[1].toUpperCase() : null;
}

export function buildAffiliateBuyUrl(product: ProductData): string {
  if (product.source !== 'amazon' || !AFFILIATE_CONFIG.amazonTag) {
    return product.url;
  }

  let url: URL;
  try {
    url = new URL(product.url);
  } catch {
    return product.url;
  }

  const asin = extractAmazonAsin(url);

  if (asin) {
    const canonical = new URL(`${url.origin}/dp/${asin}`);
    canonical.searchParams.set('tag', AFFILIATE_CONFIG.amazonTag);
    canonical.searchParams.set('linkCode', 'll1');
    return canonical.toString();
  }

  url.searchParams.set('tag', AFFILIATE_CONFIG.amazonTag);
  url.searchParams.set('linkCode', 'll1');
  return url.toString();
}

export function buildAffiliateCartUrl(product: ProductData): string | null {
  if (product.source !== 'amazon' || !AFFILIATE_CONFIG.amazonTag) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(product.url);
  } catch {
    return null;
  }

  const asin = extractAmazonAsin(url);
  if (!asin) {
    return null;
  }

  const cartAdd = new URL(`${url.origin}/gp/aws/cart/add.html`);
  cartAdd.searchParams.set('ASIN.1', asin);
  cartAdd.searchParams.set('Quantity.1', '1');
  cartAdd.searchParams.set('tag', AFFILIATE_CONFIG.amazonTag);
  cartAdd.searchParams.set('linkCode', 'll1');
  return cartAdd.toString();
}

export function hasAffiliateLink(product: ProductData): boolean {
  return buildAffiliateBuyUrl(product) !== product.url;
}
