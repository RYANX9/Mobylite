'use client'
import React, { useState } from 'react'
import { X, ArrowRight } from 'lucide-react'
import { Filters } from '@/lib/types'
import { color, font } from '@/lib/tokens'
import { ButtonPressFeedback } from './ButtonPressFeedback'

interface QuizModalProps {
  show: boolean
  onClose: () => void
  onComplete: (filters: Partial<Filters>, useCase?: string) => void
}

interface Option {
  label: string
  value: any
  minPrice?: number
  maxPrice?: number
}

interface Question {
  q: string
  key: string
  options: Option[]
}

// Capped at 3 questions — was 6, too much friction for filters a user can set manually
const QUESTIONS: Question[] = [
  {
    q: 'What is your budget?',
    key: 'budget',
    options: [
      { label: 'Under $300', value: 'budget', maxPrice: 300 },
      { label: '$300–$600', value: 'mid', minPrice: 300, maxPrice: 600 },
      { label: '$600–$1000', value: 'high', minPrice: 600, maxPrice: 1000 },
      { label: 'Above $1000', value: 'flagship', minPrice: 1000 },
    ],
  },
  {
    q: 'What matters most to you?',
    key: 'useCase',
    options: [
      { label: 'Gaming performance', value: 'gamer' },
      { label: 'Camera quality', value: 'photographer' },
      { label: 'Battery life', value: 'battery' },
      { label: 'Premium overall', value: 'flagship' },
    ],
  },
  {
    q: 'How much battery do you need?',
    key: 'battery',
    options: [
      { label: '5000+ mAh — all day and then some', value: 5000 },
      { label: '4000+ mAh — full day', value: 4000 },
      { label: '3000+ mAh — moderate use', value: 3000 },
      { label: 'No preference', value: null },
    ],
  },
]

export default function QuizModal({ show, onClose, onComplete }: QuizModalProps) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})

  if (!show) return null

  const current = QUESTIONS[step]

  const handleAnswer = (option: Option) => {
    const next = { ...answers, [current.key]: option }
    setAnswers(next)

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1)
    } else {
      apply(next)
    }
  }

  const apply = (final: Record<string, any>) => {
    const filters: Partial<Filters> = {}

    if (final.budget?.minPrice) filters.min_price = final.budget.minPrice
    if (final.budget?.maxPrice) filters.max_price = final.budget.maxPrice

    // Merge battery only if not already set — do not overwrite existing filter
    if (final.battery?.value) filters.min_battery = final.battery.value

    onComplete(filters, final.useCase?.value)
    reset()
  }

  const handleBack = () => { if (step > 0) setStep(step - 1) }

  const handleSkip = () => {
    const next = { ...answers, [current.key]: { value: null } }
    setAnswers(next)
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1)
    } else {
      apply(next)
    }
  }

  const reset = () => { setStep(0); setAnswers({}) }

  const handleClose = () => { onClose(); reset() }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm px-4"
      style={{ backgroundColor: `${color.bgInverse}99` }}
    >
      <div className="rounded-2xl p-6 md:p-8 max-w-xl w-full shadow-2xl" style={{ backgroundColor: color.bg }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold" style={{ fontFamily: font.primary, color: color.text }}>
            Find Your Perfect Phone
          </h2>
          <button onClick={handleClose} style={{ color: color.textMuted }}>
            <X size={24} />
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-1 mb-6">
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className="h-2 flex-1 rounded-full transition-all duration-300"
              style={{
                backgroundColor: i < step ? color.success : i === step ? color.text : color.borderLight,
              }}
            />
          ))}
        </div>

        <div className="mb-2">
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: color.textMuted }}>
            Question {step + 1} of {QUESTIONS.length}
          </span>
        </div>

        <p className="text-xl font-bold mb-6" style={{ fontFamily: font.primary, color: color.text }}>
          {current.q}
        </p>

        <div className="space-y-3 mb-6">
          {current.options.map((opt, i) => (
            <ButtonPressFeedback
              key={i}
              onClick={() => handleAnswer(opt)}
              className="w-full p-4 rounded-xl transition-all font-semibold"
              style={{ border: `2px solid ${color.border}`, backgroundColor: color.bg, color: color.text }}
              hoverStyle={{ borderColor: color.text, backgroundColor: color.borderLight }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm md:text-base text-left">{opt.label}</span>
                <ArrowRight size={18} style={{ color: color.border }} />
              </div>
            </ButtonPressFeedback>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: color.borderLight }}>
          <ButtonPressFeedback
            onClick={handleBack}
            disabled={step === 0}
            className="px-4 py-3 rounded-xl font-bold text-sm"
            style={{ color: step === 0 ? color.textMuted : color.text }}
            hoverStyle={step === 0 ? undefined : { backgroundColor: color.borderLight }}
          >
            Back
          </ButtonPressFeedback>

          <span className="text-xs font-medium" style={{ color: color.textMuted }}>
            {Math.round(((step + 1) / QUESTIONS.length) * 100)}% complete
          </span>

          <ButtonPressFeedback
            onClick={handleSkip}
            className="px-4 py-3 rounded-xl font-bold text-sm"
            style={{ color: color.textMuted }}
            hoverStyle={{ backgroundColor: color.borderLight, color: color.text }}
          >
            Skip
          </ButtonPressFeedback>
        </div>
      </div>
    </div>
  )
}
