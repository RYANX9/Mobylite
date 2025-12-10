'use client';
import { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Phone } from '../../../lib/types';
import { api } from '@/lib/api'; // ✅ UPDATED IMPORT
import DesktopDetail from '../../components/desktop/DesktopDetail';
import MobileDetail from '../../components/mobile/MobileDetail';

export default function PhoneDetailPage() {
  const params = useParams();
  const [phone, setPhone] = useState<Phone | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const [view, setView] = useState('pdp');
  const [comparePhones, setComparePhones] = useState<Phone[]>([]);

  // Device detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fetch phone by brand/model slug
  useEffect(() => {
    const fetchPhone = async () => {
      try {
        const brand = decodeURIComponent(params.brand as string);
        const model = decodeURIComponent(params.model as string);
        
        // ✅ Use API client instead of direct fetch
        const searchData = await api.phones.search({ 
          q: `${brand} ${model}`, 
          page_size: 1 
        });
        
        if (searchData.results?.length > 0) {
          // ✅ Use API client for details
          const fullPhone = await api.phones.getDetails(searchData.results[0].id);
          setPhone(fullPhone);
        } else {
          setPhone(null);
        }
      } catch (error) {
        console.error('Error fetching phone:', error);
        setPhone(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPhone();
  }, [params.brand, params.model]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!phone) {
    notFound();
  }

  // Reuse existing components
  if (!isDesktop) {
    return (
      <MobileDetail
        phone={phone}
        setView={setView}
        setComparePhones={setComparePhones}
        setSelectedPhone={setPhone}
      />
    );
  }

  return (
    <DesktopDetail
      phone={phone}
      setView={setView}
      setComparePhones={setComparePhones}
      setSelectedPhone={setPhone}
    />
  );
}