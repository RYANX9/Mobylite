'use client';

import { useState, useEffect } from 'react';
import Loader from './Loader';
import MobileHome from './components/mobile/MobileHome';
import MobileDetail from './components/mobile/MobileDetail';
import MobileCompare from './components/mobile/MobileCompare';
import DesktopHome from './components/desktop/DesktopHome';
import DesktopDetail from './components/desktop/DesktopDetail';
import DesktopCompare from './components/desktop/DesktopCompare';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/lib/config';
import { getPhoneSlug } from '@/lib/utils';
import type { Phone } from '@/lib/types';

export default function Page() {
  const router = useRouter();
  const [isDesktop, setIsDesktop] = useState(false);
  const [view, setView] = useState<'home' | 'pdp' | 'compare'>('home');
  const [selectedPhone, setSelectedPhone] = useState<Phone | null>(null);
  const [comparePhones, setComparePhones] = useState<Phone[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => setIsDesktop(window.innerWidth >= 1024);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleNavigateToCompare = (phones: Phone[]) => {
    if (!phones.length) return;
    const phoneSlugs = phones.map(p => getPhoneSlug(p).model);
    router.push(APP_ROUTES.compare(phoneSlugs));
  };

  const handleNavigateToPhone = (phone: Phone) => {
    const { brand, model } = getPhoneSlug(phone);
    router.push(APP_ROUTES.phoneDetail(brand, model));
  };

  if (isLoading) return <Loader />;

  if (!isDesktop) {
    if (view === 'compare' && comparePhones.length) {
      return (
        <MobileCompare 
          phones={comparePhones} 
          setComparePhones={setComparePhones} 
          setView={setView} 
          setSelectedPhone={setSelectedPhone}
          onNavigateToCompare={handleNavigateToCompare}
          onNavigateToPhone={handleNavigateToPhone} 
        />
      );
    }
    if (view === 'pdp' && selectedPhone) {
      return (
        <MobileDetail 
          phone={selectedPhone} 
          setView={setView} 
          setComparePhones={setComparePhones} 
          setSelectedPhone={setSelectedPhone}
          onNavigateToCompare={handleNavigateToCompare}
        />
      );
    }
    return (
      <MobileHome 
        setSelectedPhone={setSelectedPhone} 
        setView={setView} 
        setComparePhones={setComparePhones} 
        onNavigateToCompare={handleNavigateToCompare}
        onNavigateToPhone={handleNavigateToPhone} 
      />
    );
  }

  if (view === 'compare' && comparePhones.length) {
    return (
      <DesktopCompare 
        phones={comparePhones} 
        setComparePhones={setComparePhones} 
        setView={setView} 
        setSelectedPhone={setSelectedPhone}
        onNavigateToCompare={handleNavigateToCompare}
        onNavigateToPhone={handleNavigateToPhone} 
      />
    );
  }
  if (view === 'pdp' && selectedPhone) {
    return (
      <DesktopDetail 
        phone={selectedPhone} 
        setView={setView} 
        setComparePhones={setComparePhones} 
        setSelectedPhone={setSelectedPhone}
        onNavigateToCompare={handleNavigateToCompare}
      />
    );
  }
  return (
    <DesktopHome 
      setSelectedPhone={setSelectedPhone} 
      setView={setView} 
      setComparePhones={setComparePhones} 
      onNavigateToCompare={handleNavigateToCompare}
      onNavigateToPhone={handleNavigateToPhone} 
    />
  );
}