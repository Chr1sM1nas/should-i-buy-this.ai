import type { DecisionResult } from '../types';

export interface Message {
  type: string;
  payload?: any;
}

export interface MessageResponse {
  success: boolean;
  data?: any;
  decision?: DecisionResult;
  error?: string;
}

export function sendToBackground(message: Message): Promise<MessageResponse> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: MessageResponse) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

export function sendToContent(tabId: number, message: Message): Promise<MessageResponse> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response: MessageResponse) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

export function onMessage(
  callback: (message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response: MessageResponse) => void) => void
): void {
  chrome.runtime.onMessage.addListener(callback);
}