import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { APP_ROUTES, createPhoneSlug } from './config'
import type { Phone } from './types'

const RETURN_URL_KEY = 'mobylite_return_url'

export function saveReturnUrl(url?: string): void {
  if (typeof window === 'undefined') return
  const target = url ?? window.location.pathname + window.location.search + window.location.hash
  sessionStorage.setItem(RETURN_URL_KEY, target)
}

export function consumeReturnUrl(fallback = APP_ROUTES.home): string {
  if (typeof window === 'undefined') return fallback
  const stored = sessionStorage.getItem(RETURN_URL_KEY)
  sessionStorage.removeItem(RETURN_URL_KEY)
  return stored || fallback
}

export function navigateToLogin(router: AppRouterInstance): void {
  saveReturnUrl()
  router.push(APP_ROUTES.login)
}

export function navigateToPhone(router: AppRouterInstance, phone: Phone): void {
  const brand = phone.brand.toLowerCase().replace(/\s+/g, '-')
  const model = createPhoneSlug(phone)
  router.push(APP_ROUTES.phoneDetail(brand, model))
}

export function navigateToCompare(router: AppRouterInstance, phones: Phone[]): void {
  const slugs = phones.map(createPhoneSlug)
  router.push(APP_ROUTES.compare(slugs))
}
