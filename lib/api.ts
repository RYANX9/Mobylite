import { API_BASE } from './config'
import type {
  SearchResponse,
  SearchFilters,
  Phone,
  FilterStats,
  CategoryResult,
  BrandStats,
} from './types'

class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'APIError'
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const e = await res.json()
      msg = e.detail || e.message || msg
    } catch {}
    throw new APIError(res.status, msg)
  }
  return res.json()
}

function qs(params: Record<string, unknown>): string {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') p.append(k, String(v))
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const api = {
  phones: {
    search: (filters: SearchFilters) =>
      req<SearchResponse>(`/phones/search${qs(filters as Record<string, unknown>)}`),

    detail: (id: number) =>
      req<Phone>(`/phones/${id}`),

    latest: (limit = 20) =>
      req<{ phones: Phone[] }>(`/phones/latest?limit=${limit}`),

    trending: (limit = 10) =>
      req<{ phones: Phone[] }>(`/phones/trending?limit=${limit}`),

    similar: (id: number, limit = 12) =>
      req<{ phones: Phone[] }>(`/phones/${id}/similar?limit=${limit}`),

    compare: (ids: number[]) =>
      req<{ phones: Phone[] }>(`/phones/compare?ids=${ids.join(',')}`),

    recommend: (params: {
      min_price?: number
      max_price?: number
      priorities: string
      limit?: number
    }) => req<{ phones: Phone[]; priorities: string[] }>(`/phones/recommend${qs(params as Record<string, unknown>)}`),
  },

  brands: {
    list: () =>
      req<{ brands: { brand: string; count: number }[] }>('/brands'),

    stats: (slug: string) =>
      req<BrandStats>(`/brands/${slug}`),

    phones: (slug: string, filters: SearchFilters) =>
      req<SearchResponse>(`/brands/${slug}/phones${qs(filters as Record<string, unknown>)}`),
  },

  categories: {
    list: () =>
      req<{ categories: { slug: string; title: string; description: string }[] }>('/categories'),

    get: (slug: string, limit = 10) =>
      req<CategoryResult>(`/categories/${slug}?limit=${limit}`),
  },

  filters: {
    stats: () => req<FilterStats>('/filters/stats'),
  },
}
