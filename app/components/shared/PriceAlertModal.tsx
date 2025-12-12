// app\components\shared\PriceAlertModal.tsx
'use client';
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Phone } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';
import { APP_ROUTES } from '@/lib/config';
import { color, font } from '@/lib/tokens';
import { ButtonPressFeedback } from './ButtonPressFeedback';

interface PriceAlertModalProps {
  show: boolean;
  onClose: () => void;
  phone: Phone | null;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({ show, onClose, phone }) => {
  const router = useRouter();
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>('');

  if (!show || !phone) return null;

  const handleSubmit = async () => {
    if (!isAuthenticated()) {
      if (confirm('Please sign in to set price alerts. Go to sign in?')) {
        const currentPath = window.location.pathname + window.location.search;
        sessionStorage.setItem('returnUrl', currentPath);
        router.push(APP_ROUTES.login);
      }
      return;
    }

    if (!targetPrice || isNaN(Number(targetPrice))) {
      setError('Please enter a valid price');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.priceAlerts.create(phone.id, parseFloat(targetPrice));
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setTargetPrice('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to set alert');
    } finally {
      setLoading(false);
    }
  };

  const modalBackdropStyle: React.CSSProperties = {
    backgroundColor: `${color.bgInverse}80`,
  };

  const modalContainerStyle: React.CSSProperties = {
    backgroundColor: color.bg,
  };

  const inputStyle: React.CSSProperties = {
    border: `1px solid ${color.border}`,
    backgroundColor: color.bg,
    color: color.text,
  };

  const submitButtonStyle: React.CSSProperties = {
    backgroundColor: color.text,
    color: color.bg,
  };

  const submitButtonDisabledStyle: React.CSSProperties = {
    backgroundColor: color.border,
    color: color.textMuted,
  };

  const successStyle: React.CSSProperties = {
    color: color.success,
  };

  const errorStyle: React.CSSProperties = {
    color: color.danger,
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 px-4 backdrop-blur-sm"
      style={modalBackdropStyle}
    >
      <div 
        className="rounded-2xl p-8 max-w-lg w-full shadow-2xl"
        style={modalContainerStyle}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 
            className="text-2xl font-bold"
            style={{ fontFamily: font.primary, color: color.text }}
          >
            Set Price Alert
          </h2>
          <button 
            onClick={onClose} 
            style={{ color: color.textMuted }}
            onMouseEnter={(e) => e.currentTarget.style.color = color.text}
            onMouseLeave={(e) => e.currentTarget.style.color = color.textMuted}
          >
            <X size={24} />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: color.successBg }}
            >
              <span className="text-3xl">✓</span>
            </div>
            <p className="font-bold text-lg mb-2" style={successStyle}>Alert Set Successfully!</p>
            <p className="text-sm" style={{ color: color.textMuted }}>
              We'll email you when the price drops below ${targetPrice}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 p-4 rounded-xl mb-6 border" style={{ backgroundColor: color.borderLight, borderColor: color.border }}>
              <div 
                className="w-20 h-20 flex-shrink-0 rounded-xl flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: color.bg }}
              >
                {phone.main_image_url ? (
                  <img 
                    src={phone.main_image_url} 
                    alt={phone.model_name} 
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <Smartphone size={32} style={{ color: color.textLight }} />
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: color.textMuted }}>
                  {phone.brand}
                </p>
                <p className="font-bold text-base mb-2" style={{ color: color.text }}>
                  {phone.model_name}
                </p>
                {phone.price_usd && (
                  <p className="text-sm" style={{ color: color.textMuted }}>
                    Current Price: <span className="font-bold" style={{ color: color.text }}>${phone.price_usd}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: color.text }}>
                  Target Price (USD)
                </label>
                <div className="relative">
                  <span 
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold"
                    style={{ color: color.textMuted }}
                  >
                    $
                  </span>
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="w-full pl-8 pr-4 py-4 rounded-xl text-base font-bold focus:outline-none transition-all"
                    style={inputStyle}
                    onFocus={(e) => e.currentTarget.style.borderColor = color.primary}
                    onBlur={(e) => e.currentTarget.style.borderColor = color.border}
                    placeholder="599.00"
                    step="0.01"
                  />
                </div>
                <p className="text-xs mt-2" style={{ color: color.textMuted }}>
                  You'll be notified when the price drops below this amount
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: color.dangerBg }}>
                  <p className="text-sm font-semibold" style={errorStyle}>{error}</p>
                </div>
              )}

              <ButtonPressFeedback
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-base transition-all"
                style={loading ? submitButtonDisabledStyle : submitButtonStyle}
              >
                {loading ? 'Setting Alert...' : 'Set Price Alert'}
              </ButtonPressFeedback>
            </div>
          </>
        )}
      </div>
    </div>
  );
};