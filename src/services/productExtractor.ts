import { ProductData } from '../types';

export interface ProductPageDetection {
  isProductPage: boolean;
  platform: 'amazon' | 'shopify' | 'generic' | null;
  product?: ProductData;
}

function hasProductSchema(): boolean {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');

  return Array.from(scripts).some((script) => {
    try {
      const parsed = JSON.parse(script.textContent || '{}');
      const entries = Array.isArray(parsed) ? parsed : [parsed, ...(Array.isArray(parsed['@graph']) ? parsed['@graph'] : [])];

      return entries.some((entry) => {
        const type = entry?.['@type'];
        return type === 'Product' || (Array.isArray(type) && type.includes('Product'));
      });
    } catch {
      return false;
    }
  });
}

function hasPurchaseIntentSignals(): boolean {
  const selectors = [
    '#add-to-cart-button',
    'button[name="add"]',
    'button[data-testid="add-to-cart"]',
    '[data-action="add-to-cart"]',
    'form[action*="cart"] button[type="submit"]',
    '[itemprop="offers"]'
  ];

  return selectors.some((selector) => {
    const element = document.querySelector(selector);
    return !!element && !!element.textContent?.trim();
  });
}

function isAmazonDetailPage(): boolean {
  const pathname = window.location.pathname;
  const detailPath = /\/dp\/|\/gp\/product\//.test(pathname);
  const hasDetailControls = !!document.querySelector('#add-to-cart-button, #buy-now-button, #productTitle');

  return detailPath || hasDetailControls;
}

function isLikelyProductPage(platform: 'amazon' | 'shopify' | 'generic'): boolean {
  if (platform === 'amazon') {
    return isAmazonDetailPage();
  }

  if (platform === 'shopify') {
    return hasProductSchema() || hasPurchaseIntentSignals();
  }

  return hasProductSchema() || hasPurchaseIntentSignals();
}

export function detectAmazonProduct(): ProductData | null {
  try {
    if (!isLikelyProductPage('amazon')) return null;

    const titleSelectors = [
      'h1 span',
      '[data-feature-name="title"] h1',
      '#productTitle',
      '.product-title',
      'h1[data-feature-name]'
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
      '.a-price.a-text-price.a-size-medium.a-color-price',
      '[data-feature-name="dp-price"] .a-price-whole',
      '.a-spacing-none.a-color-price.a-text-bold',
      '[data-feature-name="price"] .a-price'
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

    // Original/list price - look for strikethrough or "List Price"
    let originalPrice: number | undefined;
    
    // Try finding strikethrough price
    const listPriceSelectors = [
      '.a-strikethrough .a-price-whole',
      '[data-a-strike="true"] .a-price-whole',
      '.a-price.a-text-price.a-size-base.a-color-secondary'
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

    // If not found, try searching for "List Price:" text
    if (!originalPrice) {
      const bodyText = document.body.innerText;
      const listPriceMatch = bodyText.match(/List Price:\s*[A-Z]{0,3}\s*([\d,.]+)/i);
      if (listPriceMatch) {
        const parsed = parseFloat(listPriceMatch[1].replace(/[^0-9.]/g, ''));
        if (!isNaN(parsed) && parsed > price) {
          originalPrice = parsed;
        }
      }
    }

    // Rating - look for star rating
    let rating: number | undefined;
    const ratingSelectors = [
      '.a-icon-star-small span',
      '[data-rating] .a-icon-star span',
      'i[data-a-icon-star] span'
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
    let inStock = true;
    const pageText = document.body.innerText;
    if (pageText.includes('Currently unavailable') || pageText.includes('Out of Stock')) {
      inStock = false;
    }

    const imageEl = document.querySelector('img[data-old-hires], img.a-dynamic-image, #landingImage') as HTMLImageElement;
    const imageUrl = imageEl?.src || undefined;

    return {
      title,
      price,
      originalPrice,
      rating,
      inStock,
      url: window.location.href,
      imageUrl,
      source: 'amazon'
    };
  } catch (error) {
    console.error('[ProductExtractor] Amazon detection error:', error);
    return null;
  }
}

export function detectShopifyProduct(): ProductData | null {
  try {
    if (!isLikelyProductPage('shopify')) return null;

    const titleSelectors = [
      'h1.product__title',
      '[data-product-title]',
      'h1 span',
      '.product-title h1',
      'h1[itemprop="name"]'
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
      '.product-price',
      '[itemprop="price"]',
      '.price__current',
      '.product__price',
      'span.money'
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

    const imageEl = document.querySelector('img.product__media-image, img[data-product-image], .product__featured-image img') as HTMLImageElement;
    const imageUrl = imageEl?.src || imageEl?.dataset.src || undefined;

    return {
      title,
      price,
      url: window.location.href,
      imageUrl,
      source: 'shopify'
    };
  } catch (error) {
    console.error('[ProductExtractor] Shopify detection error:', error);
    return null;
  }
}

export function detectGenericProduct(): ProductData | null {
  try {
    if (!isLikelyProductPage('generic')) return null;

    const titleSelectors = ['h1', '[data-testid="product-title"]', '.product-name', '.product-heading', '[itemprop="name"]'];

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

    const priceSelectors = ['[data-price]', '.price', '[itemprop="price"]', '.product-price', '.current-price'];

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
    const imageUrl = imageEl?.src || undefined;

    return {
      title,
      price,
      url: window.location.href,
      imageUrl,
      source: 'generic'
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
      product: product || undefined
    };
  }

  if (hostname.includes('shopify.com') || hostname.includes('.myshopify.com') || hostname.includes('.shop')) {
    const product = detectShopifyProduct();
    return {
      isProductPage: !!product,
      platform: product ? 'shopify' : null,
      product: product || undefined
    };
  }

  const product = detectGenericProduct();
  return {
    isProductPage: !!product,
    platform: product ? 'generic' : null,
    product: product || undefined
  };
}

export function debugProductDetection(): void {
  const detection = detectProduct();
  console.log('[ProductExtractor] Detection result:', {
    isProductPage: detection.isProductPage,
    platform: detection.platform,
    product: detection.product
  });
}
