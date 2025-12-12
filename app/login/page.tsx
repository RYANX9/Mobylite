// app/login/page.tsx
import { Suspense } from 'react';
import LoginForm from './LoginForm';
import { APP_ROUTES } from '@/lib/config';
import { color } from '@/lib/tokens';

function LoadingSpinner() {
  return (
    <div className="h-screen flex items-center justify-center" style={{ backgroundColor: color.bg }}>
      <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full" style={{ borderColor: color.border }} />
    </div>
  );
}

export default async function LoginPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ redirect?: string }> 
}) {
  const params = await searchParams;
  const redirectUrl = params.redirect || APP_ROUTES.home; // ✅ Changed from accountFavorites to home

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoginForm redirectUrl={redirectUrl} />
    </Suspense>
  );
}