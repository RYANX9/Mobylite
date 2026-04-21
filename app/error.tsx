'use client'
import { useEffect } from 'react'
import { color, font } from '@/lib/tokens'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: color.bg }}
    >
      <div className="text-center max-w-md">
        <h2
          className="text-2xl font-bold mb-4"
          style={{ fontFamily: font.primary, color: color.text }}
        >
          Something went wrong
        </h2>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: color.textMuted }}>
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-xl font-bold text-sm transition-all"
            style={{ backgroundColor: color.text, color: color.bg }}
          >
            Try again
          </button>
          <a
            href="/"
            className="px-6 py-3 rounded-xl font-bold text-sm transition-all"
            style={{ backgroundColor: color.borderLight, color: color.text }}
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  )
}
