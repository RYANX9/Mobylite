// components/shared/QuizModal.tsx
import React, { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { Filters } from './types';

interface QuizModalProps {
  show: boolean;
  onClose: () => void;
  onComplete: (filters: Partial<Filters>, useCase?: string) => void;
}

interface QuizAnswer {
  [key: string]: any;
}

export const QuizModal: React.FC<QuizModalProps> = ({ show, onClose, onComplete }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer>({});

  if (!show) return null;

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
      q: 'What matters most to you?',
      key: 'useCase',
      options: [
        { label: 'Gaming performance', value: 'gamer' },
        { label: 'Camera quality', value: 'photographer' },
        { label: 'Battery life', value: 'battery' },
        { label: 'Overall premium features', value: 'flagship' },
      ]
    },
    {
      q: 'Which operating system do you prefer?',
      key: 'os',
      options: [
        { label: 'Android', value: 'Android' },
        { label: 'iOS (Apple)', value: 'iOS' },
        { label: 'No preference', value: null },
      ]
    },
    {
      q: 'How much RAM do you need?',
      key: 'ram',
      options: [
        { label: '4 GB - Basic usage', value: 4 },
        { label: '6 GB - Moderate usage', value: 6 },
        { label: '8 GB - Heavy usage', value: 8 },
        { label: '12 GB or more - Gaming/Pro', value: 12 },
        { label: 'No preference', value: null },
      ]
    },
    {
      q: 'How important is battery life?',
      key: 'battery',
      options: [
        { label: 'Very important (5000+ mAh)', value: 5000 },
        { label: 'Important (4000+ mAh)', value: 4000 },
        { label: 'Moderate (3000+ mAh)', value: 3000 },
        { label: 'Not important', value: null },
      ]
    },
    {
      q: 'How much storage do you need?',
      key: 'storage',
      options: [
        { label: '64 GB - Light user', value: 64 },
        { label: '128 GB - Average user', value: 128 },
        { label: '256 GB - Heavy user', value: 256 },
        { label: '512 GB or more - Power user', value: 512 },
        { label: 'No preference', value: null },
      ]
    },
    {
      q: 'What about the camera?',
      key: 'camera',
      options: [
        { label: 'Professional quality (64+ MP)', value: 64 },
        { label: 'Great quality (48+ MP)', value: 48 },
        { label: 'Good enough (12+ MP)', value: 12 },
        { label: 'Not important', value: null },
      ]
    },
    {
      q: 'Do you need 5G?',
      key: '5g',
      options: [
        { label: 'Yes, 5G is essential', value: true },
        { label: 'No, 4G is fine', value: false },
        { label: 'No preference', value: null },
      ]
    },
    {
      q: 'How new should the phone be?',
      key: 'year',
      options: [
        { label: 'Latest (2024-2025)', value: 2024 },
        { label: 'Recent (2023+)', value: 2023 },
        { label: 'Modern (2022+)', value: 2022 },
        { label: 'Any year', value: null },
      ]
    },
    {
      q: 'Any brand preference?',
      key: 'brand',
      options: [
        { label: 'Apple', value: 'Apple' },
        { label: 'Samsung', value: 'Samsung' },
        { label: 'Google', value: 'Google' },
        { label: 'OnePlus', value: 'OnePlus' },
        { label: 'Xiaomi', value: 'Xiaomi' },
        { label: 'No preference', value: null },
      ]
    }
  ];

  const handleAnswer = (option: any) => {
    const newAnswers = { ...answers, [questions[step].key]: option };
    setAnswers(newAnswers);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      applyQuizFilters(newAnswers);
    }
  };

  const applyQuizFilters = (quizAnswers: QuizAnswer) => {
    const newFilters: Partial<Filters> = {};

    if (quizAnswers.budget) {
      if (quizAnswers.budget.minPrice) newFilters.min_price = quizAnswers.budget.minPrice;
      if (quizAnswers.budget.maxPrice) newFilters.max_price = quizAnswers.budget.maxPrice;
    }
    if (quizAnswers.os?.value) newFilters.os = quizAnswers.os.value;
    if (quizAnswers.ram?.value) newFilters.min_ram = quizAnswers.ram.value;
    if (quizAnswers.battery?.value) newFilters.min_battery = quizAnswers.battery.value;
    if (quizAnswers.storage?.value) newFilters.min_storage = quizAnswers.storage.value;
    if (quizAnswers.camera?.value) newFilters.min_camera_mp = quizAnswers.camera.value;
    if (quizAnswers['5g']?.value !== null && quizAnswers['5g']?.value !== undefined) {
      newFilters.has_5g = quizAnswers['5g'].value;
    }
    if (quizAnswers.year?.value) newFilters.min_year = quizAnswers.year.value;
    if (quizAnswers.brand?.value) newFilters.brands = [quizAnswers.brand.value];

    const useCase = quizAnswers.useCase?.value;
    onComplete(newFilters, useCase);
    
    setStep(0);
    setAnswers({});
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSkip = () => {
    const newAnswers = { ...answers, [questions[step].key]: { value: null } };
    setAnswers(newAnswers);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      applyQuizFilters(newAnswers);
    }
  };

  const handleClose = () => {
    onClose();
    setStep(0);
    setAnswers({});
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl p-6 md:p-8 max-w-2xl w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-black">Find Your Perfect Phone</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-black transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="mb-8">
          <div className="flex gap-1 mb-6">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                  i < step ? 'bg-green-500' : i === step ? 'bg-black' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          
          <div className="mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Question {step + 1} of {questions.length}
            </span>
          </div>
          
          <p className="text-xl md:text-2xl font-bold text-black mb-6">
            {questions[step].q}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {questions[step].options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(opt)}
              className="w-full p-4 md:p-5 text-left border-2 border-gray-200 rounded-xl hover:border-black hover:bg-gray-50 transition-all font-semibold text-black group"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm md:text-base">{opt.label}</span>
                <ArrowRight size={20} className="text-gray-300 group-hover:text-black transition-colors" />
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className={`px-4 md:px-6 py-3 rounded-xl font-bold transition-all text-sm md:text-base ${
              step === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-black hover:bg-gray-100'
            }`}
          >
            Back
          </button>
          
          <div className="text-xs md:text-sm text-gray-500 font-medium">
            {Math.round(((step + 1) / questions.length) * 100)}% Complete
          </div>
          
          <button
            onClick={handleSkip}
            className="px-4 md:px-6 py-3 rounded-xl font-bold text-gray-600 hover:text-black hover:bg-gray-100 transition-all text-sm md:text-base"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};