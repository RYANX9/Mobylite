import { color, font } from '@/lib/tokens'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: color.bg }}
    >
      <div className="text-center">
        <p
          className="text-8xl font-bold mb-4 leading-none"
          style={{ fontFamily: font.primary, color: color.text }}
        >
          404
        </p>
        <h1
          className="text-2xl font-bold mb-3"
          style={{ fontFamily: font.primary, color: color.text }}
        >
          Page not found
        </h1>
        <p className="text-sm mb-8" style={{ color: color.textMuted }}>
          The phone or page you're looking for doesn't exist.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 rounded-xl font-bold text-sm transition-all"
          style={{ backgroundColor: color.text, color: color.bg }}
        >
          Back to Mobylite
        </a>
      </div>
    </div>
  )
}
