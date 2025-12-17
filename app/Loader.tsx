'use client';
import React from 'react';
import { Young_Serif, Space_Grotesk } from "next/font/google";

const youngSerif = Young_Serif({
  subsets: ["latin"],
  weight: "400",
});

export default function Loader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        {/* Logo */}
        <img src="/logo.svg" alt="Mobylite" className="w-16 h-16 animate-pulse" />
        <p className="text-lg text-black" style={{ fontFamily: "'Young Serif', serif !important" }}>Mobylite</p>

        {/* Bouncing bars animation */}
        <div className="flex items-end gap-2 h-12">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="block w-3 bg-black rounded animate-bounceBlock"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-black animate-slide" />
        </div>
      </div>

      <style jsx>{`
        /* Bouncing bars */
        @keyframes bounceBlock {
          0%, 100% { transform: scaleY(0.4); opacity: 0.5; }
          50% { transform: scaleY(1); opacity: 1; }
        }
        .animate-bounceBlock {
          animation: bounceBlock 0.8s ease-in-out infinite;
        }

        /* Progress bar sliding */
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