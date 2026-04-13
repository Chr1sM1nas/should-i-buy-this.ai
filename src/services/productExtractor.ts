import { ProductData } from '../types';

export interface ProductPageDetection {
  isProductPage: boolean;
  platform: 'amazon' | 'shopify' | 'generic' | null;
  product?: ProductData;
}

export function detectAmazonProduct(): ProductData | null {
  try {
    const titleSelectors = [
      '#productTitle',
      'h1 span',
      '[data-feature-name="title"] h1',
      '.product-title',
      'h1[data-feature-name]',
    ];

    let titleEl: Element | null = null;
    for (const selector of titleSelectors) {
      titleEl = document.querySelector(selector);
      if (titleEl && titleEl.textContent?.trim()) break;
    }

    if (!titleEl) return null;
    const title = titleEl.textContent?.trim() || '';
    if (!title || title.length < 5) return null;

    // Current price
    const priceSelectors = [
      '.a-price-whole',
      '[data-a-color="price"] .a-price-whole',
      '[data-feature-name="dp-price"] .a-price-whole',
      '.a-spacing-none.a-color-price.a-text-bold',
    ];

    let priceEl: Element | null = null;
    for (const selector of priceSelectors) {
      priceEl = document.querySelector(selector);
      if (priceEl && priceEl.textContent?.trim()) break;
    }

    if (!priceEl) return null;

    const priceText = priceEl.textContent?.replace(/[^0-9.]/g, '').trim() || '0';
    const price = parseFloat(priceText);

    if (isNaN(price) || price <= 0) return null;

    // Original/list price
    let originalPrice: number | undefined;
    const listPriceSelectors = [
      '.a-strikethrough .a-price-whole',
      '[data-a-strike="true"] .a-price-whole',
      '.a-price.a-text-price.a-size-base.a-color-secondary',
    ];

    for (const selector of listPriceSelectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent?.trim()) {
        const text = el.textContent.replace(/[^0-9.]/g, '').trim();
        const parsed = parseFloat(text);
        if (!isNaN(parsed) && parsed > price) {
          originalPrice = parsed;
          break;
        }
      }
    }

    // Fallback: search body text for "List Price:"
    if (!originalPrice) {
      const bodyText = document.body.innerText;
      const listPriceMatch = bodyText.match(/List Price:\s*[A-Z£$€]{0,3}\s*([\d,.]+)/i);
      if (listPriceMatch) {
        const parsed = parseFloat(listPriceMatch[1].replace(/[^0-9.]/g, ''));
        if (!isNaN(parsed) && parsed > price) {
          originalPrice = parsed;
        }
      }
    }

    // Rating
    let rating: number | undefined;
    const ratingSelectors = [
      '.a-icon-star-small span',
      '[data-rating] .a-icon-star span',
      'i[data-a-icon-star] span',
    ];

    for (const selector of ratingSelectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent?.trim()) {
        const text = el.textContent.match(/[\d.]+/);
        if (text) {
          rating = parseFloat(text[0]);
          if (!isNaN(rating) && rating > 0 && rating <= 5) break;
        }
      }
    }

    // Stock status
    const pageText = document.body.innerText;
    const inStock =
      !pageText.includes('Currently unavailable') &&
      !pageText.includes('Out of Stock');

    // ASIN from URL
    const asinMatch = window.location.href.match(/\/dp\/([A-Z0-9]{10})/);
    const asin = asinMatch ? asinMatch[1] : undefined;

    const imageEl = document.querySelector(
      'img[data-old-hires], img.a-dynamic-image, #landingImage'
    ) as HTMLImageElement;
    const image = imageEl?.src || undefined;

    return {
      title,
      price,
      originalPrice,
      rating,
      inStock,
      url: window.location.href,
      image,
      source: 'amazon',
      asin,
    };
  } catch (error) {
    console.error('[ProductExtractor] Amazon detection error:', error);
    return null;
  }
}

export function detectShopifyProduct(): ProductData | null {
  try {
    const titleSelectors = [
      'h1.product__title',
      '[data-product-title]',
      'h1[itemprop="name"]',
      '.product-title h1',
      'h1 span',
    ];

    let titleEl: Element | null = null;
    for (const selector of titleSelectors) {
      titleEl = document.querySelector(selector);
      if (titleEl && titleEl.textContent?.trim()) break;
    }

    if (!titleEl) return null;
    const title = titleEl.textContent?.trim() || '';
    if (!title || title.length < 5) return null;

    const priceSelectors = [
      '[data-price]',
      '[itemprop="price"]',
      '.price__current',
      '.product__price',
      'span.money',
      '.product-price',
    ];

    let priceEl: Element | null = null;
    for (const selector of priceSelectors) {
      priceEl = document.querySelector(selector);
      if (priceEl && priceEl.textContent?.trim()) break;
    }

    if (!priceEl) return null;

    const priceText = priceEl.textContent?.replace(/[^0-9.]/g, '').trim() || '0';
    const price = parseFloat(priceText);

    if (isNaN(price) || price <= 0) return null;

    const imageEl = document.querySelector(
      'img.product__media-image, img[data-product-image], .product__featured-image img'
    ) as HTMLImageElement;
    const image = imageEl?.src || (imageEl as HTMLImageElement | null)?.dataset?.src || undefined;

    return {
      title,
      price,
      url: window.location.href,
      image,
      source: 'shopify',
    };
  } catch (error) {
    console.error('[ProductExtractor] Shopify detection error:', error);
    return null;
  }
}

export function detectGenericProduct(): ProductData | null {
  try {
    const titleSelectors = [
      '[itemprop="name"]',
      '[data-testid="product-title"]',
      '.product-name',
      '.product-heading',
      'h1',
    ];

    let titleEl: Element | null = null;
    for (const selector of titleSelectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent && el.textContent.trim().length > 5) {
        titleEl = el;
        break;
      }
    }

    if (!titleEl) return null;
    const title = titleEl.textContent?.trim() || '';

    const priceSelectors = [
      '[itemprop="price"]',
      '[data-price]',
      '.current-price',
      '.product-price',
      '.price',
    ];

    let priceEl: Element | null = null;
    for (const selector of priceSelectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent?.match(/\d+/)) {
        priceEl = el;
        break;
      }
    }

    if (!priceEl) return null;

    const priceText = priceEl.textContent?.replace(/[^0-9.]/g, '').trim() || '0';
    const price = parseFloat(priceText);

    if (isNaN(price) || price <= 0) return null;

    const imageEl = document.querySelector('img') as HTMLImageElement;
    const image = imageEl?.src || undefined;

    return {
      title,
      price,
      url: window.location.href,
      image,
      source: 'generic',
    };
  } catch (error) {
    console.error('[ProductExtractor] Generic detection error:', error);
    return null;
  }
}

export function detectProduct(): ProductPageDetection {
  const hostname = window.location.hostname;

  if (hostname.includes('amazon.')) {
    const product = detectAmazonProduct();
    return {
      isProductPage: !!product,
      platform: product ? 'amazon' : null,
      product: product || undefined,
    };
  }

  if (
    hostname.endsWith('.shopify.com') ||
    hostname.endsWith('.myshopify.com') ||
    hostname.endsWith('.shop')
  ) {
    const product = detectShopifyProduct();
    return {
      isProductPage: !!product,
      platform: product ? 'shopify' : null,
      product: product || undefined,
    };
  }

  const product = detectGenericProduct();
  return {
    isProductPage: !!product,
    platform: product ? 'generic' : null,
    product: product || undefined,
  };
}
