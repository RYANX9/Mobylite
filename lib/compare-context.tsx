'use client'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { Phone } from './types'
import { createPhoneSlug, APP_ROUTES } from './config'

interface CompareContextType {
  list: Phone[]
  add: (phone: Phone) => boolean
  remove: (phoneId: number) => void
  clear: () => void
  has: (phoneId: number) => boolean
  navigate: () => void
  isFull: boolean
}

const CompareContext = createContext<CompareContextType | null>(null)

export function CompareProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [list, setList] = useState<Phone[]>([])

  const add = useCallback((phone: Phone): boolean => {
    let added = false
    setList(prev => {
      if (prev.length >= 4) return prev
      if (prev.some(p => p.id === phone.id)) return prev
      added = true
      return [...prev, phone]
    })
    return added
  }, [])

  const remove = useCallback((phoneId: number) => {
    setList(prev => prev.filter(p => p.id !== phoneId))
  }, [])

  const clear = useCallback(() => setList([]), [])

  const has = useCallback(
    (phoneId: number) => list.some(p => p.id === phoneId),
    [list]
  )

  const navigate = useCallback(() => {
    if (list.length === 0) return
    const slugs = list.map(createPhoneSlug)
    router.push(APP_ROUTES.compare(slugs))
  }, [list, router])

  return (
    <CompareContext.Provider
      value={{ list, add, remove, clear, has, navigate, isFull: list.length >= 4 }}
    >
      {children}
    </CompareContext.Provider>
  )
}

export function useCompare(): CompareContextType {
  const ctx = useContext(CompareContext)
  if (!ctx) throw new Error('useCompare must be used within CompareProvider')
  return ctx
}
