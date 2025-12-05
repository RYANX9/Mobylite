'use client';
import { useState, useEffect } from 'react';

// Mobile Components
import MobileHome from './components/mobile/MobileHome';
import MobileDetail from './components/mobile/MobileDetail';
import MobileCompare from './components/mobile/MobileCompare';

// Desktop Components
import DesktopHome from './components/desktop/DesktopHome';
import DesktopDetail from './components/desktop/DesktopDetail';
import DesktopCompare from './components/desktop/DesktopCompare';

export default function Page() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [view, setView] = useState('home'); // 'home' | 'pdp' | 'compare'
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [comparePhones, setComparePhones] = useState([]);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Mobile Views
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
        setComparePhones={setComparePhones}  // ✅ ADDED THIS LINE
      />
    );
  }

  // Desktop Views
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