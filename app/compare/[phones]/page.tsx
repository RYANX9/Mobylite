'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Phone } from '@/lib/types';
import { api } from '@/lib/api';
import { createPhoneSlug, APP_ROUTES } from '@/lib/config';
import MobileCompare from '@/app/components/mobile/MobileCompare';
import DesktopCompare from '@/app/components/desktop/DesktopCompare';
import { color } from '@/lib/tokens';

export default function ComparePage() {
  const params = useParams();
  const router = useRouter();
  const [phones, setPhones] = useState<Phone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const loadPhones = async () => {
      const phoneParam = params.phones as string;
      
      // ✅ If no phones param or empty, clear phones
      if (!phoneParam || phoneParam === '') {
        setPhones([]);
        setLoading(false);
        return;
      }

      const slugs = phoneParam.split('-vs-');
      
      try {
        const phonePromises = slugs.map(async (slug) => {
          const searchTerm = slug.replace(/-/g, ' ');
          const data = await api.phones.search({ q: searchTerm, page_size: 1 });
          if (data.results && data.results.length > 0) {
            return await api.phones.getDetails(data.results[0].id);
          }
          return null;
        });
        
        const loadedPhones = await Promise.all(phonePromises);
        const validPhones = loadedPhones.filter(p => p !== null) as Phone[];
        setPhones(validPhones);
      } catch (error) {
        console.error('Error loading phones:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPhones();
  }, [params]);

  // ✅ Update URL when phones change
  useEffect(() => {
    if (loading) return; // Don't update URL during initial load

    if (phones.length === 0) {
      // ✅ Redirect to home when no phones
      router.replace('/');
      return;
    }

    // ✅ Update URL with new phone slugs
    const phoneSlugs = phones.map(phone => createPhoneSlug(phone));
    const newUrl = APP_ROUTES.compare(phoneSlugs);
    
    // Only update if URL is different
    if (window.location.pathname !== newUrl) {
      router.replace(newUrl);
    }
  }, [phones, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: color.bg }}>
        <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full" style={{ borderColor: color.border }} />
      </div>
    );
  }

  const handleSetComparePhones = (newPhones: Phone[]) => {
    setPhones(newPhones);
    
    // ✅ Use history API instead of router.replace to avoid reload
    if (newPhones.length === 0) {
      window.history.pushState(null, '', '/');
      // Manually trigger navigation
      setTimeout(() => router.push('/'), 0);
    } else {
      const phoneSlugs = newPhones.map(phone => createPhoneSlug(phone));
      const newUrl = APP_ROUTES.compare(phoneSlugs);
      window.history.replaceState(null, '', newUrl);
    }
  };

  const handleSetView = (view: string) => {
    if (view === 'home') {
      router.push('/');
    }
  };

  const dummySetSelectedPhone = () => {};

  if (isMobile) {
    return (
      <MobileCompare
        phones={phones}
        onPhonesChange={(newPhones) => setPhones(newPhones)} 
        setComparePhones={handleSetComparePhones}
        setView={handleSetView}
        setSelectedPhone={dummySetSelectedPhone}
      />
    );
  }

  return (
    <DesktopCompare
      phones={phones}
      onPhonesChange={(newPhones) => setPhones(newPhones)} 
      setComparePhones={handleSetComparePhones}
      setView={handleSetView}
      setSelectedPhone={dummySetSelectedPhone}
    />
  );
}