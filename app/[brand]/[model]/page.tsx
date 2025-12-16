// app/[brand]/[model]/page.tsx
import { notFound, redirect } from 'next/navigation';
import { Phone } from '../../../lib/types';
import { API_BASE_URL } from '@/lib/config';
import DesktopDetail from '../../components/desktop/DesktopDetail';
import MobileDetail from '../../components/mobile/MobileDetail';

async function getPhoneBySlug(brand: string, model: string) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/phones/slug/${brand}/${model}`,
      { 
        cache: 'no-store',
        next: { revalidate: 3600 }
      }
    );

    if (!response.ok) return null;
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching phone:', error);
    return null;
  }
}

export async function generateMetadata({ 
  params 
}: { 
  params: { brand: string; model: string } 
}) {
  const data = await getPhoneBySlug(params.brand, params.model);
  
  if (!data?.phone) {
    return { title: 'Phone Not Found | Mobylite' };
  }

  const phone = data.phone;
  
  return {
    title: `${phone.model_name} - Full Specs, Reviews & Price | Mobylite`,
    description: `${phone.model_name} specifications: ${phone.chipset || 'Latest processor'}, ${phone.battery_capacity}mAh battery, ${phone.main_camera_mp}MP camera. Compare prices and read user reviews.`,
    openGraph: {
      title: phone.model_name,
      description: `${phone.chipset} • ${phone.battery_capacity}mAh • ${phone.main_camera_mp}MP`,
      images: [phone.main_image_url],
    },
  };
}

export default async function PhoneDetailPage({
  params,
}: {
  params: { brand: string; model: string }
}) {
  const data = await getPhoneBySlug(params.brand, params.model);

  if (!data?.phone) {
    notFound();
  }

  const { phone, reviews, stats } = data;

  return (
    <>
      <div className="hidden lg:block">
        <DesktopDetail 
          phone={phone} 
          initialReviews={reviews}
          initialStats={stats}
        />
      </div>
      <div className="block lg:hidden">
        <MobileDetail 
          phone={phone}
          initialReviews={reviews}
          initialStats={stats}
        />
      </div>
    </>
  );
}
