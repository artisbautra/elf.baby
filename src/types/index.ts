export interface Product {
  id: string;
  slug?: string;
  title: string;
  price: number;
  price_discount?: number;
  originalPrice?: number;
  image: string;
  category: string;
  ageGroup: string;
  isNew?: boolean;
  rating?: number;
  description?: string;
}

export const CATEGORIES = [
  { id: 'all', label: 'All Gifts' },
  { id: 'toys', label: 'Toys' },
  { id: 'clothing', label: 'Clothing' },
  { id: 'nursery', label: 'Nursery' },
  { id: 'mom', label: 'For Mom' },
  { id: 'dad', label: 'For Dad' },
];

export const AGE_GROUPS = [
  { id: 'all', label: 'All Ages' },
  { id: '0-12m', label: '0-12 Months' },
  { id: '1-3y', label: '1-3 Years' },
  { id: '3-5y', label: '3-5 Years' },
  { id: '5-12y', label: '5-12 Years' },
  { id: 'adults', label: 'Adults' },
];
