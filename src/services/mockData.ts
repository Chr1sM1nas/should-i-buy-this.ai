import { ProductData, SponsoredDeal } from '../types';

export const mockProducts: ProductData[] = [
  {
    title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
    price: 279.99,
    originalPrice: 349.99,
    rating: 4.7,
    inStock: true,
    url: 'https://www.amazon.com/dp/B09XS7JWHH',
    source: 'amazon',
    asin: 'B09XS7JWHH',
  },
  {
    title: 'Apple AirPods Pro (2nd generation)',
    price: 199.0,
    originalPrice: 249.0,
    rating: 4.4,
    inStock: true,
    url: 'https://www.amazon.com/dp/B0BDHWDR12',
    source: 'amazon',
    asin: 'B0BDHWDR12',
  },
  {
    title: 'Cheap Knockoff Headphones',
    price: 12.99,
    rating: 2.1,
    inStock: true,
    url: 'https://www.amazon.com/dp/B00EXAMPLE',
    source: 'amazon',
  },
];

export const mockSponsoredDeals: SponsoredDeal[] = [
  {
    id: 'sponsored-1',
    productTitle: 'Bose QuietComfort 45 Headphones',
    productUrl: 'https://www.amazon.com/dp/B098FKXT8L',
    brand: 'Bose',
    badge: 'Sponsored Deal',
    tooltip: 'This product is featured by Bose. We may earn a commission.',
    campaignId: 'bose-q45-2024',
    impressions: 0,
    clicks: 0,
    active: true,
    relevantCategories: ['headphones', 'audio', 'electronics'],
  },
  {
    id: 'sponsored-2',
    productTitle: 'Anker PowerCore 26800 Portable Charger',
    productUrl: 'https://www.amazon.com/dp/B01JIWQPMW',
    brand: 'Anker',
    badge: 'Partner Deal',
    tooltip: 'This product is featured by Anker. We may earn a commission.',
    campaignId: 'anker-powercore-2024',
    impressions: 0,
    clicks: 0,
    active: true,
    relevantCategories: ['charger', 'accessories', 'electronics'],
  },
];
