'use client';
import React, { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { Filters } from '@/lib/types';
import { color, font } from '@/lib/tokens';
import { ButtonPressFeedback } from './ButtonPressFeedback';

interface QuizAnswer {
  [key: string]: any;
}

interface QuizModalProps {
  show: boolean;
  onClose: () => void;
  onComplete: (filters: Partial<Filters>, useCase?: string) => void;
}

export default function QuizModal({ show, onClose, onComplete }: QuizModalProps) {
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
    if (quizAnswers.ram?.value) newFilters.min_ram = quizAnswers.ram.value;
    if (quizAnswers.battery?.value) newFilters.min_battery = quizAnswers.battery.value;
    if (quizAnswers.storage?.value) newFilters.min_storage = quizAnswers.storage.value;
    if (quizAnswers.camera?.value) newFilters.min_camera_mp = quizAnswers.camera.value;

    // NOTE: useCase is intentionally NOT passed here to avoid triggering recommendations
    // The parent component can use it for UI hints if needed, but filters are applied purely

    onComplete(newFilters, quizAnswers.useCase?.value);
    
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

  const progressBarStyle = (index: number): React.CSSProperties => {
    if (index < step) return { backgroundColor: color.success };
    if (index === step) return { backgroundColor: color.text };
    return { backgroundColor: color.borderLight };
  };

  const optionButtonStyle: React.CSSProperties = {
    border: `2px solid ${color.border}`,
    backgroundColor: color.bg,
    color: color.text,
  };

  const optionHoverStyle: React.CSSProperties = {
    borderColor: color.text,
    backgroundColor: color.borderLight,
  };

  const modalBackdropStyle: React.CSSProperties = {
    backgroundColor: `${color.bgInverse}99`,
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm px-4"
      style={modalBackdropStyle}
    >
      <div 
        className="rounded-2xl p-6 md:p-8 max-w-2xl w-full shadow-2xl"
        style={{ backgroundColor: color.bg }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 
            className="text-xl md:text-2xl font-bold"
            style={{ fontFamily: font.primary, color: color.text }}
          >
            Find Your Perfect Phone
          </h2>
          <button 
            onClick={handleClose} 
            style={{ color: color.textMuted }}
            onMouseEnter={(e) => e.currentTarget.style.color = color.text}
            onMouseLeave={(e) => e.currentTarget.style.color = color.textMuted}
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="mb-8">
          <div className="flex gap-1 mb-6">
            {questions.map((_, i) => (
              <div
                key={i}
                className="h-2 flex-1 rounded-full transition-all duration-300"
                style={progressBarStyle(i)}
              />
            ))}
          </div>
          
          <div className="mb-2">
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: color.textMuted }}>
              Question {step + 1} of {questions.length}
            </span>
          </div>
          
          <p 
            className="text-xl md:text-2xl font-bold mb-6"
            style={{ fontFamily: font.primary, color: color.text }}
          >
            {questions[step].q}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {questions[step].options.map((opt, i) => (
            <ButtonPressFeedback
              key={i}
              onClick={() => handleAnswer(opt)}
              className="w-full p-4 md:p-5 rounded-xl transition-all font-semibold"
              style={optionButtonStyle}
              hoverStyle={optionHoverStyle}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm md:text-base">{opt.label}</span>
                <ArrowRight size={20} style={{ color: color.border }} />
              </div>
            </ButtonPressFeedback>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: color.borderLight }}>
          <ButtonPressFeedback
            onClick={handleBack}
            disabled={step === 0}
            className="px-4 md:px-6 py-3 rounded-xl font-bold transition-all text-sm md:text-base"
            style={{ color: step === 0 ? color.textMuted : color.text }}
            hoverStyle={step === 0 ? undefined : { backgroundColor: color.borderLight }}
          >
            Back
          </ButtonPressFeedback>
          
          <div className="text-xs md:text-sm font-medium" style={{ color: color.textMuted }}>
            {Math.round(((step + 1) / questions.length) * 100)}% Complete
          </div>
          
          <ButtonPressFeedback
            onClick={handleSkip}
            className="px-4 md:px-6 py-3 rounded-xl font-bold transition-all text-sm md:text-base"
            style={{ color: color.textMuted }}
            hoverStyle={{ backgroundColor: color.borderLight, color: color.text }}
          >
            Skip
          </ButtonPressFeedback>
        </div>
      </div>
    </div>
  );
}