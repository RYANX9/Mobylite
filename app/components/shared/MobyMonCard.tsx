'use client';
import React, { useRef } from 'react';
import { X, Download, Smartphone, Sun, Cpu, Camera, Battery, HardDrive, Wifi, Zap, Maximize2, Ruler, Weight } from 'lucide-react';
import { Phone } from '@/lib/types';
import { extractCleanSpecs } from '@/lib/cleanSpecExtractor';
import { ButtonPressFeedback } from './ButtonPressFeedback';
import { color, font } from '@/lib/tokens';
import html2canvas from 'html2canvas';

interface MobyMonCardProps {
  phone: Phone;
  onClose: () => void;
}

const ICON_COMPONENTS: Record<string, any> = {
  '📱': Smartphone,
  '☀️': Sun,
  '🔧': Cpu,
  '📷': Camera,
  '🔍': Maximize2,
  '🤳': Camera,
  '🔋': Battery,
  '💾': HardDrive,
  '📂': HardDrive,
  '🏗️': Cpu,
  '📡': Wifi,
  '⚡': Zap,
  '📏': Ruler,
  '🔘': Smartphone,
  '✏️': Smartphone,
  '🛰️': Wifi,
  '📸': Camera,
  '🔭': Camera,
  '🔬': Camera,
};

export default function MobyMonCard({ phone, onClose }: MobyMonCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const getProxiedImageUrl = (url: string | null) => {
    if (!url) return null;
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#FFFFFF',
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      const link = document.createElement('a');
      link.download = `mobymon-${phone.brand}-${phone.model_name}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to download card:', error);
      alert('Failed to generate card. Please try again.');
    }
  };

  const cleanSpecs = extractCleanSpecs(phone);
  const displaySpecs = cleanSpecs
    .filter(spec => !['Price'].includes(spec.label))
    .slice(0, 12);

  const formatReleaseDate = (dateStr: string) => {
    if (!dateStr) return '';
    const cleanDate = dateStr.replace(/<[^>]*>/g, '').trim();
    const match = cleanDate.match(/(\w+ \d{4})/);
    return match ? match[1] : cleanDate.slice(0, 20);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative max-w-md w-full">
        <div className="flex justify-end gap-3 mb-4">
          <ButtonPressFeedback
            onClick={downloadCard}
            className="px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg"
            style={{ backgroundColor: color.success, color: '#FFFFFF' }}
          >
            <Download size={18} />
            Download
          </ButtonPressFeedback>
          <ButtonPressFeedback
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-bold text-sm shadow-lg"
            style={{ backgroundColor: color.bg, color: color.text }}
          >
            <X size={18} />
          </ButtonPressFeedback>
        </div>

        <div
          ref={cardRef}
          className="w-full rounded-3xl overflow-hidden shadow-2xl"
          style={{
            backgroundColor: '#FFFFFF',
            aspectRatio: '9/16',
          }}
        >
          <div
            className="p-6 pb-4"
            style={{
              background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3
                  className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: '#888888', letterSpacing: '0.15em' }}
                >
                  MobyMon Card
                </h3>
                <p
                  className="text-xs font-bold uppercase tracking-wide mb-1"
                  style={{ color: '#AAAAAA' }}
                >
                  {phone.brand}
                </p>
                <h1
                  className="text-2xl font-bold leading-tight mb-2"
                  style={{ color: '#FFFFFF', fontFamily: font.primary }}
                >
                  {phone.model_name}
                </h1>
                {phone.release_date_full && (
                  <p className="text-xs font-medium" style={{ color: '#888888' }}>
                    {formatReleaseDate(phone.release_date_full)}
                  </p>
                )}
              </div>

              <div
                className="w-32 h-32 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#FFFFFF' }}
              >
                {phone.main_image_url ? (
                  <img
                    src={getProxiedImageUrl(phone.main_image_url)}
                    alt={phone.model_name}
                    className="w-full h-full object-contain p-3"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <Smartphone size={40} style={{ color: '#CCCCCC', display: phone.main_image_url ? 'none' : 'block' }} />
              </div>
            </div>
          </div>

          <div className="p-6 py-8">
            <div className="grid grid-cols-2 gap-4">
              {displaySpecs.map((spec, idx) => {
                const IconComponent = ICON_COMPONENTS[spec.icon] || Smartphone;
                return (
                  <div key={idx} className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1.5">
                      <IconComponent size={18} style={{ color: '#666666' }} />
                      <span
                        className="text-[11px] font-bold uppercase tracking-wide"
                        style={{ color: '#666666' }}
                      >
                        {spec.label}
                      </span>
                    </div>
                    <p
                      className="text-sm font-bold leading-tight"
                      style={{ color: '#0f0f0f', fontFamily: font.primary }}
                    >
                      {spec.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ backgroundColor: '#0f0f0f' }}
          >
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="Mobylite" className="w-6 h-6 invert" />
              <div>
                <p className="text-[10px] font-bold" style={{ color: '#FFFFFF' }}>
                  mobylite.com
                </p>
                <p className="text-[8px] font-medium" style={{ color: '#888888' }}>
                  Compare phones. Make smart choices.
                </p>
              </div>
            </div>

            {phone.price_usd && (
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-wide mb-0.5" style={{ color: '#888888' }}>
                  Launch Price
                </p>
                <p
                  className="text-xl font-bold"
                  style={{ color: '#FFFFFF', fontFamily: font.numeric }}
                >
                  ${phone.price_usd}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
