'use client';
import React, { useState } from 'react';
import { X, ArrowRight, Check } from 'lucide-react';

const ButtonPressFeedback = ({ children, className = '', onClick, disabled = false }) => (
  <button
    className={`active:scale-95 transition-all duration-150 touch-manipulation ${className} ${
      disabled ? 'opacity-40 cursor-not-allowed' : ''
    }`}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

// Filters Modal Component
export function FiltersModal({ 
  showFilters, 
  setShowFilters, 
  filters, 
  setFilters, 
  handleResetFilters 
}) {
  if (!showFilters) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex flex-col">
      <div className="bg-white h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-black">Filters</h2>
          <div className="flex items-center gap-3">
            <ButtonPressFeedback
              onClick={handleResetFilters}
              className="text-xs font-semibold text-gray-600"
            >
              Reset
            </ButtonPressFeedback>
            <button onClick={() => setShowFilters(false)} className="text-gray-400">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Price Range */}
          <div>
            <label className="block text-sm font-bold text-black mb-3">Price Range (USD)</label>
            <div className="space-y-3">
              <input
                type="number"
                placeholder="Min Price"
                value={filters.min_price || ''}
                onChange={(e) =>
                  setFilters({ ...filters, min_price: e.target.value ? Number(e.target.value) : null })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black text-sm font-medium focus:border-black focus:outline-none"
              />
              <input
                type="number"
                placeholder="Max Price"
                value={filters.max_price || ''}
                onChange={(e) =>
                  setFilters({ ...filters, max_price: e.target.value ? Number(e.target.value) : null })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black text-sm font-medium focus:border-black focus:outline-none"
              />
            </div>
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-bold text-black mb-3">Brand</label>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value && !filters.brands.includes(e.target.value)) {
                  setFilters({ ...filters, brands: [...filters.brands, e.target.value] });
                }
              }}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black text-sm font-medium focus:border-black focus:outline-none bg-white"
            >
              <option value="">Select brand...</option>
              <option value="Apple">Apple</option>
              <option value="Samsung">Samsung</option>
              <option value="Google">Google</option>
              <option value="OnePlus">OnePlus</option>
              <option value="Xiaomi">Xiaomi</option>
              <option value="Oppo">Oppo</option>
              <option value="Vivo">Vivo</option>
              <option value="Realme">Realme</option>
              <option value="Motorola">Motorola</option>
              <option value="Nokia">Nokia</option>
            </select>
            {filters.brands.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {filters.brands.map((brand) => (
                  <div
                    key={brand}
                    className="flex items-center gap-2 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full"
                  >
                    {brand}
                    <button
                      onClick={() =>
                        setFilters({ ...filters, brands: filters.brands.filter((b) => b !== brand) })
                      }
                      className="hover:text-gray-300"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Operating System */}
          <div>
            <label className="block text-sm font-bold text-black mb-3">Operating System</label>
            <select
              value={filters.os || ''}
              onChange={(e) => setFilters({ ...filters, os: e.target.value || null })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black text-sm font-medium focus:border-black focus:outline-none bg-white"
            >
              <option value="">Any</option>
              <option value="Android">Android</option>
              <option value="iOS">iOS</option>
            </select>
          </div>

          {/* RAM */}
          <div>
            <label className="block text-sm font-bold text-black mb-3">Minimum RAM</label>
            <select
              value={filters.min_ram || ''}
              onChange={(e) => setFilters({ ...filters, min_ram: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black text-sm font-medium focus:border-black focus:outline-none bg-white"
            >
              <option value="">Any</option>
              <option value="4">4 GB</option>
              <option value="6">6 GB</option>
              <option value="8">8 GB</option>
              <option value="12">12 GB</option>
              <option value="16">16 GB</option>
            </select>
          </div>

          {/* Storage */}
          <div>
            <label className="block text-sm font-bold text-black mb-3">Minimum Storage</label>
            <select
              value={filters.min_storage || ''}
              onChange={(e) => setFilters({ ...filters, min_storage: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black text-sm font-medium focus:border-black focus:outline-none bg-white"
            >
              <option value="">Any</option>
              <option value="64">64 GB</option>
              <option value="128">128 GB</option>
              <option value="256">256 GB</option>
              <option value="512">512 GB</option>
              <option value="1024">1 TB</option>
            </select>
          </div>

          {/* Battery */}
          <div>
            <label className="block text-sm font-bold text-black mb-3">Minimum Battery</label>
            <select
              value={filters.min_battery || ''}
              onChange={(e) => setFilters({ ...filters, min_battery: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black text-sm font-medium focus:border-black focus:outline-none bg-white"
            >
              <option value="">Any</option>
              <option value="3000">3000 mAh</option>
              <option value="4000">4000 mAh</option>
              <option value="5000">5000 mAh</option>
              <option value="6000">6000 mAh</option>
            </select>
          </div>

          {/* Camera */}
          <div>
            <label className="block text-sm font-bold text-black mb-3">Minimum Camera</label>
            <select
              value={filters.min_camera_mp || ''}
              onChange={(e) =>
                setFilters({ ...filters, min_camera_mp: e.target.value ? Number(e.target.value) : null })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black text-sm font-medium focus:border-black focus:outline-none bg-white"
            >
              <option value="">Any</option>
              <option value="12">12 MP</option>
              <option value="48">48 MP</option>
              <option value="64">64 MP</option>
              <option value="108">108 MP</option>
            </select>
          </div>

          {/* Screen Size */}
          <div>
            <label className="block text-sm font-bold text-black mb-3">Screen Size</label>
            <select
              value={filters.screen_size || ''}
              onChange={(e) => setFilters({ ...filters, screen_size: e.target.value || null })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black text-sm font-medium focus:border-black focus:outline-none bg-white"
            >
              <option value="">Any</option>
              <option value="small">Small (under 6")</option>
              <option value="medium">Medium (6" to 6.5")</option>
              <option value="large">Large (over 6.5")</option>
            </select>
          </div>

          {/* 5G Support */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.has_5g === true}
                onChange={(e) => setFilters({ ...filters, has_5g: e.target.checked ? true : null })}
                className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
              />
              <span className="text-sm font-bold text-black">5G Support</span>
            </label>
          </div>

          {/* Release Year */}
          <div>
            <label className="block text-sm font-bold text-black mb-3">Release Year</label>
            <select
              value={filters.min_year || ''}
              onChange={(e) => setFilters({ ...filters, min_year: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black text-sm font-medium focus:border-black focus:outline-none bg-white"
            >
              <option value="">Any</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
            </select>
          </div>
        </div>

        {/* Apply Button */}
        <div className="p-4 border-t border-gray-200">
          <ButtonPressFeedback
            onClick={() => setShowFilters(false)}
            className="w-full py-4 bg-black text-white rounded-xl font-bold text-sm"
          >
            Apply Filters
          </ButtonPressFeedback>
        </div>
      </div>
    </div>
  );
}

// Sort Modal Component
export function SortModal({ showSort, setShowSort, sortBy, sortOrder, setSortBy, setSortOrder }) {
  if (!showSort) return null;

  const sortOptions = [
    { value: 'release_year-desc', label: 'Newest First' },
    { value: 'release_year-asc', label: 'Oldest First' },
    { value: 'price_usd-asc', label: 'Price: Low to High' },
    { value: 'price_usd-desc', label: 'Price: High to Low' },
  ];

  const currentSort = `${sortBy}-${sortOrder}`;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl p-4 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-black">Sort By</h2>
          <button onClick={() => setShowSort(false)} className="text-gray-400">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-2">
          {sortOptions.map((option) => (
            <ButtonPressFeedback
              key={option.value}
              onClick={() => {
                const [newSortBy, newSortOrder] = option.value.split('-');
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
                setShowSort(false);
              }}
              className={`w-full p-4 text-left border-2 rounded-xl font-semibold flex items-center justify-between ${
                currentSort === option.value
                  ? 'border-black bg-gray-50'
                  : 'border-gray-200'
              }`}
            >
              <span>{option.label}</span>
              {currentSort === option.value && <Check size={20} />}
            </ButtonPressFeedback>
          ))}
        </div>
      </div>
    </div>
  );
}

// Quiz Modal Component - FIXED TO USE FILTERS ONLY
export function QuizModal({ 
  showQuiz, 
  setShowQuiz, 
  setFilters,
  setActiveRecommendation // NEW: to clear active recommendation
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const questions = [
    {
      q: 'What is your budget?',
      key: 'budget',
      options: [
        { label: 'Under $300', value: 'budget', maxPrice: 300 },
        { label: '$300-$600', value: 'mid', minPrice: 300, maxPrice: 600 },
        { label: '$600-$1000', value: 'high', minPrice: 600, maxPrice: 1000 },
        { label: 'Above $1000', value: 'flagship', minPrice: 1000 },
      ]
    },
    {
      q: 'What matters most?',
      key: 'useCase',
      options: [
        { label: 'Gaming performance', value: 'gamer', ram: 8 },
        { label: 'Camera quality', value: 'photographer', camera: 48 },
        { label: 'Battery life', value: 'battery', battery: 5000 },
        { label: 'Premium features', value: 'flagship', ram: 12 },
      ]
    },
    {
      q: 'Preferred OS?',
      key: 'os',
      options: [
        { label: 'Android', value: 'Android' },
        { label: 'iOS (Apple)', value: 'iOS' },
        { label: 'No preference', value: null },
      ]
    },
    {
      q: 'How much RAM?',
      key: 'ram',
      options: [
        { label: '4 GB - Basic', value: 4 },
        { label: '6 GB - Moderate', value: 6 },
        { label: '8 GB - Heavy', value: 8 },
        { label: '12 GB+ - Gaming', value: 12 },
        { label: 'No preference', value: null },
      ]
    },
    {
      q: 'Battery importance?',
      key: 'battery',
      options: [
        { label: 'Very (5000+ mAh)', value: 5000 },
        { label: 'Important (4000+ mAh)', value: 4000 },
        { label: 'Moderate (3000+ mAh)', value: 3000 },
        { label: 'Not important', value: null },
      ]
    },
  ];

  const handleAnswer = (option) => {
    const newAnswers = { ...answers, [questions[step].key]: option };
    setAnswers(newAnswers);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      applyQuizFilters(newAnswers);
    }
  };

  const applyQuizFilters = (quizAnswers) => {
    // Build filters based on quiz answers
    const newFilters = {
      min_price: null,
      max_price: null,
      min_ram: null,
      min_battery: null,
      min_camera_mp: null,
      min_year: null,
      brands: [],
      has_5g: null,
      min_storage: null,
      screen_size: null,
      os: null,
    };

    // Budget filters
    if (quizAnswers.budget) {
      if (quizAnswers.budget.minPrice) newFilters.min_price = quizAnswers.budget.minPrice;
      if (quizAnswers.budget.maxPrice) newFilters.max_price = quizAnswers.budget.maxPrice;
    }

    // OS filter
    if (quizAnswers.os?.value) {
      newFilters.os = quizAnswers.os.value;
    }

    // RAM filter - combine from both useCase and explicit ram question
    const ramFromUseCase = quizAnswers.useCase?.ram;
    const ramFromQuestion = quizAnswers.ram?.value;
    if (ramFromQuestion) {
      newFilters.min_ram = ramFromQuestion;
    } else if (ramFromUseCase) {
      newFilters.min_ram = ramFromUseCase;
    }

    // Battery filter
    const batteryFromUseCase = quizAnswers.useCase?.battery;
    const batteryFromQuestion = quizAnswers.battery?.value;
    if (batteryFromQuestion) {
      newFilters.min_battery = batteryFromQuestion;
    } else if (batteryFromUseCase) {
      newFilters.min_battery = batteryFromUseCase;
    }

    // Camera filter from use case
    if (quizAnswers.useCase?.camera) {
      newFilters.min_camera_mp = quizAnswers.useCase.camera;
    }

    // Apply the filters - this will trigger normal search
    setFilters(newFilters);
    
    // Clear any active recommendation so normal filter search runs
    if (setActiveRecommendation) {
      setActiveRecommendation(null);
    }
    
    // Close modal and reset
    setShowQuiz(false);
    setStep(0);
    setAnswers({});
  };

  if (!showQuiz) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-black">Find Perfect Phone</h2>
          <button 
            onClick={() => {
              setShowQuiz(false);
              setStep(0);
              setAnswers({});
            }} 
            className="text-gray-400"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex gap-1 mb-4">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full ${
                  i < step ? 'bg-green-500' : i === step ? 'bg-black' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          
          <div className="mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">
              {step + 1} of {questions.length}
            </span>
          </div>
          
          <p className="text-xl font-bold text-black mb-4">
            {questions[step].q}
          </p>

          <div className="space-y-2">
            {questions[step].options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-xl font-semibold text-black active:scale-95 transition-all flex items-center justify-between"
              >
                <span className="text-sm">{opt.label}</span>
                <ArrowRight size={18} className="text-gray-300" />
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-between items-center">
          <ButtonPressFeedback
            onClick={() => step > 0 && setStep(step - 1)}
            disabled={step === 0}
            className="px-4 py-2 rounded-xl font-bold text-sm"
          >
            Back
          </ButtonPressFeedback>
          
          <div className="text-xs text-gray-500 font-medium">
            {Math.round(((step + 1) / questions.length) * 100)}%
          </div>
          
          <ButtonPressFeedback
            onClick={() => {
              const newAnswers = { ...answers, [questions[step].key]: { value: null } };
              setAnswers(newAnswers);
              if (step < questions.length - 1) {
                setStep(step + 1);
              } else {
                applyQuizFilters(newAnswers);
              }
            }}
            className="px-4 py-2 rounded-xl font-bold text-sm text-gray-600"
          >
            Skip
          </ButtonPressFeedback>
        </div>
      </div>
    </div>
  );
}

// Price Alert Modal Component
export function PriceAlertModal({ 
  showPriceAlert, 
  setShowPriceAlert, 
  selectedPhoneForAlert 
}) {
  const [email, setEmail] = useState('');
  const [targetPrice, setTargetPrice] = useState('');

  const handleSubmit = () => {
    alert(`Price alert set for ${selectedPhoneForAlert.model_name} at $${targetPrice}`);
    setShowPriceAlert(false);
    setEmail('');
    setTargetPrice('');
  };

  if (!showPriceAlert) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-black">Set Price Alert</h2>
          <button onClick={() => setShowPriceAlert(false)} className="text-gray-400">
            <X size={24} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Get notified when {selectedPhoneForAlert?.model_name} drops below your target.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-black mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black text-sm font-medium focus:border-black focus:outline-none"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-black mb-2">Target Price (USD)</label>
            <input
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black text-sm font-medium focus:border-black focus:outline-none"
              placeholder="599"
            />
          </div>
          <ButtonPressFeedback
            onClick={handleSubmit}
            className="w-full py-3 bg-black text-white rounded-xl font-bold text-sm"
          >
            Set Alert
          </ButtonPressFeedback>
        </div>
      </div>
    </div>
  );
}