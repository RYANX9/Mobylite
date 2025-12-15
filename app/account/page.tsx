// app/account/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Star, Bell, History, Settings, LogOut, User, Loader2, X, ArrowLeft, Smartphone, Trash2, ShoppingBag, TrendingDown, Calendar } from 'lucide-react';
import { ButtonPressFeedback } from '../components/shared/ButtonPressFeedback';
import { useAuth } from '@/lib/auth-context';
import { APP_ROUTES } from '@/lib/config';
import { color, font } from '@/lib/tokens';
import type { Favorite, Review, PriceAlert } from '@/lib/types';
import { api } from '@/lib/api';

export default function AccountPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('favorites');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(APP_ROUTES.login);
      return;
    }

    const updateSection = () => {
      const hash = window.location.hash?.replace('#', '');
      if (hash && ['favorites', 'reviews', 'alerts', 'comparisons', 'settings'].includes(hash)) {
        setActiveSection(hash);
      } else {
        setActiveSection('favorites');
      }
    };

    updateSection();
    window.addEventListener('hashchange', updateSection);
    return () => window.removeEventListener('hashchange', updateSection);
  }, [user, authLoading, router]);

  useEffect(() => {
    if (typeof window !== 'undefined' && activeSection) {
      const currentHash = window.location.hash?.replace('#', '');
      if (currentHash !== activeSection) {
        window.history.replaceState(null, '', `#${activeSection}`);
      }
    }
  }, [activeSection]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-black" strokeWidth={2} />
          <p className="text-sm font-medium text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Premium Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ButtonPressFeedback
                onClick={() => router.push(APP_ROUTES.home)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all group"
              >
                <ArrowLeft size={20} className="text-gray-700 group-hover:text-black transition-colors" strokeWidth={2} />
                <span className="hidden sm:inline text-sm font-bold text-gray-700 group-hover:text-black transition-colors">Back</span>
              </ButtonPressFeedback>
              
              <div className="h-6 w-px bg-gray-200" />
              
              <div className="flex items-center gap-3">
                <img src="/logo.svg" alt="Mobylite" className="w-8 h-8" />
                <h1 className="text-xl font-bold hidden sm:inline text-gray-900">Mobylite</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.display_name} 
                    className="w-11 h-11 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-sm">
                    <User size={20} className="text-white" strokeWidth={2} />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              
              <div className="hidden md:block">
                <p className="font-bold text-sm text-gray-900 leading-tight">{user.display_name}</p>
                <p className="text-xs text-gray-500 leading-tight">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="grid grid-cols-12 gap-8">
            {/* Sidebar */}
            <div className="col-span-3">
              <div className="sticky top-24">
                {/* User Card */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 mb-6 shadow-xl">
                  <div className="flex flex-col items-center text-center">
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={user.display_name} 
                        className="w-20 h-20 rounded-full object-cover border-4 border-white/20 shadow-lg mb-4"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center border-4 border-white/20 shadow-lg mb-4">
                        <User size={32} className="text-white" strokeWidth={2} />
                      </div>
                    )}
                    <h2 className="text-lg font-bold text-white mb-1">{user.display_name}</h2>
                    <p className="text-sm text-gray-300">{user.email}</p>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="bg-white rounded-2xl p-3 shadow-md mb-4">
                  <NavItem id="favorites" label="Favorites" icon={Heart} active={activeSection === 'favorites'} onClick={setActiveSection} />
                  <NavItem id="reviews" label="My Reviews" icon={Star} active={activeSection === 'reviews'} onClick={setActiveSection} />
                  <NavItem id="alerts" label="Price Alerts" icon={Bell} active={activeSection === 'alerts'} onClick={setActiveSection} />
                  <NavItem id="comparisons" label="History" icon={History} active={activeSection === 'comparisons'} onClick={setActiveSection} />
                  <NavItem id="settings" label="Settings" icon={Settings} active={activeSection === 'settings'} onClick={setActiveSection} />
                </nav>

                {/* Sign Out */}
                <ButtonPressFeedback
                  onClick={() => {
                    logout();
                    router.replace(APP_ROUTES.login);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all font-bold text-sm group"
                >
                  <LogOut size={18} className="group-hover:translate-x-[-2px] transition-transform" strokeWidth={2} />
                  Sign Out
                </ButtonPressFeedback>
              </div>
            </div>

            {/* Main Content */}
            <div className="col-span-9">
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
        {/* Mobile Tabs */}
        <div className="sticky top-[73px] z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 py-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <TabButton id="favorites" label="Favorites" icon={Heart} active={activeSection === 'favorites'} onClick={setActiveSection} />
              <TabButton id="reviews" label="Reviews" icon={Star} active={activeSection === 'reviews'} onClick={setActiveSection} />
              <TabButton id="alerts" label="Alerts" icon={Bell} active={activeSection === 'alerts'} onClick={setActiveSection} />
              <TabButton id="comparisons" label="History" icon={History} active={activeSection === 'comparisons'} onClick={setActiveSection} />
              <TabButton id="settings" label="Settings" icon={Settings} active={activeSection === 'settings'} onClick={setActiveSection} />
            </div>
          </div>
        </div>

        <div className="p-4 pb-20">
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

const NavItem = ({ id, label, icon: Icon, active, onClick }: any) => (
  <ButtonPressFeedback
    onClick={() => onClick(id)}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-1 ${
      active 
        ? 'bg-black text-white shadow-lg' 
        : 'text-gray-700 hover:bg-gray-50'
    }`}
  >
    <Icon size={20} strokeWidth={2} />
    <span className="text-sm font-bold">{label}</span>
  </ButtonPressFeedback>
);

const TabButton = ({ id, label, icon: Icon, active, onClick }: any) => (
  <button
    onClick={() => {
      onClick(id);
      if (typeof window !== 'undefined') {
        window.location.hash = id;
      }
    }}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
      active 
        ? 'bg-black text-white shadow-lg' 
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`}
  >
    <Icon size={16} strokeWidth={2} />
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
    return (
      <EmptyState 
        icon={Heart} 
        title="No favorites yet" 
        description="Save phones you love to easily find them later"
        action={{ label: "Browse Phones", onClick: () => router.push(APP_ROUTES.home) }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">My Favorites</h2>
          <p className="text-sm text-gray-500">
            {favoritesList.length} phone{favoritesList.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl">
          <Heart size={16} className="text-gray-700" fill="currentColor" strokeWidth={2} />
          <span className="text-sm font-bold text-gray-700">{favoritesList.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {favoritesList.map((fav: Favorite) => (
          <div
            key={fav.phone_id}
            className="group bg-white rounded-2xl overflow-hidden border-2 border-gray-200 hover:border-black transition-all hover:shadow-xl"
          >
            <ButtonPressFeedback onClick={() => handlePhoneClick(fav.phone)} className="w-full">
              <div className="relative h-56 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6 overflow-hidden">
                {fav.phone?.main_image_url ? (
                  <img
                    src={fav.phone.main_image_url}
                    alt={fav.phone.model_name}
                    className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <Smartphone size={64} className="text-gray-300" strokeWidth={1.5} />
                )}
                <div className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                  <Heart size={18} className="text-red-500" fill="currentColor" strokeWidth={2} />
                </div>
              </div>

              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  {fav.phone?.brand}
                </p>
                <h3 className="text-base font-bold text-gray-900 leading-tight mb-3 line-clamp-2 min-h-[48px]">
                  {fav.phone?.model_name}
                </h3>
                {fav.phone?.price_usd && (
                  <p className="text-2xl font-bold text-gray-900 mb-4">
                    ${fav.phone.price_usd}
                  </p>
                )}
              </div>
            </ButtonPressFeedback>

            <div className="px-5 pb-5 flex gap-2">
              <ButtonPressFeedback
                onClick={() => handlePhoneClick(fav.phone)}
                className="flex-1 py-2.5 bg-black hover:bg-gray-800 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <ShoppingBag size={16} strokeWidth={2} />
                View Details
              </ButtonPressFeedback>
              <ButtonPressFeedback
                onClick={() => handleRemoveFavorite(fav.phone_id)}
                className="w-12 h-10 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all flex items-center justify-center"
              >
                <Trash2 size={18} strokeWidth={2} />
              </ButtonPressFeedback>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewsSection() {
  const router = useRouter();
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const data = await api.reviews.getByUser();
      const reviews = data.reviews || [];
      
      const reviewsWithPhones = await Promise.all(
        reviews.map(async (review: any) => {
          try {
            const phoneData = await api.phones.getDetails(review.phone_id);
            return { ...review, phone: phoneData };
          } catch (err) {
            console.error(`Failed to fetch phone ${review.phone_id}:`, err);
            return review;
          }
        })
      );
      
      setUserReviews(reviewsWithPhones);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneClick = (phone: any) => {
    if (!phone) return;
    const brand = phone.brand.toLowerCase().replace(/\s+/g, '-');
    const model = phone.model_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    router.push(`/${brand}/${model}`);
  };

  if (loading) return <SectionSkeleton />;

  if (userReviews.length === 0) {
    return (
      <EmptyState 
        icon={Star} 
        title="No reviews yet" 
        description="Share your experience and help others make informed decisions"
        action={{ label: "Browse Phones", onClick: () => router.push(APP_ROUTES.home) }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">My Reviews</h2>
          <p className="text-sm text-gray-500">
            {userReviews.length} review{userReviews.length !== 1 ? 's' : ''} written
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl">
          <Star size={16} className="text-gray-700" fill="currentColor" strokeWidth={2} />
          <span className="text-sm font-bold text-gray-700">{userReviews.length}</span>
        </div>
      </div>

      <div className="space-y-5">
        {userReviews.map((review: any) => (
          <div
            key={review.id}
            className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden hover:border-gray-300 transition-all hover:shadow-lg"
          >
            {review.phone && (
              <ButtonPressFeedback
                onClick={() => handlePhoneClick(review.phone)}
                className="w-full flex items-center gap-4 p-5 bg-gradient-to-r from-gray-50 to-white border-b-2 border-gray-200 hover:from-gray-100 hover:to-gray-50 transition-all group"
              >
                <div className="w-20 h-20 rounded-xl bg-white flex items-center justify-center overflow-hidden border-2 border-gray-200 group-hover:border-black transition-all flex-shrink-0 shadow-sm">
                  {review.phone.main_image_url ? (
                    <img
                      src={review.phone.main_image_url}
                      alt={review.phone.model_name}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <Smartphone size={32} className="text-gray-300" strokeWidth={2} />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    {review.phone.brand}
                  </p>
                  <p className="font-bold text-base text-gray-900 leading-tight">
                    {review.phone.model_name}
                  </p>
                </div>
              </ButtonPressFeedback>
            )}

            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={14} className="text-gray-400" strokeWidth={2} />
                    <p className="text-xs font-medium text-gray-500">
                      {new Date(review.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <h4 className="font-bold text-xl text-gray-900 mb-3 leading-tight">
                    {review.title}
                  </h4>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border-2 border-yellow-200 ml-4">
                  <Star size={20} fill="#fbbf24" className="text-yellow-400" strokeWidth={2} />
                  <span className="text-xl font-bold text-gray-900">
                    {review.rating.toFixed(1)}
                  </span>
                </div>
              </div>
              <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                {review.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertsSection() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await api.priceAlerts.list();
      const alertsList = data.alerts || [];
      
      const alertsWithPhones = await Promise.all(
        alertsList.map(async (alert: any) => {
          try {
            const phoneData = await api.phones.getDetails(alert.phone_id);
            return { ...alert, phone: phoneData };
          } catch (err) {
            console.error(`Failed to fetch phone ${alert.phone_id}:`, err);
            return alert;
          }
        })
      );
      
      setAlerts(alertsWithPhones);
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
    return (
      <EmptyState 
        icon={Bell} 
        title="No price alerts" 
        description="Get notified when your favorite phones drop in price"
        action={{ label: "Browse Phones", onClick: () => router.push(APP_ROUTES.home) }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Price Alerts</h2>
          <p className="text-sm text-gray-500">
            {alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl">
          <Bell size={16} className="text-gray-700" strokeWidth={2} />
          <span className="text-sm font-bold text-gray-700">{alerts.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {alerts.map((alert: any) => (
          <div
            key={alert.id}
            className="group bg-white rounded-2xl overflow-hidden border-2 border-gray-200 hover:border-black transition-all hover:shadow-xl"
          >
            <ButtonPressFeedback
              onClick={() => alert.phone && handlePhoneClick(alert.phone)}
              className="w-full"
              disabled={!alert.phone}
            >
              <div className="relative h-56 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
                {alert.phone?.main_image_url ? (
                  <img
                    src={alert.phone.main_image_url}
                    alt={alert.phone.model_name}
                    className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <Smartphone size={64} className="text-gray-300" strokeWidth={1.5} />
                )}
                <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg ${
                  alert.is_active 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-400 text-white'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${alert.is_active ? 'bg-white' : 'bg-gray-200'}`}></div>
                  {alert.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>

              <div className="p-5">
                {alert.phone ? (
                  <>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                      {alert.phone.brand}
                    </p>
                    <h3 className="text-base font-bold text-gray-900 leading-tight mb-4 line-clamp-2 min-h-[48px]">
                      {alert.phone.model_name}
                    </h3>
                  </>
                ) : (
                  <p className="text-base font-bold text-gray-400 leading-tight mb-4 min-h-[48px]">
                    Phone details unavailable
                  </p>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border-2 border-green-200">
                    <div className="flex items-center gap-2">
                      <TrendingDown size={16} className="text-green-600" strokeWidth={2} />
                      <span className="text-xs font-bold text-gray-700">Target Price</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      ${alert.target_price}
                    </span>
                  </div>
                  
                  {alert.phone?.price_usd && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border-2 border-gray-200">
                      <span className="text-xs font-bold text-gray-500">Current Price</span>
                      <span className="text-lg font-bold text-gray-900">
                        ${alert.phone.price_usd}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </ButtonPressFeedback>

            <div className="px-5 pb-5">
              <ButtonPressFeedback
                onClick={() => handleDeleteAlert(alert.id)}
                className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={16} strokeWidth={2} />
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
    <div className="rounded-3xl p-6 space-y-6 shadow-md" style={{ backgroundColor: color.bg }}>
      <div>
        <h3 className="text-xl font-semibold mb-4 tracking-tight" style={{ color: color.text }}>Account Information</h3>
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
        <h3 className="text-xl font-semibold mb-3 tracking-tight" style={{ color: color.danger }}>Danger Zone</h3>
        <p className="text-sm mb-4 leading-relaxed" style={{ color: color.textMuted }}>
          This action cannot be undone. All your data will be permanently deleted.
        </p>
        <button
          className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-md"
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
