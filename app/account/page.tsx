// app\account\page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Star, Bell, History, Settings, LogOut, User, Loader2, X, ArrowLeft, Smartphone } from 'lucide-react';
import { ButtonPressFeedback } from '../components/shared/ButtonPressFeedback';
import { useAuth } from '@/lib/auth-context';
import { APP_ROUTES } from '@/lib/config';
import { color, font } from '@/lib/tokens';
import type { Favorite, Review, PriceAlert } from '@/lib/types';
import { api } from '@/lib/api';
import { ReviewCard } from '../components/shared/ReviewCard';

export default function AccountPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeSection, setActiveSection] = useState('favorites');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(APP_ROUTES.login);
      return;
    }

    const hash = window.location.hash?.replace('#', '') || 'favorites';
    setActiveSection(hash);
  }, [user, authLoading, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.hash = activeSection;
    }
  }, [activeSection]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: color.bg }}>
        <Loader2 size={32} style={{ color: color.textMuted }} className="animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: color.bg }}>
      {/* Top Navigation Bar */}
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

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="grid grid-cols-4 gap-8">
            <div className="col-span-1">
              <div 
                className="rounded-2xl p-5 sticky top-24 border"
                style={{ 
                  backgroundColor: color.bg,
                  borderColor: color.borderLight 
                }}
              >
                <nav className="space-y-1 mb-6">
                  <NavItem id="favorites" label="Favorites" icon={<Heart size={20} />} active={activeSection === 'favorites'} onClick={setActiveSection} />
                  <NavItem id="reviews" label="My Reviews" icon={<Star size={20} />} active={activeSection === 'reviews'} onClick={setActiveSection} />
                  <NavItem id="alerts" label="Price Alerts" icon={<Bell size={20} />} active={activeSection === 'alerts'} onClick={setActiveSection} />
                  <NavItem id="comparisons" label="Comparisons" icon={<History size={20} />} active={activeSection === 'comparisons'} onClick={setActiveSection} />
                  <NavItem id="settings" label="Settings" icon={<Settings size={20} />} active={activeSection === 'settings'} onClick={setActiveSection} />
                </nav>

                <ButtonPressFeedback
                  onClick={() => {
                    api.auth.logout();
                    router.push('/login');
                    router.refresh();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                  style={{ color: color.danger }}
                  hoverStyle={{ backgroundColor: color.dangerBg }}
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

      {/* Mobile Layout */}
      <div className="lg:hidden">
        <div className="sticky top-[73px] z-30 border-b" style={{ backgroundColor: color.bg, borderColor: color.borderLight }}>
          <div className="px-4 py-3">
            <div className="flex gap-2 overflow-x-auto">
              <TabButton id="favorites" label="Favorites" active={activeSection === 'favorites'} onClick={setActiveSection} />
              <TabButton id="reviews" label="Reviews" active={activeSection === 'reviews'} onClick={setActiveSection} />
              <TabButton id="alerts" label="Alerts" active={activeSection === 'alerts'} onClick={setActiveSection} />
              <TabButton id="comparisons" label="History" active={activeSection === 'comparisons'} onClick={setActiveSection} />
              <TabButton id="settings" label="Settings" active={activeSection === 'settings'} onClick={setActiveSection} />
            </div>
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
  );
}

const NavItem = ({ id, label, icon, active, onClick }: { 
  id: string; 
  label: string; 
  icon: React.ReactNode; 
  active: boolean;
  onClick: (id: string) => void;
}) => (
  <ButtonPressFeedback
    onClick={() => onClick(id)}
    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
    style={{ 
      backgroundColor: active ? color.text : 'transparent',
      color: active ? color.bg : color.text
    }}
    hoverStyle={{ backgroundColor: !active ? color.borderLight : color.text }}
  >
    <div className="w-5 h-5">{icon}</div>
    <span className="text-sm font-semibold">{label}</span>
  </ButtonPressFeedback>
);

