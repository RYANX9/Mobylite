'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Heart, Star, Bell, History, Settings, LogOut, User, Loader2, X, ArrowLeft, Smartphone } from 'lucide-react'
import { ButtonPressFeedback } from '../components/shared/ButtonPressFeedback'
import { useAuth } from '@/lib/auth-context'
import { APP_ROUTES } from '@/lib/config'
import { color, font } from '@/lib/tokens'
import type { Favorite } from '@/lib/types'
import { api } from '@/lib/api'
import { ReviewCard } from '../components/shared/ReviewCard'

const VALID_TABS = ['favorites', 'reviews', 'alerts', 'comparisons', 'settings'] as const
type Tab = typeof VALID_TABS[number]

function AccountContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading, logout } = useAuth()

  const rawTab = searchParams.get('tab') as Tab | null
  const activeSection: Tab = rawTab && VALID_TABS.includes(rawTab) ? rawTab : 'favorites'

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(APP_ROUTES.login)
    }
  }, [user, authLoading, router])

  const setActiveSection = (section: Tab) => {
    router.push(`/account?tab=${section}`, { scroll: false })
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: color.bg }}>
        <Loader2 size={32} style={{ color: color.textMuted }} className="animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen" style={{ backgroundColor: color.bg }}>
      {/* Top nav */}
      <div className="sticky top-0 z-40 border-b" style={{ backgroundColor: color.bg, borderColor: color.borderLight }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ButtonPressFeedback
                onClick={() => router.push(APP_ROUTES.home)}
                className="flex items-center gap-2 hover:opacity-70 transition-opacity"
              >
                <ArrowLeft size={20} style={{ color: color.text }} />
                <span className="hidden sm:inline text-sm font-semibold" style={{ color: color.text }}>Back to Home</span>
              </ButtonPressFeedback>

              <div className="h-6 w-px" style={{ backgroundColor: color.borderLight }} />

              <div className="flex items-center gap-3">
                <img src="/logo.svg" alt="Mobylite" className="w-8 h-8" />
                <h1 className="text-xl font-bold hidden sm:inline" style={{ fontFamily: font.primary, color: color.text }}>
                  Mobylite
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.display_name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: color.borderLight }}>
                  <User size={20} style={{ color: color.textMuted }} />
                </div>
              )}
              <div className="hidden md:block">
                <p className="font-bold text-sm" style={{ color: color.text }}>{user.display_name}</p>
                <p className="text-xs" style={{ color: color.textMuted }}>{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="grid grid-cols-4 gap-8">
            <div className="col-span-1">
              <div className="rounded-3xl p-6 sticky top-24 shadow-md" style={{ backgroundColor: color.bg }}>
                <nav className="space-y-1 mb-6">
                  {VALID_TABS.filter((t) => t !== 'settings').map((tab) => (
                    <NavItem
                      key={tab}
                      id={tab}
                      label={TAB_LABELS[tab]}
                      icon={TAB_ICONS[tab]}
                      active={activeSection === tab}
                      onClick={setActiveSection}
                    />
                  ))}
                  <NavItem
                    id="settings"
                    label="Settings"
                    icon={<Settings size={20} />}
                    active={activeSection === 'settings'}
                    onClick={setActiveSection}
                  />
                </nav>

                <ButtonPressFeedback
                  onClick={() => { logout(); router.replace(APP_ROUTES.login) }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                  style={{ color: color.danger }}
                >
                  <LogOut size={20} />
                  <span className="text-sm font-semibold">Sign Out</span>
                </ButtonPressFeedback>
              </div>
            </div>

            <div className="col-span-3">
              {activeSection === 'favorites' && <FavoritesSection />}
              {activeSection === 'reviews' && <ReviewsSection />}
              {activeSection === 'alerts' && <AlertsSection />}
              {activeSection === 'comparisons' && <ComparisonsSection />}
              {activeSection === 'settings' && <SettingsSection user={user} />}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="lg:hidden">
        <div className="sticky top-[73px] z-30 border-b" style={{ backgroundColor: color.bg, borderColor: color.borderLight }}>
          <div className="px-4 py-3 flex gap-2 overflow-x-auto">
            {VALID_TABS.map((tab) => (
              <TabButton
                key={tab}
                id={tab}
                label={TAB_LABELS[tab]}
                active={activeSection === tab}
                onClick={setActiveSection}
              />
            ))}
          </div>
        </div>

        <div className="p-4">
          {activeSection === 'favorites' && <FavoritesSection />}
          {activeSection === 'reviews' && <ReviewsSection />}
          {activeSection === 'alerts' && <AlertsSection />}
          {activeSection === 'comparisons' && <ComparisonsSection />}
          {activeSection === 'settings' && <SettingsSection user={user} />}
        </div>
      </div>
    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: color.bg }}>
        <Loader2 size={32} style={{ color: color.textMuted }} className="animate-spin" />
      </div>
    }>
      <AccountContent />
    </Suspense>
  )
}

