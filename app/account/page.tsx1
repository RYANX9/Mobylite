import { color } from '@/lib/tokens'

export const PhoneCardSkeleton = () => (
  <div
    className="rounded-2xl overflow-hidden animate-pulse"
    style={{ border: `1px solid var(--color-border-light)`, backgroundColor: 'var(--color-bg)' }}
  >
    <div className="w-full h-48" style={{ backgroundColor: 'var(--color-border-light)' }} />
    <div className="p-5 space-y-3">
      <div className="h-2 w-16 rounded" style={{ backgroundColor: 'var(--color-border-light)' }} />
      <div className="h-4 w-full rounded" style={{ backgroundColor: 'var(--color-border-light)' }} />
      <div className="h-4 w-3/4 rounded" style={{ backgroundColor: 'var(--color-border-light)' }} />
      <div className="h-6 w-1/3 rounded" style={{ backgroundColor: 'var(--color-border-light)' }} />
    </div>
    <div className="px-5 pb-5 flex gap-2">
      <div className="flex-1 h-9 rounded-lg" style={{ backgroundColor: 'var(--color-border-light)' }} />
      <div className="w-9 h-9 rounded-lg" style={{ backgroundColor: 'var(--color-border-light)' }} />
      <div className="w-9 h-9 rounded-lg" style={{ backgroundColor: 'var(--color-border-light)' }} />
    </div>
  </div>
)

export const PhoneCardSkeletonMobile = () => (
  <div
    className="rounded-2xl overflow-hidden animate-pulse"
    style={{ border: `1px solid var(--color-border-light)`, backgroundColor: 'var(--color-bg)' }}
  >
    <div className="w-full h-44" style={{ backgroundColor: 'var(--color-border-light)' }} />
    <div className="p-4 space-y-2">
      <div className="h-2 w-12 rounded" style={{ backgroundColor: 'var(--color-border-light)' }} />
      <div className="h-4 w-full rounded" style={{ backgroundColor: 'var(--color-border-light)' }} />
      <div className="h-4 w-2/3 rounded" style={{ backgroundColor: 'var(--color-border-light)' }} />
      <div className="h-5 w-1/3 rounded" style={{ backgroundColor: 'var(--color-border-light)' }} />
    </div>
    <div className="px-3 pb-4 flex gap-1.5">
      <div className="flex-1 h-9 rounded-xl" style={{ backgroundColor: 'var(--color-border-light)' }} />
      <div className="w-9 h-9 rounded-xl" style={{ backgroundColor: 'var(--color-border-light)' }} />
      <div className="w-9 h-9 rounded-xl" style={{ backgroundColor: 'var(--color-border-light)' }} />
    </div>
  </div>
)

export const PhoneGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-4 gap-5">
    {Array.from({ length: count }, (_, i) => (
      <PhoneCardSkeleton key={i} />
    ))}
  </div>
)

export const PhoneGridSkeletonMobile = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-2 gap-3">
    {Array.from({ length: count }, (_, i) => (
      <PhoneCardSkeletonMobile key={i} />
    ))}
  </div>
)

export const PhoneDetailSkeleton = () => (
  <div className="max-w-7xl mx-auto px-8 py-12 animate-pulse">
    <div className="grid grid-cols-5 gap-8">
      <div className="col-span-2 space-y-4">
        <div className="w-full h-64 rounded-2xl" style={{ backgroundColor: 'var(--color-border-light)' }} />
        <div className="h-8 w-3/4 rounded" style={{ backgroundColor: 'var(--color-border-light)' }} />
        <div className="h-6 w-1/2 rounded" style={{ backgroundColor: 'var(--color-border-light)' }} />
        <div className="h-16 rounded-2xl" style={{ backgroundColor: 'var(--color-border-light)' }} />
        <div className="h-12 rounded-xl" style={{ backgroundColor: 'var(--color-border-light)' }} />
      </div>
      <div className="col-span-3 space-y-4">
        <div className="h-8 w-48 rounded" style={{ backgroundColor: 'var(--color-border-light)' }} />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="h-24 rounded-xl" style={{ backgroundColor: 'var(--color-border-light)' }} />
          ))}
        </div>
      </div>
    </div>
  </div>
)

export const PhoneDetailSkeletonMobile = () => (
  <div className="px-4 py-6 animate-pulse space-y-4">
    <div className="flex items-start gap-4">
      <div className="w-24 h-24 rounded-xl flex-shrink-0" style={{ backgroundColor: 'var(--color-border-light)' }} />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-16 rounded" style={{ backgroundColor: 'var(--color-border-light)' }} />
        <div className="h-5 w-full rounded" style={{ backgroundColor: 'var(--color-border-light)' }} />
        <div className="h-5 w-3/4 rounded" style={{ backgroundColor: 'var(--color-border-light)' }} />
        <div className="h-6 w-24 rounded" style={{ backgroundColor: 'var(--color-border-light)' }} />
      </div>
    </div>
    <div className="h-12 rounded-xl" style={{ backgroundColor: 'var(--color-border-light)' }} />
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="h-24 rounded-xl" style={{ backgroundColor: 'var(--color-border-light)' }} />
      ))}
    </div>
  </div>
)