const TabButton = ({ id, label, active, onClick }: { 
  id: string; 
  label: string; 
  active: boolean;
  onClick: (id: string) => void;
}) => (
  <button
    onClick={() => {
      onClick(id);
      if (typeof window !== 'undefined') {
        window.location.hash = id;
      }
    }}
    className="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all"
    style={{ 
      backgroundColor: active ? color.text : color.borderLight,
      color: active ? color.bg : color.textMuted
    }}
  >
    {label}
  </button>
);

function FavoritesSection() {
  const router = useRouter();
  const [favoritesList, setFavoritesList] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const data = await api.favorites.list();
      setFavoritesList(data.favorites || []);
    } catch (err) {
      console.error('Failed to load favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (phoneId: number) => {
    try {
      await api.favorites.remove(phoneId);
      setFavoritesList(favoritesList.filter(f => f.phone_id !== phoneId));
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    }
  };

  const handlePhoneClick = (phone: any) => {
    if (!phone) return;
    const brand = phone.brand.toLowerCase().replace(/\s+/g, '-');
    const model = phone.model_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    router.push(`/${brand}/${model}`);
  };

  if (loading) return <SectionSkeleton />;

  if (favoritesList.length === 0) {
    return <EmptyState icon={<Heart size={48} />} title="No favorites yet" description="Start adding phones you love!" />;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: color.text }}>My Favorites</h2>
        <p className="text-sm" style={{ color: color.textMuted }}>
          {favoritesList.length} phone{favoritesList.length !== 1 ? 's' : ''} saved
        </p>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4">
        {favoritesList.map((fav: Favorite) => (
          <div 
            key={fav.phone_id}
            className="flex-shrink-0 w-64 rounded-2xl overflow-hidden border transition-all hover:shadow-lg"
            style={{ backgroundColor: color.bg, borderColor: color.borderLight }}
          >
            <ButtonPressFeedback
              onClick={() => handlePhoneClick(fav.phone)}
              className="w-full"
            >
              <div 
                className="w-full h-48 flex items-center justify-center p-6"
                style={{ backgroundColor: color.borderLight }}
              >
                {fav.phone?.main_image_url ? (
                  <img 
                    src={fav.phone.main_image_url} 
                    alt={fav.phone.model_name} 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Smartphone size={48} style={{ color: color.textLight }} />
                )}
              </div>
              
              <div className="p-4">
                <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: color.textMuted }}>
                  {fav.phone?.brand}
                </p>
                <p className="font-bold text-base leading-tight mb-3 line-clamp-2 min-h-[48px]" style={{ color: color.text }}>
                  {fav.phone?.model_name}
                </p>
                {fav.phone?.price_usd && (
                  <p className="text-xl font-bold mb-3" style={{ color: color.text }}>
                    ${fav.phone.price_usd}
                  </p>
                )}
              </div>
            </ButtonPressFeedback>

            <div className="px-4 pb-4">
              <ButtonPressFeedback
                onClick={() => handleRemoveFavorite(fav.phone_id)}
                className="w-full py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
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
  );
}

