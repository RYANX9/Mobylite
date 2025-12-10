'use client';

import React, { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { use } from 'react';
import type { Phone } from '@/lib/types';
import { api } from '@/lib/api';
import { parsePhoneSlug, createPhoneSlug } from '@/lib/config';
import DesktopCompare from '../../components/desktop/DesktopCompare';
import MobileCompare from '../../components/mobile/MobileCompare';

import { Loader2 } from 'lucide-react';
import { color } from '@/lib/tokens';

export default function ComparePage({ params }: { params: Promise<{ phones: string }> }) {
  const { phones } = use(params);
  const [phoneList, setPhoneList] = useState<Phone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => setIsDesktop(window.innerWidth >= 1024);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const loadComparison = async () => {
      try {
        const slugs = phones.split('-vs-');
        
        if (slugs.length < 2 || slugs.length > 4) {
          throw new Error('Must compare 2-4 phones');
        }

        const phonePromises = slugs.map(async (slug) => {
          const modelName = parsePhoneSlug(slug);
          const searchResult = await api.phones.search({
            q: modelName,
            page_size: 5
          });
          
          if (!searchResult.results || searchResult.results.length === 0) {
            throw new Error(`Phone not found: ${slug}`);
          }
          
          const exactMatch = searchResult.results.find(
            (p: Phone) => createPhoneSlug(p) === slug
          ) || searchResult.results[0];
          
          return api.phones.getDetails(exactMatch.id);
        });

        const loadedPhones = await Promise.all(phonePromises);
        setPhoneList(loadedPhones);
      } catch (error) {
        console.error('Comparison failed:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    loadComparison();
  }, [phones]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: color.bg }}>
        <Loader2 size={32} style={{ color: color.textMuted }} className="animate-spin" />
      </div>
    );
  }

  if (!phoneList.length) {
    return notFound();
  }

  return isDesktop ? <DesktopCompare phones={phoneList} /> : <MobileCompare phones={phoneList} />;
}