'use client';
import React, { useEffect, useState } from 'react';
import { Phone } from '@/lib/types';
import { PhoneCard } from './PhoneCard';
import { api } from '@/lib/api';
import { color } from '@/lib/tokens';

interface AlsoComparedProps {
  phoneId: number;
  variant?: 'desktop' | 'mobile';
}

export const AlsoCompared: React.FC<AlsoComparedProps> = ({ phoneId, variant = 'desktop' }) => {
  const [phonesList, setPhonesList] = useState<Phone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlsoCompared = async () => {
      if (!phoneId) return;
      
      setLoading(true);
      try {
        const data = await api.phones.getAlsoCompared(phoneId);
        if (data.success && data.phones) {
          setPhonesList(data.phones);
        }
      } catch (error) {
        console.error('Failed to fetch also compared:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAlsoCompared();
  }, [phoneId]);

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i} 
            className={`${variant === 'mobile' ? 'w-32 h-40' : 'w-48 h-48'} rounded-xl animate-pulse`}
            style={{ backgroundColor: color.borderLight }}
          />
        ))}
      </div>
    );
  }

  if (phonesList.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 
        className={`font-semibold mb-3 ${variant === 'mobile' ? 'text-lg' : 'text-xl'}`}
        style={{ color: color.text }}
      >
        Also compared with
      </h2>
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2">
        {phonesList.map((phone) => (
          <div key={phone.id} className="snap-start flex-shrink-0 w-48">
            <PhoneCard phone={phone} variant="tiny" />
          </div>
        ))}
      </div>
    </div>
  );
};