const TAB_LABELS: Record<Tab, string> = {
  favorites: 'Favorites',
  reviews: 'Reviews',
  alerts: 'Alerts',
  comparisons: 'History',
  settings: 'Settings',
}

const TAB_ICONS: Record<Tab, React.ReactNode> = {
  favorites: <Heart size={20} />,
  reviews: <Star size={20} />,
  alerts: <Bell size={20} />,
  comparisons: <History size={20} />,
  settings: <Settings size={20} />,
}

const NavItem = ({ id, label, icon, active, onClick }: {
  id: Tab; label: string; icon: React.ReactNode; active: boolean; onClick: (id: Tab) => void
}) => (
  <ButtonPressFeedback
    onClick={() => onClick(id)}
    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full"
    style={{ backgroundColor: active ? color.text : 'transparent', color: active ? color.bg : color.text }}
    hoverStyle={{ backgroundColor: !active ? color.borderLight : color.text }}
  >
    <div className="w-5 h-5">{icon}</div>
    <span className="text-sm font-semibold">{label}</span>
  </ButtonPressFeedback>
)

const TabButton = ({ id, label, active, onClick }: {
  id: Tab; label: string; active: boolean; onClick: (id: Tab) => void
}) => (
  <button
    onClick={() => onClick(id)}
    className="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all"
    style={{ backgroundColor: active ? color.text : color.borderLight, color: active ? color.bg : color.textMuted }}
  >
    {label}
  </button>
)

