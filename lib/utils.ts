import { STORAGE_KEYS } from './config';
import type { Phone } from './types';

export function formatPrice(price: number | null | undefined): string {
  if (!price) return 'N/A';
  return `$${price.toLocaleString()}`;
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

export function formatReleaseDate(year: number | null, month: number | null, day: number | null): string {
  if (!year) return 'N/A';
  if (!month) return String(year);
  if (!day) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[month - 1]} ${year}`;
  }
  return `${day}/${month}/${year}`;
}

export function formatRAM(ramOptions: number[] | null | undefined): string {
  if (!ramOptions || ramOptions.length === 0) return 'N/A';
  return ramOptions.map(r => `${r}GB`).join(', ');
}

export function formatStorage(storageOptions: number[] | null | undefined): string {
  if (!storageOptions || storageOptions.length === 0) return 'N/A';
  return storageOptions.map(s => s >= 1000 ? `${s / 1000}TB` : `${s}GB`).join(', ');
}

export function formatBattery(capacity: number | null | undefined): string {
  if (!capacity) return 'N/A';
  return `${capacity.toLocaleString()} mAh`;
}

export function formatScreenSize(size: number | null | undefined): string {
  if (!size) return 'N/A';
  return `${size}"`;
}

export function formatWeight(weight: number | null | undefined): string {
  if (!weight) return 'N/A';
  return `${weight}g`;
}

export function formatCamera(mp: number | null | undefined): string {
  if (!mp) return 'N/A';
  return `${mp}MP`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function getPhoneSlug(phone: Phone): { brand: string; model: string } {
  return {
    brand: slugify(phone.brand),
    model: slugify(phone.model_name),
  };
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

export function getCompareList(): number[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEYS.compareList);
  return stored ? JSON.parse(stored) : [];
}

export function addToCompare(phoneId: number): boolean {
  const list = getCompareList();
  if (list.length >= 4) return false;
  if (list.includes(phoneId)) return false;
  list.push(phoneId);
  localStorage.setItem(STORAGE_KEYS.compareList, JSON.stringify(list));
  return true;
}

export function removeFromCompare(phoneId: number): void {
  const list = getCompareList();
  const filtered = list.filter(id => id !== phoneId);
  localStorage.setItem(STORAGE_KEYS.compareList, JSON.stringify(filtered));
}

export function clearCompareList(): void {
  localStorage.removeItem(STORAGE_KEYS.compareList);
}

export function isInCompareList(phoneId: number): boolean {
  return getCompareList().includes(phoneId);
}

export function saveRecentSearch(query: string): void {
  if (typeof window === 'undefined' || !query.trim()) return;
  const stored = localStorage.getItem(STORAGE_KEYS.recentSearches);
  const searches: string[] = stored ? JSON.parse(stored) : [];
  
  const filtered = searches.filter(s => s !== query);
  filtered.unshift(query);
  
  const limited = filtered.slice(0, 10);
  localStorage.setItem(STORAGE_KEYS.recentSearches, JSON.stringify(limited));
}

export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEYS.recentSearches);
  return stored ? JSON.parse(stored) : [];
}

export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.recentSearches);
}

export function calculatePerformanceScore(phone: Phone): number {
  let score = 0;
  if (phone.antutu_score) score += phone.antutu_score / 1000;
  if (phone.ram_options) score += Math.max(...phone.ram_options) * 5;
  if (phone.battery_capacity) score += phone.battery_capacity / 100;
  return Math.round(score);
}

export function getPhoneHighlight(phone: Phone): string {
  if (phone.antutu_score && phone.antutu_score > 800000) return 'Performance Beast';
  if (phone.battery_capacity && phone.battery_capacity > 5000) return 'Battery Champion';
  if (phone.main_camera_mp && phone.main_camera_mp >= 108) return 'Camera Pro';
  if (phone.price_usd && phone.price_usd < 300) return 'Budget Friendly';
  if (phone.price_usd && phone.price_usd > 1000) return 'Flagship';
  return 'Great Choice';
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Add this function to lib/utils.ts
export function cleanHTMLText(text: string | null | undefined): string {
  if (!text) return 'N/A';
  return String(text)
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

// Add this function to lib/utils.ts
export function isNewRelease(phone: Phone): boolean {
  if (!phone.release_year) return false;
  const currentYear = new Date().getFullYear();
  return phone.release_year >= currentYear - 1;
}