import { makeDecision } from '../services/decisionEngine';
import type { Message, MessageResponse } from '../utils/messaging';

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse: (response: MessageResponse) => void) => {
  console.log('[Background] Message received:', message);

  if (message.type === 'ANALYZE_PRODUCT') {
    const product = message.payload;
    
    // Call decision engine
    const decision = makeDecision(product);
    
    console.log('[Background] Decision:', decision);
    sendResponse({ success: true, decision });
  }
});

console.log('[Background] Service worker loaded');
