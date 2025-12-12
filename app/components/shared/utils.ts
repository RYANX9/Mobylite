// components/shared/utils.ts

import { API_BASE } from './constants';

export const cleanHTMLText = (text: string): string => {
  if (!text) return '';
  
  let cleaned = String(text);
  cleaned = cleaned.replace(/<br\s*\/?>/gi, ' • ');
  cleaned = cleaned.replace(/<sup>([^<]*)<\/sup>/gi, '$1');
  cleaned = cleaned.replace(/<a[^>]*>([^<]*)<\/a>/gi, '$1');
  cleaned = cleaned.replace(/<[^>]+>/g, '');
  cleaned = cleaned.replace(/&nbsp;/g, ' ');
  cleaned = cleaned.replace(/&amp;/g, '&');
  cleaned = cleaned.replace(/&lt;/g, '<');
  cleaned = cleaned.replace(/&gt;/g, '>');
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.trim();
  
  return cleaned;
};

export const isNewRelease = (phone: Phone): boolean => {
  if (!phone.release_year) return false;
  const y = phone.release_year;
  const m = phone.release_month ?? 1;
  const d = phone.release_day ?? 1;
  const release = new Date(y, m - 1, d);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 60);
  return release >= cutoff;
};

export const buildSearchURL = (
  filters: Filters,
  sortBy: string,
  sortOrder: string,
  searchQuery: string,
  pageSize: number = 100
): string => {
  let url = `${API_BASE}/phones/search?page=1&page_size=${pageSize}&sort_by=${sortBy}&sort_order=${sortOrder}`;

  if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;
  if (filters.min_price) url += `&min_price=${filters.min_price}`;
  if (filters.max_price) url += `&max_price=${filters.max_price}`;
  if (filters.min_ram) url += `&min_ram=${filters.min_ram}`;
  if (filters.min_battery) url += `&min_battery=${filters.min_battery}`;
  if (filters.min_camera_mp) url += `&min_camera_mp=${filters.min_camera_mp}`;
  if (filters.min_year) url += `&min_year=${filters.min_year}`;
  if (filters.min_storage) url += `&min_storage=${filters.min_storage}`;
  if (filters.screen_size) url += `&screen_size=${filters.screen_size}`;
  if (filters.os) url += `&os=${encodeURIComponent(filters.os)}`;
  if (filters.has_5g === true) url += `&has_5g=true`;
  
  if (filters.brands && filters.brands.length > 0) {
    filters.brands.forEach(brand => {
      url += `&brand=${encodeURIComponent(brand)}`;
    });
  }

  return url;
};

/* --------------------------------------------------
   Review & Also-Compared helpers (mock JSON)
-------------------------------------------------- */

import { Review, AlsoComparedResponse } from './types';
import { MOCK_REVIEWS_URL, MOCK_ALSO_COMPARED_URL } from './constants';

/* 1.  GET all reviews for one phone  */
export async function fetchReviews(phoneId: string): Promise<Review[]> {
  const all = (await fetch(MOCK_REVIEWS_URL).then(r => r.json())) as Review[];
  return all.filter(r => r.phoneId === phoneId);
}

/* 2.  POST a new review (mock: just write to console)  */
export async function postReview(
  phoneId: string,
  payload: Omit<Review, 'id' | 'createdAt'>
): Promise<Review> {
  const newReview: Review = {
    ...payload,
    id: `r_${Date.now()}`,               // fake id
    createdAt: new Date().toISOString(),
  };
  // TODO: real endpoint later
  console.log('[mock] posted review:', newReview);
  return newReview;
}

/* 3.  GET 4 phone ids that users compared with this one  */
export async function fetchAlsoCompared(phoneId: string): Promise<string[]> {
  const map = (await fetch(MOCK_ALSO_COMPARED_URL).then(r =>
    r.json()
  )) as Record<string, string[]>;
  return map[phoneId] ?? [];
}