function FavoritesSection() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const data = await api.favorites.list()
      setFavorites(data.favorites || [])
    } catch (err) {
      console.error('Failed to load favorites:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (phoneId: number) => {
    // Optimistic
    setFavorites((prev) => prev.filter((f) => f.phone_id !== phoneId))
    try {
      await api.favorites.remove(phoneId)
    } catch {
      load() // revert on failure
    }
  }

  const toPhone = (phone: any) => {
    if (!phone) return
    const brand = phone.brand.toLowerCase().replace(/\s+/g, '-')
    const model = phone.model_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    router.push(`/${brand}/${model}`)
  }

  if (loading) return <SectionSkeleton />
  if (favorites.length === 0) {
    return <EmptyState icon={<Heart size={48} />} title="No favorites yet" description="Start adding phones you love!" />
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-1" style={{ color: color.text }}>My Favorites</h2>
        <p className="text-sm" style={{ color: color.textMuted }}>{favorites.length} phone{favorites.length !== 1 ? 's' : ''} saved</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {favorites.map((fav) => (
          <div
            key={fav.phone_id}
            className="flex-shrink-0 w-64 rounded-3xl overflow-hidden shadow-md"
            style={{ backgroundColor: color.bg, border: `1px solid ${color.borderLight}` }}
          >
            <ButtonPressFeedback onClick={() => toPhone(fav.phone)} className="w-full">
              <div className="w-full h-48 flex items-center justify-center p-6" style={{ backgroundColor: color.borderLight }}>
                {fav.phone?.main_image_url ? (
                  <img src={fav.phone.main_image_url} alt={fav.phone.model_name} className="w-full h-full object-contain" />
                ) : (
                  <Smartphone size={48} style={{ color: color.textLight }} />
                )}
              </div>
              <div className="p-4">
                <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: color.textMuted }}>{fav.phone?.brand}</p>
                <p className="font-bold text-base leading-tight mb-3 line-clamp-2 min-h-[48px]" style={{ color: color.text }}>{fav.phone?.model_name}</p>
                {fav.phone?.price_usd && (
                  <p className="text-xl font-bold" style={{ color: color.text }}>${fav.phone.price_usd}</p>
                )}
              </div>
            </ButtonPressFeedback>
            <div className="px-4 pb-4">
              <ButtonPressFeedback
                onClick={() => handleRemove(fav.phone_id)}
                className="w-full py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
                style={{ backgroundColor: color.dangerBg, color: color.danger }}
              >
                <Heart size={16} fill="currentColor" />
                Remove
              </ButtonPressFeedback>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReviewsSection() {
  const router = useRouter()
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const data = await api.reviews.getByUser()
      const base = data.reviews || []
      const withPhones = await Promise.all(
        base.map(async (r: any) => {
          try {
            const phone = await api.phones.getDetails(r.phone_id)
            return { ...r, phone }
          } catch {
            return r
          }
        })
      )
      setReviews(withPhones)
    } catch (err) {
      console.error('Failed to load reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  const toPhone = (phone: any) => {
    if (!phone) return
    const brand = phone.brand.toLowerCase().replace(/\s+/g, '-')
    const model = phone.model_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    router.push(`/${brand}/${model}`)
  }

  if (loading) return <SectionSkeleton />
  if (reviews.length === 0) {
    return <EmptyState icon={<Star size={48} />} title="No reviews yet" description="Share your experience with phones!" />
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-1" style={{ color: color.text }}>My Reviews</h2>
        <p className="text-sm" style={{ color: color.textMuted }}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-3xl p-6 shadow-md" style={{ backgroundColor: color.bg, border: `1px solid ${color.borderLight}` }}>
            {review.phone && (
              <ButtonPressFeedback
                onClick={() => toPhone(review.phone)}
                className="flex items-center gap-4 mb-4 pb-4 border-b w-full"
                style={{ borderColor: color.borderLight }}
              >
                <div className="w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0" style={{ backgroundColor: color.borderLight }}>
                  {review.phone.main_image_url ? (
                    <img src={review.phone.main_image_url} alt={review.phone.model_name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <Smartphone size={32} style={{ color: color.textLight }} />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: color.textMuted }}>{review.phone.brand}</p>
                  <p className="font-bold text-base" style={{ color: color.text }}>{review.phone.model_name}</p>
                </div>
              </ButtonPressFeedback>
            )}

            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: color.textMuted }}>
                  {new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
                <h4 className="font-bold text-lg" style={{ color: color.text }}>{review.title}</h4>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold" style={{ color: color.text }}>{review.rating.toFixed(1)}</span>
                <Star size={18} fill={color.starFilled} style={{ color: color.starFilled }} />
              </div>
            </div>

            <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: color.textMuted }}>{review.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function AlertsSection() {
  const router = useRouter()
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const data = await api.priceAlerts.list()
      const base = data.alerts || []
      const withPhones = await Promise.all(
        base.map(async (a: any) => {
          try {
            const phone = await api.phones.getDetails(a.phone_id)
            return { ...a, phone }
          } catch {
            return a
          }
        })
      )
      setAlerts(withPhones)
    } catch (err) {
      console.error('Failed to load alerts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (alertId: string) => {
    // Optimistic
    setAlerts((prev) => prev.filter((a) => a.id !== alertId))
    try {
      await api.priceAlerts.delete(alertId)
    } catch {
      load()
    }
  }

  const toPhone = (phone: any) => {
    if (!phone) return
    const brand = phone.brand.toLowerCase().replace(/\s+/g, '-')
    const model = phone.model_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    router.push(`/${brand}/${model}`)
  }

  if (loading) return <SectionSkeleton />
  if (alerts.length === 0) {
    return <EmptyState icon={<Bell size={48} />} title="No alerts set" description="Get notified when prices drop!" />
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-1" style={{ color: color.text }}>Price Alerts</h2>
        <p className="text-sm" style={{ color: color.textMuted }}>{alerts.length} active alert{alerts.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex-shrink-0 w-64 rounded-3xl overflow-hidden shadow-md"
            style={{ backgroundColor: color.bg, border: `1px solid ${color.borderLight}` }}
          >
            <ButtonPressFeedback
              onClick={() => alert.phone && toPhone(alert.phone)}
              className="w-full"
              disabled={!alert.phone}
            >
              <div className="w-full h-48 flex items-center justify-center p-6 relative" style={{ backgroundColor: color.borderLight }}>
                {alert.phone?.main_image_url ? (
                  <img src={alert.phone.main_image_url} alt={alert.phone.model_name} className="w-full h-full object-contain" />
                ) : (
                  <Smartphone size={48} style={{ color: color.textLight }} />
                )}
                <div
                  className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold"
                  style={{ backgroundColor: alert.is_active ? color.success : color.border, color: color.bg }}
                >
                  {alert.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>

              <div className="p-4">
                {alert.phone ? (
                  <>
                    <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: color.textMuted }}>{alert.phone.brand}</p>
                    <p className="font-bold text-base leading-tight mb-3 line-clamp-2 min-h-[48px]" style={{ color: color.text }}>{alert.phone.model_name}</p>
                  </>
                ) : (
                  <p className="font-bold text-base mb-3 min-h-[48px]" style={{ color: color.textMuted }}>Phone unavailable</p>
                )}

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold" style={{ color: color.textMuted }}>Target:</span>
                    <span className="text-lg font-bold" style={{ color: color.success }}>${alert.target_price}</span>
                  </div>
                  {alert.phone?.price_usd && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold" style={{ color: color.textMuted }}>Current:</span>
                      <span className="text-lg font-bold" style={{ color: color.text }}>${alert.phone.price_usd}</span>
                    </div>
                  )}
                </div>
              </div>
            </ButtonPressFeedback>

            <div className="px-4 pb-4">
              <ButtonPressFeedback
                onClick={() => handleDelete(alert.id)}
                className="w-full py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
                style={{ backgroundColor: color.dangerBg, color: color.danger }}
              >
                <X size={16} />
                Delete Alert
              </ButtonPressFeedback>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ComparisonsSection() {
  return (
    <EmptyState
      icon={<History size={48} />}
      title="Comparisons"
      description="Your recent comparisons will appear here"
    />
  )
}

function SettingsSection({ user }: { user: any }) {
  return (
    <div className="rounded-3xl p-6 space-y-6 shadow-md" style={{ backgroundColor: color.bg, border: `1px solid ${color.borderLight}` }}>
      <div>
        <h3 className="text-xl font-semibold mb-4" style={{ color: color.text }}>Account Information</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-2 py-3 border-b" style={{ borderColor: color.borderLight }}>
            <span className="text-sm font-medium min-w-[60px]" style={{ color: color.textMuted }}>Name:</span>
            <span className="text-sm font-semibold truncate" style={{ color: color.text }}>{user?.display_name}</span>
          </div>
          <div className="flex items-center gap-2 py-3">
            <span className="text-sm font-medium min-w-[60px]" style={{ color: color.textMuted }}>Email:</span>
            <span className="text-sm font-semibold truncate" style={{ color: color.text }}>{user?.email}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: color.danger }}>Danger Zone</h3>
        <p className="text-sm mb-4 leading-relaxed" style={{ color: color.textMuted }}>
          This action cannot be undone. All your data will be permanently deleted.
        </p>
        <button
          className="px-6 py-2.5 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: color.danger, color: color.bg }}
          onClick={() => {
            // No confirm() — inline state would go here in phase 2
            alert('Account deletion not yet implemented')
          }}
        >
          Delete Account
        </button>
      </div>
    </div>
  )
}

function SectionSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="h-24 rounded-xl animate-pulse" style={{ backgroundColor: color.borderLight }} />
      ))}
    </div>
  )
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center py-16">
      <div className="mb-4 flex justify-center" style={{ color: color.border }}>{icon}</div>
      <h3 className="text-lg font-bold mb-2" style={{ color: color.text }}>{title}</h3>
      <p className="text-sm" style={{ color: color.textMuted }}>{description}</p>
    </div>
  )
}
