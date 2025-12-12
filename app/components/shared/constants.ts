// components/shared/constants.ts
import { Zap, Camera, DollarSign, Battery, Trophy } from 'lucide-react';

export const API_BASE = 'https://renderphones.onrender.com';

/* ----------  MOCK JSON PATHS UNTIL REAL API ---------- */
export const MOCK_REVIEWS_URL      = '/mocks/reviews.json';
export const MOCK_ALSO_COMPARED_URL = '/mocks/alsoCompared.json';

export const RECOMMENDATIONS: Recommendation[] = [
  { id: 'gamer', label: 'Gaming', icon: Zap, desc: 'High performance & fast graphics' },
  { id: 'photographer', label: 'Photography', icon: Camera, desc: 'Best camera quality' },
  { id: 'budget', label: 'Budget', icon: DollarSign, desc: 'Best value for money' },
  { id: 'battery', label: 'Battery Life', icon: Battery, desc: 'Long-lasting power' },
  { id: 'flagship', label: 'Flagship', icon: Trophy, desc: 'Premium features' },
];

export const INITIAL_FILTERS: Filters = {
  min_price: null,
  max_price: null,
  min_ram: null,
  min_battery: null,
  min_camera_mp: null,
  min_year: null,
  brands: [],
  has_5g: null,
  min_storage: null,
  screen_size: null,
  os: null,
};