function ReviewsSection() {
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const data = await api.reviews.getByUser();
      setUserReviews(data.reviews || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <SectionSkeleton />;

  if (userReviews.length === 0) {
    return <EmptyState icon={<Star size={48} />} title="No reviews yet" description="Share your experience with phones!" />;
  }

  return (
    <div className="space-y-4">
      {userReviews.map((review: Review) => (
        <ReviewCard key={review.id} review={review} variant="desktop" />
      ))}
    </div>
  );
}

function AlertsSection() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await api.priceAlerts.list();
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!confirm('Delete this price alert?')) return;
    
    try {
      await api.priceAlerts.delete(alertId);
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (err) {
      console.error('Failed to delete alert:', err);
    }
  };

  const handlePhoneClick = (phone: any) => {
    if (!phone) return;
    const brand = phone.brand.toLowerCase().replace(/\s+/g, '-');
    const model = phone.model_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    router.push(`/${brand}/${model}`);
  };

  if (loading) return <SectionSkeleton />;

  if (alerts.length === 0) {
    return <EmptyState icon={<Bell size={48} />} title="No alerts set" description="Get notified when prices drop!" />;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: color.text }}>Price Alerts</h2>
        <p className="text-sm" style={{ color: color.textMuted }}>
          {alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {alerts.map((alert: PriceAlert) => (
          <div 
            key={alert.id}
            className="flex-shrink-0 w-64 rounded-2xl overflow-hidden border transition-all hover:shadow-lg"
            style={{ backgroundColor: color.bg, borderColor: color.borderLight }}
          >
            <ButtonPressFeedback
              onClick={() => handlePhoneClick(alert.phone)}
              className="w-full"
            >
              <div 
                className="w-full h-48 flex items-center justify-center p-6 relative"
                style={{ backgroundColor: color.borderLight }}
              >
                {alert.phone?.main_image_url ? (
                  <img 
                    src={alert.phone.main_image_url} 
                    alt={alert.phone.model_name} 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Smartphone size={48} style={{ color: color.textLight }} />
                )}
                <div 
                  className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold"
                  style={{ 
                    backgroundColor: alert.is_active ? color.success : color.border,
                    color: color.bg
                  }}
                >
                  {alert.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
              
              <div className="p-4">
                <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: color.textMuted }}>
                  {alert.phone?.brand}
                </p>
                <p className="font-bold text-base leading-tight mb-3 line-clamp-2 min-h-[48px]" style={{ color: color.text }}>
                  {alert.phone?.model_name}
                </p>
                
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold" style={{ color: color.textMuted }}>Target:</span>
                    <span className="text-lg font-bold" style={{ color: color.success }}>
                      ${alert.target_price}
                    </span>
                  </div>
                  {alert.phone?.price_usd && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold" style={{ color: color.textMuted }}>Current:</span>
                      <span className="text-lg font-bold" style={{ color: color.text }}>
                        ${alert.phone.price_usd}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </ButtonPressFeedback>

            <div className="px-4 pb-4">
              <ButtonPressFeedback
                onClick={() => handleDeleteAlert(alert.id)}
                className="w-full py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
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
  );
}

function ComparisonsSection() {
  return (
    <EmptyState 
      icon={<History size={48} />} 
      title="Comparisons" 
      description="Your recent comparisons will appear here" 
    />
  );
}

function SettingsSection({ user }: { user: any }) {
  return (
    <div className="rounded-xl p-6 space-y-6 border" style={{ backgroundColor: color.bg, borderColor: color.borderLight }}>
      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: color.text }}>Account Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between py-3 border-b" style={{ borderColor: color.borderLight }}>
            <span className="text-sm font-medium" style={{ color: color.textMuted }}>Name</span>
            <span className="text-sm font-bold" style={{ color: color.text }}>{user?.display_name}</span>
          </div>
          <div className="flex justify-between py-3">
            <span className="text-sm font-medium" style={{ color: color.textMuted }}>Email</span>
            <span className="text-sm font-bold" style={{ color: color.text }}>{user?.email}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-3" style={{ color: color.danger }}>Danger Zone</h3>
        <p className="text-sm mb-4" style={{ color: color.textMuted }}>
          This action cannot be undone. All your data will be permanently deleted.
        </p>
        <button 
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ 
            backgroundColor: color.danger, 
            color: color.bg 
          }}
          onClick={() => {
            if (confirm('Are you sure? This will delete your account permanently.')) {
              alert('Account deletion not yet implemented');
            }
          }}
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div 
          key={i} 
          className="h-24 rounded-xl animate-pulse"
          style={{ backgroundColor: color.borderLight }}
        />
      ))}
    </div>
  );
}

function EmptyState({ icon, title, description }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="text-center py-16">
      <div className="mb-4 flex justify-center" style={{ color: color.border }}>
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-2" style={{ color: color.text }}>{title}</h3>
      <p className="text-sm" style={{ color: color.textMuted }}>{description}</p>
    </div>
  );
}