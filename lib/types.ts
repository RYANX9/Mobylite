export interface Phone {
  id: number
  model_name: string
  brand: string
  price_usd: number | null
  main_image_url: string | null
  screen_size: number | null
  battery_capacity: number | null
  ram_options: number[] | null
  storage_options: number[] | null
  main_camera_mp: number | null
  chipset: string | null
  antutu_score: number | null
  amazon_link: string | null
  release_year: number | null
  release_month: number | null
  release_day: number | null
  release_date_full: string | null
  // Detail-only fields — null on list endpoints
  price_original: number | null
  currency: string | null
  brand_link: string | null
  weight_g: number | null
  thickness_mm: number | null
  screen_resolution: string | null
  fast_charging_w: number | null
  video_resolution: string | null
  geekbench_multi: number | null
  gpu_score: number | null
  full_specifications: FullSpecifications | null
  features: string[] | null
}

export interface FullSpecifications {
  specifications: Record<string, Record<string, string>>
  quick_specs: QuickSpecs
}

export interface QuickSpecs {
  displaytype?: string
  internalmemory?: string
  cam1modules?: string
  cam2modules?: string
  wlan?: string
  models?: string
  featuresother?: string
}

// Kept for backward compat — Phone already includes all these fields
export interface PhoneDetail extends Phone {}

export interface SearchResponse {
  total: number
  page: number
  page_size: number
  results: Phone[]
}

export interface User {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  created_at: string
}

// Fixed: removed duplicate keys (verified_owner, is_visible, created_at appeared twice)
export interface Review {
  id: string
  user_id: string
  phone_id: number
  rating: number
  title: string
  body: string
  pros: string[] | null
  cons: string[] | null
  verified_owner: boolean
  is_owner: boolean
  is_visible: boolean
  helpful_count: number
  created_at: string
  updated_at: string
  edited_at?: string
  display_name?: string
  avatar_url?: string | null
}

export interface UpdateReviewData {
  rating?: number
  title?: string
  body?: string
  is_owner?: boolean
}

export interface Favorite {
  id: string
  user_id: string
  phone_id: number
  notes: string | null
  created_at: string
  phone?: Phone
}

export interface PriceAlert {
  id: string
  user_id: string
  phone_id: number
  target_price: number
  current_price: number | null
  is_active: boolean
  notified_at: string | null
  created_at: string
}

export interface FilterStats {
  total_phones: number
  total_brands: number
  brands: { brand: string; count: number }[]
  price_range: {
    min_price: number
    max_price: number
    avg_price?: number
  }
  ram_options: number[]
  battery_range: {
    min_battery: number
    max_battery: number
  }
  release_years: number[]
}

export interface SearchFilters {
  q?: string
  min_price?: number
  max_price?: number
  min_ram?: number
  min_storage?: number
  min_battery?: number
  min_screen_size?: number
  min_camera_mp?: number
  brand?: string
  min_year?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  page?: number
  page_size?: number
}

export type RecommendationType =
  | 'gamer'
  | 'photographer'
  | 'budget'
  | 'flagship'
  | 'battery'
  | 'performance'
  | 'balanced'

export interface QuizAnswer {
  questionId: number
  answerId: string
}

export interface Filters extends SearchFilters {
  brands?: string[]
  has_5g?: boolean
  screen_size?: string | null
  comparison?: string | null
  os?: string | null
}

export interface ExtendedFilters extends Filters {
  brands?: string[]
  has_5g?: boolean
  screen_size?: string | null
  comparison?: string | null
}

export interface PhoneStats {
  average_rating: number
  total_reviews: number
  total_favorites: number
  total_owners: number
  rating_distribution: Record<string, number>
  verified_owners_percentage: number
}

// New types added — were missing and caused implicit any in several components
export interface AlsoComparedResponse {
  success: boolean
  phones: Phone[]
  comparisonCounts: Record<number, number>
}

export interface PhoneStatsResponse {
  success: boolean
  stats: PhoneStats
}

export interface RecommendationResponse {
  recommendations: Phone[]
  use_case: string
  count: number
}
