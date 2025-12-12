'use client';

import { useState, useEffect } from 'react';
import type { Phone } from '@/lib/types';

import Loader from './Loader';
import MobileHome from './components/mobile/MobileHome';
import MobileDetail from './components/mobile/MobileDetail';
import DesktopHome from './components/desktop/DesktopHome';
import DesktopDetail from './components/desktop/DesktopDetail';

export default function Page() {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  const [view, setView] = useState<'home' | 'pdp'>('home');
  const [selectedPhone, setSelectedPhone] = useState<Phone | null>(null);
  const [comparePhones, setComparePhones] = useState<Phone[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      if (typeof window !== 'undefined') {
        setIsDesktop(window.innerWidth >= 1024);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize, { passive: true });
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (isDesktop === null) {
    return <Loader />;
  }

  if (isLoading) return <Loader />;

  const renderMobile = () => {
    if (view === 'pdp' && selectedPhone) {
      return (
        <MobileDetail 
          phone={selectedPhone} 
          setView={setView} 
          setComparePhones={setComparePhones} 
          setSelectedPhone={setSelectedPhone}
        />
      );
    }
    return (
      <MobileHome 
        setSelectedPhone={setSelectedPhone} 
        setView={setView} 
        setComparePhones={setComparePhones} 
      />
    );
  };

  const renderDesktop = () => {
    if (view === 'pdp' && selectedPhone) {
      return (
        <DesktopDetail 
          phone={selectedPhone} 
          setView={setView} 
          setComparePhones={setComparePhones} 
          setSelectedPhone={setSelectedPhone}
        />
      );
    }
    return (
      <DesktopHome 
        setSelectedPhone={setSelectedPhone} 
        setView={setView} 
        setComparePhones={setComparePhones} 
      />
    );
  };

  return isDesktop ? renderDesktop() : renderMobile();
}