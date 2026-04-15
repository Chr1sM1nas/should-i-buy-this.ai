import { ProductData } from '../types';

export const mockProducts: ProductData[] = [
  {
    title: 'Sony WH-1000XM4 Wireless Headphones',
    price: 348,
    originalPrice: 399,
    rating: 4.7,
    reviewCount: 2847,
    url: 'https://www.amazon.com/Sony-WH1000XM4-Wireless-Headphones-Noise/dp/B0863TXGM3',
    imageUrl: 'https://m.media-amazon.com/images/I/61D14WFp36L._AC_SY879_.jpg',
    description: 'Industry-leading noise canceling with premium sound quality',
    inStock: true,
    category: 'Electronics'
  },
  {
    title: 'Anker PowerCore 26800mAh Power Bank',
    price: 39.99,
    originalPrice: 49.99,
    rating: 4.6,
    reviewCount: 5234,
    url: 'https://www.amazon.com/Anker-PowerCore-26800mAh-Portable-Charger/dp/B00CFHZWCU',
    imageUrl: 'https://m.media-amazon.com/images/I/61Mr8L-8-ML._AC_SY879_.jpg',
    description: 'High capacity power bank with fast charging',
    inStock: true,
    category: 'Electronics'
  },
  {
    title: 'Instant Pot Duo 7-in-1 Electric Pressure Cooker',
    price: 79.95,
    originalPrice: 99.95,
    rating: 4.5,
    reviewCount: 8923,
    url: 'https://www.amazon.com/Instant-Pot-Duo-Electric-Pressure/dp/B00IGUWYAU',
    imageUrl: 'https://m.media-amazon.com/images/I/71RXIp44nWL._AC_SY879_.jpg',
    description: 'Versatile multi-cooker for quick meal preparation',
    inStock: true,
    category: 'Kitchen'
  }
];

export function getProductsByCategory(category: string): ProductData[] {
  return mockProducts.filter(product => product.category === category);
}

export function searchProducts(query: string): ProductData[] {
  const lowerQuery = query.toLowerCase();
  return mockProducts.filter(product =>
    product.title.toLowerCase().includes(lowerQuery) ||
    product.description?.toLowerCase().includes(lowerQuery)
  );
}