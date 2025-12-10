// app/Loader.tsx
'use client';
import React from 'react';
import { color } from '@/lib/tokens';

export default function Loader() {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: color.bg }}
    >
      <div className="flex flex-col items-center gap-4">
        <img src="/logo.svg" alt="Mobylite" className="w-16 h-16 animate-pulse" />
        <p className="text-lg font-semibold" style={{ color: color.text }}>
          Mobylite
        </p>

        <div className="flex items-end gap-2 h-12">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="block w-3 rounded animate-bounceBlock"
              style={{ 
                backgroundColor: color.primary,
                animationDelay: `${i * 150}ms` 
              }}
            />
          ))}
        </div>

        <div 
          className="w-32 h-1 rounded-full overflow-hidden"
          style={{ backgroundColor: color.borderLight }}
        >
          <div 
            className="h-full animate-slide"
            style={{ backgroundColor: color.primary }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes bounceBlock {
          0%, 100% { transform: scaleY(0.4); opacity: 0.5; }
          50% { transform: scaleY(1); opacity: 1; }
        }
        .animate-bounceBlock {
          animation: bounceBlock 0.8s ease-in-out infinite;
        }

        @keyframes slide {
          0% { width: 0; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .animate-slide {
          animation: slide 1.2s infinite;
        }
      `}</style>
    </div>
  );
}