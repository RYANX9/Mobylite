// app/compare/[phones]/layout.tsx
import type { Metadata } from 'next';

const API = 'https://renderphones.onrender.com';

async function resolveSlug(slug: string): Promise<number | null> {
  try {
    const q = slug.replace(/-/g, ' ');
    const res = await fetch(
      `${API}/phones/search?q=${encodeURIComponent(q)}&page_size=3`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const results = data.results || [];
    if (!results.length) return null;
    return results[0].id;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ phones: string }>;
}): Promise<Metadata> {
  const { phones: seg } = await params;
  const slugs = seg.split('-vs-').filter(Boolean);

  if (slugs.length < 2) {
    return { title: 'Compare Phones | Mobylite' };
  }

  try {
    const ids = (await Promise.all(slugs.map(resolveSlug))).filter(
      (id): id is number => id !== null
    );

    if (ids.length < 2) {
      return { title: 'Compare Phones | Mobylite' };
    }

    const res = await fetch(
      `${API}/phones/compare?ids=${ids.join(',')}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error('failed');
    const data = await res.json();
    const list: Array<{ model_name: string; brand: string }> =
      data.phones || [];

    if (list.length < 2) return { title: 'Compare Phones | Mobylite' };

    const names = list.map((p) => p.model_name).join(' vs ');
    const brands = [...new Set(list.map((p) => p.brand))].join(', ');

    return {
      title: `${names} Comparison | Mobylite`,
      description: `Compare ${names} side by side — specs, price, camera, battery, performance. Find the best ${brands} phone for you.`,
      openGraph: {
        title: `${names} | Mobylite`,
        description: `Full side-by-side comparison: ${names}`,
        type: 'website',
        siteName: 'Mobylite',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${names} Comparison`,
        description: `Full specs comparison on Mobylite`,
      },
    };
  } catch {
    return {
      title: 'Phone Comparison | Mobylite',
      description: 'Compare smartphones side by side on Mobylite.',
    };
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
