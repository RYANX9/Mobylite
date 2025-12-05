// components/shared/PriceAlertModal.tsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Phone } from './types';

interface PriceAlertModalProps {
  show: boolean;
  onClose: () => void;
  phone: Phone | null;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({ show, onClose, phone }) => {
  const [email, setEmail] = useState('');
  const [targetPrice, setTargetPrice] = useState('');

  if (!show || !phone) return null;

  const handleSubmit = () => {
    alert(`Price alert set for ${phone.model_name} at $${targetPrice}`);
    onClose();
    setEmail('');
    setTargetPrice('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg md:text-xl font-bold text-black">Set Price Alert</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black">
            <X size={24} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Get notified when {phone.model_name} drops below your target price.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black text-sm font-medium focus:border-black focus:outline-none"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Target Price (USD)</label>
            <input
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black text-sm font-medium focus:border-black focus:outline-none"
              placeholder="599"
            />
          </div>
          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all"
          >
            Set Alert
          </button>
        </div>
      </div>
    </div>
  );
};