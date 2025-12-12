// lib/config.ts
import { Zap, Camera, Battery, Trophy, DollarSign, Settings } from 'lucide-react';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://renderphones.onrender.com";

export const API_ENDPOINTS = {
  auth: {
    signup: "/auth/signup",
    login: "/auth/login",
    me: "/auth/me",
  },
  phones: {
    search: "/phones/search",
    detail: (id: number) => `/phones/${id}`,
    latest: "/phones/latest",
    recommend: "/phones/recommend",
    compare: "/phones/compare",
    stats: (id: number) => `/phones/${id}/stats`,
    alsoCompared: (id: number) => `/phones/${id}/also-compared`,
  },
  reviews: {
    base: "/reviews",
    byPhone: (phoneId: number) => `/reviews/phone/${phoneId}`,
    byUser: "/reviews/user",
    create: "/reviews",
  },
  favorites: {
    list: "/favorites",
    add: "/favorites",
    remove: (phoneId: number) => `/favorites/${phoneId}`,
  },
  priceAlerts: {
    list: "/price-alerts",
    create: "/price-alerts",
    delete: (alertId: string) => `/price-alerts/${alertId}`,
  },
  filters: {
    stats: "/filters/stats",
  },
} as const;

// ✅ FIXED: Simple type for slug function
export const createPhoneSlug = (phone: { brand: string; model_name: string }) => {
  return phone.model_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const parsePhoneSlug = (slug: string): string => {
  return slug.split('-').join(' ');
};

export const APP_ROUTES = {
  home: "/",
  login: "/login",
  account: "/account",
  accountFavorites: "/account#favorites",
  accountReviews: "/account#reviews",
  accountAlerts: "/account#alerts",
  accountComparisons: "/account#comparisons",
  accountSettings: "/account#settings",
  phoneDetail: (brand: string, model: string) => `/${brand}/${model}`,
  compare: (phoneSlugs: string[]) => `/compare/${phoneSlugs.join("-vs-")}`,
} as const;

export const STORAGE_KEYS = {
  authToken: "mobylite_auth_token",
  compareList: "mobylite_compare_list",
  recentSearches: "mobylite_recent_searches",
  userId: "mobylite_user_id",
} as const;

export const APP_CONFIG = {
  name: "Mobylite",
  description: "Find and compare the best phones",
  maxComparePhones: 4,
  reviewsPerPage: 10,
  phonesPerPage: 20,
} as const;

export const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "What's your primary use for your phone?",
    options: [
      { id: "gaming", label: "Gaming" },
      { id: "photography", label: "Photography" },
      { id: "business", label: "Business & Productivity" },
      { id: "social", label: "Social Media" },
      { id: "balanced", label: "A bit of everything" },
    ],
  },
  {
    id: 2,
    question: "What's your budget?",
    options: [
      { id: "budget", label: "Under $300" },
      { id: "mid", label: "$300 - $600" },
      { id: "premium", label: "$600 - $1000" },
      { id: "flagship", label: "Over $1000" },
    ],
  },
  {
    id: 3,
    question: "What matters most to you?",
    options: [
      { id: "performance", label: "Speed & Performance" },
      { id: "camera", label: "Camera Quality" },
      { id: "battery", label: "Battery Life" },
      { id: "screen", label: "Display Quality" },
      { id: "brand", label: "Brand Reputation" },
    ],
  },
] as const;

export const RECOMMENDATION_CATEGORIES = {
  gamer: {
    title: "Gaming Phones",
    description: "High performance with great cooling",
    icon: Zap,
  },
  photographer: {
    title: "Camera Phones",
    description: "Best camera systems",
    icon: Camera,
  },
  budget: {
    title: "Budget Phones",
    description: "Best value for money",
    icon: DollarSign,
  },
  flagship: {
    title: "Flagship Phones",
    description: "Premium phones",
    icon: Trophy,
  },
} as const;

export const BRANDS = [
  "Apple", "Samsung", "Google", "OnePlus", "Xiaomi", "OPPO", "Vivo",
  "Realme", "Nothing", "Motorola", "Sony", "ASUS", "Huawei", "Honor",
  "ZTE", "Tecno", "Infinix", "Itel",
] as const;

export const SORT_OPTIONS = [
  { value: "release_year", label: "Newest First" },
  { value: "price_usd", label: "Price: Low to High" },
  { value: "battery_capacity", label: "Battery Capacity" },
  { value: "main_camera_mp", label: "Camera MP" },
  { value: "antutu_score", label: "Performance Score" },
] as const;

