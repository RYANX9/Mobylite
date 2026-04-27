// app/compare/[phones]/layout.tsx
import type { Metadata } from 'next';

const API = 'https://mobylite-api.up.railway.app';

async function resolveSlugToId(slug: string): Promise<number | null> {
  try {
    // slug like "samsung-galaxy-s25-ultra" → search for it
    const query = slug.replace(/-/g, ' ');
    const res = await fetch(
      `${API}/phones/search?q=${encodeURIComponent(query)}&page_size=1`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.results?.length > 0) return data.results[0].id;
    return null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ phones: string }>;
}): Promise<Metadata> {
  const { phones: phonesParam } = await params;

  // Support both slug format and id format
  const segments = phonesParam.split('-vs-');

  if (segments.length < 2) {
    return {
      title: 'Compare Phones | Mobylite',
      description: 'Compare smartphones side by side on Mobylite.',
    };
  }

  try {
    // Try to resolve slugs to IDs
    const ids = await Promise.all(segments.map(resolveSlugToId));
    const validIds = ids.filter((id): id is number => id !== null);

    if (validIds.length < 2) {
      return {
        title: 'Compare Phones | Mobylite',
        description: 'Compare smartphones side by side on Mobylite.',
      };
    }

    const res = await fetch(
      `${API}/phones/compare?ids=${validIds.join(',')}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    const phoneList: Array<{ model_name: string; brand: string }> =
      data.phones || [];

    if (phoneList.length < 2) {
      return { title: 'Compare Phones | Mobylite' };
    }

    const names = phoneList.map((p) => p.model_name).join(' vs ');
    const brands = [...new Set(phoneList.map((p) => p.brand))].join(', ');

    return {
      title: `${names} Comparison | Mobylite`,
      description: `Compare ${names} side by side. Full specs, prices, camera, battery, and performance. Find which ${brands} phone is right for you.`,
      openGraph: {
        title: `${names} | Phone Comparison`,
        description: `Side-by-side: ${names}. Which one wins?`,
        type: 'website',
        siteName: 'Mobylite',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${names} Comparison`,
        description: `Full spec comparison on Mobylite`,
      },
      keywords: [
        ...phoneList.map((p) => p.model_name),
        ...phoneList.map((p) => `${p.brand} comparison`),
        'phone comparison',
        'vs',
      ],
    };
  } catch {
    return {
      title: 'Phone Comparison | Mobylite',
      description: 'Compare smartphones side by side on Mobylite.',
    };
  }
}

export default function CompareWithPhonesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
