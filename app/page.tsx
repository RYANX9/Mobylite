'use client';

import { useState, useEffect } from 'react';
import Loader from './Loader';

import MobileHome from './components/mobile/MobileHome';
import MobileDetail from './components/mobile/MobileDetail';
import MobileCompare from './components/mobile/MobileCompare';

import DesktopHome from './components/desktop/DesktopHome';
import DesktopDetail from './components/desktop/DesktopDetail';
import DesktopCompare from './components/desktop/DesktopCompare';

export default function Page() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [view, setView] = useState<'home' | 'pdp' | 'compare'>('home');
  const [selectedPhone, setSelectedPhone] = useState<any>(null);
  const [comparePhones, setComparePhones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkScreen = () => setIsDesktop(window.innerWidth >= 1024);
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <Loader />;
  }

  if (!isDesktop) {
    if (view === 'compare' && comparePhones.length > 0) {
      return (
        <MobileCompare
          phones={comparePhones}
          setComparePhones={setComparePhones}
          setView={setView}
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
  }

  if (view === 'compare' && comparePhones.length > 0) {
    return (
      <DesktopCompare
        phones={comparePhones}
        setComparePhones={setComparePhones}
        setView={setView}
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
}