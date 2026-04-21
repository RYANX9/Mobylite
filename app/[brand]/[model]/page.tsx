'use client'
import { useState, useEffect } from 'react'
import { notFound, useParams } from 'next/navigation'
import { Phone } from '../../../lib/types'
import { api } from '@/lib/api'
import DesktopDetail from '../../components/desktop/DesktopDetail'
import MobileDetail from '../../components/mobile/MobileDetail'
import { PhoneDetailSkeleton, PhoneDetailSkeletonMobile } from '../../components/shared/Skeleton'

export default function PhoneDetailPage() {
  const params = useParams()
  const [phone, setPhone] = useState<Phone | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFoundError, setNotFoundError] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => setIsDesktop(window.innerWidth >= 1024)
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  useEffect(() => {
    if (!params.brand || !params.model) return

    setPhone(null)
    setLoading(true)
    setNotFoundError(false)

    const fetchPhone = async () => {
      try {
        const brand = decodeURIComponent(params.brand as string)
        const modelSlug = decodeURIComponent(params.model as string)
        const modelName = modelSlug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')

        const searchData = await api.phones.search({
          q: `${brand} ${modelName}`,
          page_size: 5,
        })

        if (!searchData.results?.length) {
          setNotFoundError(true)
          return
        }

        // Find best match — prefer exact brand match
        const match = searchData.results.find(
          (r: Phone) => r.brand.toLowerCase() === brand.toLowerCase()
        ) || searchData.results[0]

        const fullPhone = await api.phones.getDetails(match.id)
        setPhone(fullPhone)
      } catch {
        setNotFoundError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchPhone()
  }, [params.brand, params.model])

  if (loading) {
    return isDesktop ? <PhoneDetailSkeleton /> : <PhoneDetailSkeletonMobile />
  }

  if (notFoundError || !phone) {
    notFound()
  }

  if (!isDesktop) return <MobileDetail phone={phone!} />
  return <DesktopDetail phone={phone!} />
}
