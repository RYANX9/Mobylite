// app/compare/[phones]/layout.tsx
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { phones: string };
}): Promise<Metadata> {
  const ids = params.phones
    .split(',')
    .map(Number)
    .filter((n) => !isNaN(n));

  if (ids.length < 2) {
    return {
      title: 'Compare Phones | Mobylite',
    };
  }

  try {
    const res = await fetch(
      `https://mobylite-api.up.railway.app/phones/compare?ids=${ids.join(',')}`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    const phones: Array<{ model_name: string; brand: string }> = data.phones || [];
    const names = phones.map((p) => p.model_name).join(' vs ');

    return {
      title: `${names} Comparison | Mobylite`,
      description: `Compare ${names} side by side. See full specs, prices, camera, battery, and performance differences.`,
      openGraph: {
        title: `${names} | Mobylite Compare`,
        description: `Side-by-side spec comparison: ${names}`,
        type: 'website',
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

export default function CompareWithPhonesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
