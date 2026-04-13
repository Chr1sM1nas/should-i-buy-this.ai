import { detectProduct } from '../services/productExtractor';
import { injectAffiliateTag, buildAffiliateClick } from '../services/affiliateService';
import { Message, MessageResponse, ProductData } from '../types';

let currentProduct: ProductData | null = null;

function init() {
  const detection = detectProduct();

  if (detection.isProductPage && detection.product) {
    currentProduct = detection.product;

    // Notify background to record price point
    void chrome.runtime.sendMessage({
      type: 'SAVE_PRICE_POINT',
      payload: {
        url: currentProduct.url,
        title: currentProduct.title,
        price: currentProduct.price,
      },
    });

    // Intercept product link clicks to inject affiliate tags
    interceptAffiliateClicks();
  }
}

function interceptAffiliateClicks() {
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const anchor = target.closest('a') as HTMLAnchorElement | null;
    if (!anchor || !anchor.href) return;

    const href = anchor.href;
    const platform = currentProduct?.source || 'generic';

    // Only modify Amazon links
    if (!href.includes('amazon.')) return;

    const affiliateUrl = injectAffiliateTag(href, platform);

    if (affiliateUrl !== href && currentProduct) {
      event.preventDefault();

      const click = buildAffiliateClick(
        href,
        affiliateUrl,
        currentProduct.title,
        currentProduct.price,
        platform
      );

      void chrome.runtime.sendMessage({
        type: 'TRACK_AFFILIATE_CLICK',
        payload: click,
      });

      // Open the affiliate URL
      window.open(affiliateUrl, '_blank');
    }
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse: (r: MessageResponse) => void) => {
    if (message.type === 'GET_PRODUCT') {
      sendResponse({ success: true, data: currentProduct });
      return true;
    }
    return false;
  }
);

// Run after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
