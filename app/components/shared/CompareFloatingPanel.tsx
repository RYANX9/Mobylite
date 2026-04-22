'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import { X, GitCompare } from 'lucide-react'
import { ButtonPressFeedback } from './ButtonPressFeedback'
import { Phone } from '@/lib/types'
import { APP_ROUTES, createPhoneSlug } from '@/lib/config'
import { color } from '@/lib/tokens'

interface CompareFloatingPanelProps {
  compareList: Phone[]
  onRemove: (phoneId: number) => void
  onClear: () => void
  onCompare: () => void
  variant?: 'desktop' | 'mobile'
}

export const CompareFloatingPanel: React.FC<CompareFloatingPanelProps> = ({
  compareList,
  onRemove,
  onClear,
  onCompare,
  variant = 'desktop',
}) => {
  const router = useRouter()

  if (compareList.length === 0) return null

  const handleCompare = () => {
    const slugs = compareList.map(createPhoneSlug)
    router.push(APP_ROUTES.compare(slugs))
    onCompare()
  }

  // Clear removes phones from the list but does NOT navigate anywhere.
  // The parent manages the list state — clearing is purely a list operation.
  const handleClear = () => {
    onClear()
  }

  if (variant === 'mobile') {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 p-4 z-50"
        style={{ backgroundColor: color.bgInverse }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm" style={{ color: color.textInverse }}>
            Compare ({compareList.length}/4)
          </h3>
          <button onClick={handleClear} style={{ color: color.textMuted }}>
            <X size={18} />
          </button>
        </div>
        <ButtonPressFeedback
          onClick={handleCompare}
          className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
          style={{ backgroundColor: color.bg, color: color.text }}
        >
          <GitCompare size={16} />
          Compare Now
        </ButtonPressFeedback>
      </div>
    )
  }

  return (
    <div
      className="fixed bottom-8 right-8 rounded-2xl p-6 shadow-2xl z-40 w-72 border"
      style={{ backgroundColor: color.bgInverse, borderColor: color.border }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-base" style={{ color: color.textInverse }}>
          Compare ({compareList.length}/4)
        </h3>
        <button onClick={handleClear} style={{ color: color.textMuted }}>
          <X size={20} />
        </button>
      </div>

      <div className="space-y-2 mb-4">
        {compareList.map((phone) => (
          <div
            key={phone.id}
            className="flex items-center justify-between rounded-lg p-2"
            style={{ backgroundColor: `${color.bg}1A` }}
          >
            <span className="text-xs font-medium truncate flex-1" style={{ color: color.textInverse }}>
              {phone.model_name}
            </span>
            <button
              onClick={() => onRemove(phone.id)}
              className="ml-2 transition-colors"
              style={{ color: color.textMuted }}
              onMouseEnter={(e) => (e.currentTarget.style.color = color.textInverse)}
              onMouseLeave={(e) => (e.currentTarget.style.color = color.textMuted)}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <ButtonPressFeedback
        onClick={handleCompare}
        className="w-full py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
        style={{ backgroundColor: color.bg, color: color.text }}
      >
        <GitCompare size={16} />
        Compare
      </ButtonPressFeedback>
    </div>
  )
}
