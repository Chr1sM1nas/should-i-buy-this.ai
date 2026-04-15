import { StorageData, UserPreferences, DecisionResult, AffiliateClickEvent, TelemetryEvent } from '../types';

const STORAGE_KEY = 'should-i-buy-this-data';

export async function get(key: string): Promise<any> {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key]);
    });
  });
}

export async function set(key: string, value: any): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => {
      resolve();
    });
  });
}

export async function getStorageData(): Promise<StorageData> {
  const data = await get(STORAGE_KEY);

  if (!data) {
    return { decisions: [], affiliateClicks: [], telemetryEvents: [], preferences: {} };
  }

  return {
    decisions: data.decisions || [],
    affiliateClicks: data.affiliateClicks || [],
    telemetryEvents: data.telemetryEvents || [],
    preferences: data.preferences || {}
  };
}

export async function saveDecision(decision: DecisionResult): Promise<void> {
  const data = await getStorageData();
  data.decisions.push(decision);
  await set(STORAGE_KEY, data);
}

export async function getDecisionHistory(): Promise<DecisionResult[]> {
  const data = await getStorageData();
  return data.decisions;
}

export async function saveAffiliateClick(event: AffiliateClickEvent): Promise<void> {
  const data = await getStorageData();
  data.affiliateClicks.push(event);

  const MAX_CLICK_HISTORY = 200;
  if (data.affiliateClicks.length > MAX_CLICK_HISTORY) {
    data.affiliateClicks = data.affiliateClicks.slice(-MAX_CLICK_HISTORY);
  }

  await set(STORAGE_KEY, data);
}

export async function getAffiliateClicks(): Promise<AffiliateClickEvent[]> {
  const data = await getStorageData();
  return data.affiliateClicks;
}

export async function saveTelemetryEvent(event: TelemetryEvent): Promise<void> {
  const data = await getStorageData();
  data.telemetryEvents.push(event);

  const MAX_TELEMETRY_HISTORY = 300;
  if (data.telemetryEvents.length > MAX_TELEMETRY_HISTORY) {
    data.telemetryEvents = data.telemetryEvents.slice(-MAX_TELEMETRY_HISTORY);
  }

  await set(STORAGE_KEY, data);
}

export async function getTelemetryEvents(): Promise<TelemetryEvent[]> {
  const data = await getStorageData();
  return data.telemetryEvents;
}

export async function savePreferences(preferences: UserPreferences): Promise<void> {
  const data = await getStorageData();
  data.preferences = preferences;
  await set(STORAGE_KEY, data);
}

export async function getPreferences(): Promise<UserPreferences> {
  const data = await getStorageData();
  return data.preferences || {};
}

export async function clearStorage(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.clear(() => {
      resolve();
    });
  });
}