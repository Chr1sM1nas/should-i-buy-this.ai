import type { ProductData } from './types';

declare global {
  interface Window {
    __productData?: ProductData;
  }
}

export {};