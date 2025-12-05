'use client';
import React, { useEffect, useState } from 'react';
import { Phone } from './types';
import { fetchAlsoCompared } from './utils';
import { PhoneCard } from './PhoneCard';

interface AlsoComparedProps {
  phoneId: string;
  variant?: 'desktop' | 'mobile';
}

export const AlsoCompared: React.FC<AlsoComparedProps> = ({ phoneId, variant = 'desktop' }) => {
  const [phones, setPhones] = useState<Phone[]>([]);

  useEffect(() => {
    // 1. get 4 ids   2. fetch each phone details (reuse existing fetchPhone)
    fetchAlsoCompared(phoneId).then(async (ids) => {
      const list = await Promise.all(
        ids.map((id) =>
          fetch(`${process.env.NEXT_PUBLIC_API_BASE || '/api'}/phones/${id}`)
            .then((r) => r.json())
            .catch(() => null)
        )
      );
      setPhones(list.filter(Boolean));
    });
  }, [phoneId]);

  if (phones.length === 0) return null;

  return (
    <div>
      <h2 className={`font-semibold text-gray-800 mb-3 ${variant === 'mobile' ? 'text-lg' : 'text-xl'}`}>
        Also compared with
      </h2>
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
        {phones.map((p) => (
          <div key={p.id} className="snap-start flex-shrink-0 w-48">
            <PhoneCard phone={p} variant="tiny" showRating />
          </div>
        ))}
      </div>
    </div>
  );
};