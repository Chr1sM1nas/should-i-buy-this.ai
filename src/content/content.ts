import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import DecisionPanel from '../components/DecisionPanel';
import { sendToBackground } from '../utils/messaging';
import { detectProduct, debugProductDetection } from '../services/productExtractor';
import { buildAffiliateBuyUrl, hasAffiliateLink } from '../services/affiliateLinks';
import { saveAffiliateClick, saveDecision, saveTelemetryEvent } from '../utils/storage';
import type { DecisionResult, ProductData } from '../types';

console.log('[Content] Script injected on:', window.location.hostname);

let panelInjected = false;
let currentProduct: ProductData | null = null;
let currentDecision: DecisionResult | null = null;
let panelRoot: Root | null = null;
let dragCleanup: (() => void) | null = null;

const CONFIG = {
  PANEL_ID: 'should-i-buy-panel',
  WRAPPER_ID: 'should-i-buy-panel-wrapper'
};

function injectPanel() {
  if (panelInjected) return;
  panelInjected = true;

  const existingWrapper = document.getElementById(CONFIG.WRAPPER_ID);
  if (existingWrapper) return existingWrapper;

  const wrapper = document.createElement('div');
  wrapper.id = CONFIG.WRAPPER_ID;
  wrapper.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    width: 320px;
    max-width: calc(100vw - 24px);
  `;

  const panel = document.createElement('div');
  panel.id = CONFIG.PANEL_ID;
  wrapper.appendChild(panel);
  document.body.appendChild(wrapper);
  panelRoot = createRoot(panel);

  renderLoadingState();
  return wrapper;
}

function renderLoadingState() {
  if (!panelRoot) return;

  panelRoot.render(
    React.createElement('div', {
      style: {
        padding: '16px',
        background: '#fff',
        border: '1px solid #d1d5db',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.16)',
        fontFamily: 'Arial, sans-serif'
      }
    }, 'Analyzing product...')
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function enableDragging(startEvent: React.PointerEvent<HTMLDivElement>) {
  const wrapper = document.getElementById(CONFIG.WRAPPER_ID);
  if (!wrapper) return;

  const rect = wrapper.getBoundingClientRect();
  const offsetX = startEvent.clientX - rect.left;
  const offsetY = startEvent.clientY - rect.top;

  wrapper.style.left = `${rect.left}px`;
  wrapper.style.top = `${rect.top}px`;
  wrapper.style.right = 'auto';
  wrapper.style.bottom = 'auto';

  const handleMove = (event: PointerEvent) => {
    const maxLeft = window.innerWidth - rect.width - 8;
    const maxTop = window.innerHeight - rect.height - 8;
    const nextLeft = clamp(event.clientX - offsetX, 8, Math.max(8, maxLeft));
    const nextTop = clamp(event.clientY - offsetY, 8, Math.max(8, maxTop));

    wrapper.style.left = `${nextLeft}px`;
    wrapper.style.top = `${nextTop}px`;
  };

  const stopDragging = () => {
    window.removeEventListener('pointermove', handleMove);
    window.removeEventListener('pointerup', stopDragging);
    dragCleanup = null;
  };

  if (dragCleanup) {
    dragCleanup();
  }

  dragCleanup = stopDragging;
  window.addEventListener('pointermove', handleMove);
  window.addEventListener('pointerup', stopDragging);
}

function closePanel() {
  const wrapper = document.getElementById(CONFIG.WRAPPER_ID);
  wrapper?.remove();
  panelInjected = false;
  panelRoot = null;
}

async function copyShareText() {
  if (!currentProduct || !currentDecision) return;

  const shareText = [
    `Should I Buy This? ${currentDecision.shouldBuy ? 'Yes' : 'No'}`,
    currentProduct.title,
    `Confidence: ${Math.round(currentDecision.confidence * 100)}%`,
    currentProduct.url
  ].join('\n');

  try {
    await navigator.clipboard.writeText(shareText);
    window.alert('Decision copied to clipboard.');
  } catch (error) {
    console.error('[Content] Failed to copy share text:', error);
    window.prompt('Copy this decision summary:', shareText);
  }
}

function extractAsinFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?]|$)/i);
    return match ? match[1].toUpperCase() : null;
  } catch {
    return null;
  }
}

function logBuyClick(outboundUrl: string) {
  void saveAffiliateClick({
    timestamp: new Date().toISOString(),
    asin: extractAsinFromUrl(outboundUrl),
    outboundUrl
  });
}


function saveAndOpenProduct() {
  if (!currentDecision) return;
  void saveDecision(currentDecision);

  if (currentProduct && hasAffiliateLink(currentProduct)) {
    const affiliateUrl = buildAffiliateBuyUrl(currentProduct);
    logBuyClick(affiliateUrl);
    window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  const purchaseTarget = document.querySelector(
    '#add-to-cart-button, #buy-now-button, button[name="add"], button[data-testid="add-to-cart"], [data-action="add-to-cart"]'
  ) as HTMLElement | null;

  if (purchaseTarget) {
    logBuyClick(currentProduct?.url || window.location.href);
    purchaseTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
    purchaseTarget.focus();
    purchaseTarget.style.outline = '3px solid #16a34a';
    purchaseTarget.style.outlineOffset = '3px';
    window.setTimeout(() => {
      purchaseTarget.style.outline = '';
      purchaseTarget.style.outlineOffset = '';
    }, 2400);
    return;
  }

  if (currentProduct) {
    logBuyClick(currentProduct.url);
    window.open(currentProduct.url, '_blank', 'noopener,noreferrer');
  }
}

function saveAndDismiss() {
  if (!currentDecision) return;
  void saveDecision(currentDecision);
  closePanel();
}

function renderDecisionPanel(product: ProductData, decision: DecisionResult) {
  if (!panelRoot) return;

  panelRoot.render(
    React.createElement(DecisionPanel, {
      decision,
      productTitle: product.title,
      onClose: closePanel,
      onBuy: saveAndOpenProduct,
      onSkip: saveAndDismiss,
      onShare: () => {
        void copyShareText();
      },
      onDragStart: enableDragging
    })
  );
}

async function analyzeProduct() {
  const detection = detectProduct();
  
  console.log('[Content] FULL Detection:', JSON.stringify(detection, null, 2));
  
  if (detection.isProductPage && detection.product) {
    currentProduct = detection.product;
    window.__productData = currentProduct;

    void saveTelemetryEvent({
      timestamp: new Date().toISOString(),
      eventType: 'product_detection_success',
      source: currentProduct.source,
      url: currentProduct.url
    });

    if (!currentProduct.originalPrice) {
      void saveTelemetryEvent({
        timestamp: new Date().toISOString(),
        eventType: 'missing_original_price',
        source: currentProduct.source,
        url: currentProduct.url,
        details: 'No list/original price was detected from page selectors.'
      });
    }
    
    console.log('[Content] Product extracted:', currentProduct);
    
    try {
      const response = await sendToBackground({
        type: 'ANALYZE_PRODUCT',
        payload: currentProduct
      });
      
      console.log('[Content] FULL Decision received:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        const decision = response.decision as DecisionResult | undefined;
        
        if (decision) {
          currentDecision = decision;

          if (decision.confidence < 0.65 || decision.dataConfidence === 'low') {
            void saveTelemetryEvent({
              timestamp: new Date().toISOString(),
              eventType: 'low_confidence_decision',
              source: currentProduct.source,
              url: currentProduct.url,
              details: `confidence=${decision.confidence.toFixed(2)}, dataConfidence=${decision.dataConfidence || 'unknown'}`
            });
          }

          renderDecisionPanel(currentProduct, decision);
        }
      }
    } catch (error) {
      console.error('[Content] Error analyzing product:', error);
    }
  } else {
    void saveTelemetryEvent({
      timestamp: new Date().toISOString(),
      eventType: 'product_detection_failed',
      url: window.location.href,
      details: 'Product detection returned no supported product payload.'
    });
  }
}

if (detectProduct().isProductPage) {
  injectPanel();
  void analyzeProduct();
}
