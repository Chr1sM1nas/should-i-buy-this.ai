import { Message, MessageResponse, AffiliateClick, AnalyticsEvent } from '../types';
import { trackAffiliateClick, getAffiliateClicks } from '../services/affiliateService';
import { getUser, saveUser, getPriceAlerts, savePriceAlert } from '../services/premiumService';
import { recordPricePoint, getPriceHistory } from '../services/priceHistoryService';
import { mockSponsoredDeals } from '../services/mockData';

chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse: (r: MessageResponse) => void) => {
    handleMessage(message).then(sendResponse);
    return true; // keep channel open for async response
  }
);

async function handleMessage(message: Message): Promise<MessageResponse> {
  try {
    switch (message.type) {
      case 'GET_USER': {
        const user = await getUser();
        return { success: true, data: user };
      }

      case 'SAVE_USER': {
        const user = message.payload as Parameters<typeof saveUser>[0];
        await saveUser(user);
        return { success: true };
      }

      case 'TRACK_AFFILIATE_CLICK': {
        const click = message.payload as AffiliateClick;
        await trackAffiliateClick(click);
        return { success: true };
      }

      case 'GET_PRICE_HISTORY': {
        const url = message.payload as string;
        const history = await getPriceHistory(url);
        return { success: true, data: history };
      }

      case 'SAVE_PRICE_POINT': {
        const { url, title, price } = message.payload as {
          url: string;
          title: string;
          price: number;
        };
        const history = await recordPricePoint(url, title, price);
        return { success: true, data: history };
      }

      case 'GET_SPONSORED_DEALS': {
        const activeDeals = mockSponsoredDeals.filter((d) => d.active);
        return { success: true, data: activeDeals };
      }

      case 'TRACK_EVENT': {
        const event = message.payload as AnalyticsEvent;
        await trackAnalyticsEvent(event);
        return { success: true };
      }

      case 'SET_PRICE_ALERT': {
        const alert = message.payload as Parameters<typeof savePriceAlert>[0];
        await savePriceAlert(alert);
        return { success: true };
      }

      case 'GET_PRICE_ALERTS': {
        const alerts = await getPriceAlerts();
        return { success: true, data: alerts };
      }

      default:
        return { success: false, error: `Unknown message type: ${message.type}` };
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('[Background] Error handling message:', message.type, error);
    return { success: false, error };
  }
}

async function trackAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['analyticsEvents'], (result) => {
      const existing: AnalyticsEvent[] = result.analyticsEvents || [];
      const updated = [event, ...existing].slice(0, 1000);
      chrome.storage.local.set({ analyticsEvents: updated }, resolve);
    });
  });
}

// On install: set up defaults
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Background] Should I Buy This? AI installed.');
  chrome.storage.local.get(['affiliateClicks'], (result) => {
    if (!result.affiliateClicks) {
      chrome.storage.local.set({ affiliateClicks: [] });
    }
  });
});

// Listen for affiliate clicks from content script via tab updates
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url) {
    // Could intercept navigation here for affiliate tracking
    void getAffiliateClicks(); // keep reference to avoid tree-shaking
  }
});
