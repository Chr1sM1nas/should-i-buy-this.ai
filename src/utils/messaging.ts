import { Message, MessageResponse } from '../types';

/**
 * Send a message to the background service worker and await a response.
 */
export function sendMessage<T = unknown>(message: Message): Promise<MessageResponse<T>> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response: MessageResponse<T>) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Send a message to a specific tab's content script.
 */
export function sendTabMessage<T = unknown>(
  tabId: number,
  message: Message
): Promise<MessageResponse<T>> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response: MessageResponse<T>) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(response);
      }
    });
  });
}
