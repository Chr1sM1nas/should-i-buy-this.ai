/**
 * Minimal chrome extension API mock for the UI preview page.
 * This allows extension components (ActionButtons, PremiumTier, etc.)
 * to work in a regular browser tab without the extension runtime.
 */

const storage: Record<string, unknown> = {};

const chromeMock = {
  tabs: {
    create: (opts: { url: string }) => {
      window.open(opts.url, '_blank', 'noopener,noreferrer');
      return Promise.resolve({ id: 1 });
    },
    query: (
      _queryInfo: unknown,
      callback?: (tabs: { id: number; url: string }[]) => void,
    ) => {
      const tab = { id: 1, url: 'https://www.amazon.com/dp/B09XS7JWHH' };
      if (callback) callback([tab]);
      return Promise.resolve([tab]);
    },
    sendMessage: (
      _tabId: number,
      _message: unknown,
      callback?: (response: { success: boolean }) => void,
    ) => {
      if (callback) callback({ success: false });
    },
  },
  storage: {
    local: {
      get: (
        _keys: unknown,
        callback?: (result: Record<string, unknown>) => void,
      ) => {
        if (callback) callback(storage);
        return Promise.resolve(storage);
      },
      set: (items: Record<string, unknown>, callback?: () => void) => {
        Object.assign(storage, items);
        if (callback) callback();
        return Promise.resolve();
      },
    },
    sync: {
      get: (
        _keys: unknown,
        callback?: (result: Record<string, unknown>) => void,
      ) => {
        if (callback) callback(storage);
        return Promise.resolve(storage);
      },
      set: (items: Record<string, unknown>, callback?: () => void) => {
        Object.assign(storage, items);
        if (callback) callback();
        return Promise.resolve();
      },
    },
  },
  runtime: {
    lastError: null as null | { message: string },
    sendMessage: (
      _message: unknown,
      callback?: (response: unknown) => void,
    ) => {
      if (callback) callback({ success: false });
      return Promise.resolve({ success: false });
    },
    onMessage: {
      addListener: () => {},
      removeListener: () => {},
    },
  },
};

// @ts-expect-error — browser extension API mock for the dev preview page
window.chrome = chromeMock;
