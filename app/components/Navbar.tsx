'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Search, ChevronDown, X, Menu } from 'lucide-react'
import { api } from '@/lib/api'
import { ROUTES, brandSlug, phoneSlug } from '@/lib/config'
import { c, f } from '@/lib/tokens'
import type { Phone } from '@/lib/types'

interface NavbarProps {
  compareCount?: number
  onOpenCompare?: () => void
}

export default function Navbar({ compareCount = 0, onOpenCompare }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Phone[]>([])
  const [searching, setSearching] = useState(false)
  const [focused, setFocused] = useState(false)
  const [brands, setBrands] = useState<{ brand: string; count: number }[]>([])
  const [brandsOpen, setBrandsOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const brandsRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    api.brands.list().then(d => setBrands(d.brands.slice(0, 24))).catch(() => {})
  }, [])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (brandsRef.current && !brandsRef.current.contains(e.target as Node)) {
        setBrandsOpen(false)
      }
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
    setBrandsOpen(false)
  }, [pathname])

  const runSearch = useCallback((q: string) => {
    clearTimeout(timerRef.current)
    if (!q.trim()) { setResults([]); return }
    timerRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const d = await api.phones.search({ q, page_size: 6 })
        setResults(d.results)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 280)
  }, [])

  const handleQueryChange = (v: string) => {
    setQuery(v)
    runSearch(v)
  }

  const handlePhoneSelect = (phone: Phone) => {
    setQuery('')
    setResults([])
    setFocused(false)
    router.push(ROUTES.phone(brandSlug(phone.brand), phoneSlug(phone)))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setFocused(false)
    setResults([])
    router.push(`${ROUTES.home}?q=${encodeURIComponent(query.trim())}`)
  }

  const showDropdown = focused && (results.length > 0 || (searching && query.length > 0))

  return (
    <>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          height: 'var(--nav-h)',
          background: scrolled ? 'rgba(248,248,245,0.92)' : c.bg,
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: `1px solid ${c.border}`,
          transition: 'background 0.2s ease, box-shadow 0.2s ease',
          boxShadow: scrolled ? '0 1px 0 var(--border)' : 'none',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--max-w)',
            margin: '0 auto',
            padding: '0 var(--page-px)',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 24,
          }}
        >
          {/* Logo */}
          <Link
            href={ROUTES.home}
            style={{
              fontFamily: f.serif,
              fontSize: 22,
              color: c.primary,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              letterSpacing: '-0.4px',
            }}
          >
            <img
              src="/logo-red.svg"
              alt="Mobylite logo"
              style={{ height: '1em', width: 'auto' }}
            />
            Mobylite
          </Link>

          {/* Search — desktop */}
          <form
            onSubmit={handleSubmit}
            style={{ flex: 1, maxWidth: 520, position: 'relative' }}
            className="nav-search-wrap"
          >
            <div style={{ position: 'relative' }}>
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: c.text3,
                  pointerEvents: 'none',
                }}
              />
              <input
                ref={inputRef}
                value={query}
                onChange={e => handleQueryChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 150)}
                placeholder='Search phones or try "best camera under 500"'
                style={{
                  width: '100%',
                  height: 40,
                  padding: '0 36px 0 40px',
                  background: c.surface,
                  border: `1px solid ${focused ? c.primary : c.border}`,
                  borderRadius: 'var(--r-full)',
                  fontSize: 14,
                  color: c.text1,
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  boxShadow: focused ? '0 0 0 3px rgba(26,26,46,0.07)' : 'none',
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: c.text3,
                    display: 'flex',
                    padding: 2,
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Search dropdown */}
            {showDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                  borderRadius: 'var(--r-lg)',
                  boxShadow: 'var(--shadow-lg)',
                  overflow: 'hidden',
                  zIndex: 200,
                  animation: 'fadeIn 0.12s ease',
                }}
              >
                {results.map(phone => (
                  <button
                    key={phone.id}
                    type="button"
                    onMouseDown={() => handlePhoneSelect(phone)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      textAlign: 'left',
                      transition: 'background 0.1s',
                      borderBottom: `1px solid ${c.border}`,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        background: 'var(--bg)',
                        borderRadius: 'var(--r-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        overflow: 'hidden',
                      }}
                    >
                      {phone.main_image_url && (
                        <img
                          src={phone.main_image_url}
                          alt=""
                          style={{ width: 32, height: 32, objectFit: 'contain' }}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, color: c.text3, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 1 }}>
                        {phone.brand}
                      </div>
                      <div style={{ fontSize: 14, color: c.text1, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {phone.model_name}
                      </div>
                    </div>
                    {phone.price_usd && (
                      <div style={{ fontSize: 13, fontWeight: 600, color: c.text1, flexShrink: 0 }}>
                        ${phone.price_usd}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </form>

          {/* Nav links — desktop */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
            className="nav-links"
          >
            {/* Brands dropdown */}
            <div ref={brandsRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setBrandsOpen(o => !o)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '7px 12px',
                  fontSize: 14,
                  fontWeight: 500,
                  color: c.text2,
                  borderRadius: 'var(--r-sm)',
                  transition: 'all 0.15s',
                  background: brandsOpen ? 'rgba(26,26,46,0.05)' : 'transparent',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = c.text1; (e.currentTarget as HTMLElement).style.background = 'rgba(26,26,46,0.04)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = c.text2; (e.currentTarget as HTMLElement).style.background = brandsOpen ? 'rgba(26,26,46,0.05)' : 'transparent' }}
              >
                Brands
                <ChevronDown
                  size={12}
                  style={{ transition: 'transform 0.15s', transform: brandsOpen ? 'rotate(180deg)' : 'none' }}
                />
              </button>

              {brandsOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 360,
                    background: c.surface,
                    border: `1px solid ${c.border}`,
                    borderRadius: 'var(--r-xl)',
                    boxShadow: 'var(--shadow-xl)',
                    padding: 16,
                    zIndex: 200,
                    animation: 'fadeIn 0.12s ease',
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4 }}>
                    {brands.map(b => (
                      <Link
                        key={b.brand}
                        href={ROUTES.brand(brandSlug(b.brand))}
                        onClick={() => setBrandsOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: 'var(--r-sm)',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 500, color: c.text1 }}>{b.brand}</span>
                        <span style={{ fontSize: 11, color: c.text3 }}>{b.count}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link
              href={ROUTES.pick}
              style={{
                padding: '7px 12px',
                fontSize: 14,
                fontWeight: 500,
                color: c.accent,
                borderRadius: 'var(--r-sm)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-light)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              Help Me Choose
            </Link>

            {/* Compare badge */}
            <button
              onClick={onOpenCompare}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '7px 14px',
                fontSize: 14,
                fontWeight: 500,
                color: c.primary,
                border: `1px solid ${c.border}`,
                borderRadius: 'var(--r-full)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = c.primary; (e.currentTarget as HTMLElement).style.background = 'rgba(26,26,46,0.04)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = c.border; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              Compare
              {compareCount > 0 && (
                <span
                  style={{
                    background: c.accent,
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 5px',
                  }}
                >
                  {compareCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(o => !o)}
            style={{ color: c.text2, display: 'none', marginLeft: 'auto' }}
            className="nav-mobile-btn"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            top: 'var(--nav-h)',
            zIndex: 90,
            background: 'rgba(0,0,0,0.4)',
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            style={{
              width: 280,
              height: '100%',
              background: c.surface,
              padding: 20,
              animation: 'slideIn 0.2s ease',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <Link href={ROUTES.pick} style={{ display: 'block', padding: '10px 0', fontSize: 15, fontWeight: 600, color: c.accent }}>
              Help Me Choose
            </Link>
            <div style={{ height: 1, background: c.border, margin: '12px 0' }} />
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: c.text3, marginBottom: 8 }}>
              Brands
            </div>
            {brands.map(b => (
              <Link
                key={b.brand}
                href={ROUTES.brand(brandSlug(b.brand))}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, color: c.text1, borderBottom: `1px solid ${c.border}` }}
              >
                <span>{b.brand}</span>
                <span style={{ color: c.text3 }}>{b.count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-search-wrap { display: none !important; }
          .nav-links { display: none !important; }
          .nav-mobile-btn { display: flex !important; }
        }
      `}</style>
    </>
  )
}
