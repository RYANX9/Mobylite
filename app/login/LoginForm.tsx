// app/login/LoginForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { TrendingDown, GitCompare, Star, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { APP_ROUTES } from '@/lib/config';
import { color, font } from '@/lib/tokens';
import { FcGoogle } from 'react-icons/fc';
// ... (interface and declare global remain unchanged)

export default function LoginForm({ redirectUrl }: LoginFormProps) {
  // ... (state and requirements remain unchanged)

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirectUrl);
    }
  }, [user, authLoading, router, redirectUrl]);

  // ISOLATED EDIT: REMOVE renderButton and use the prompt instead
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
          callback: handleGoogleResponse,
        });
        
        // REMOVED: window.google.accounts.id.renderButton(...)
        
        // This is necessary if you want to use the automatic One-Tap prompt
        // window.google.accounts.id.prompt(); 
      }
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []); // isLogin dependency removed as it's not needed for initialization

  // ADDED: New function to trigger Google Sign-in on button click
  const handleGoogleSignInClick = () => {
    if (window.google) {
      window.google.accounts.id.prompt(); 
      
      // Alternatively, to trigger the full popup/redirect flow:
      window.google.accounts.id.callback = handleGoogleResponse;
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback logic for environments where One-Tap isn't working
            // You can initiate a full redirect flow here if needed.
            // For now, we rely on the prompt which covers most modern cases.
        }
      });
      
      // If you want the full-page redirect flow (old-school, but guaranteed to show the window)
      /*
      window.google.accounts.id.revoke(formData.email, () => {
        window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?
            client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&
            redirect_uri=${encodeURIComponent('YOUR_REDIRECT_URI_FROM_CONSOLE')}&
            response_type=code&
            scope=openid%20email%20profile`;
      });
      */
    }
  };
  
  // ... (handleGoogleResponse, handleSubmit, and authLoading check remain unchanged)

  return (
    <div className="min-h-screen" style={{ backgroundColor: color.bg }}>
      <div className="flex flex-col lg:flex-row lg:h-screen">
        {/* ... (Left decorative panel remains unchanged) */}

        <div className="order-1 lg:order-2 flex-1 flex items-center justify-center p-8 min-h-screen lg:min-h-0">
          <div className="w-full max-w-md space-y-6">
            {/* ... (Header and Error messages remain unchanged) */}

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
              {/* ... (Form fields remain unchanged) */}

              <button
                type="submit"
                disabled={loading || (!isLogin && (!allRequirementsMet || !passwordsMatch))}
                className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: color.primary, color: color.primaryText }}
              >
                {loading ? 'Please wait…' : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: color.border }} />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4" style={{ backgroundColor: color.bg, color: color.textMuted }}>
                  Or continue with
                </span>
              </div>
            </div>

            {/* ISOLATED EDIT: Replace div with custom button */}
            <button
                type="button"
                onClick={handleGoogleSignInClick}
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 border active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                    borderColor: color.border, 
                    backgroundColor: color.bgInverse, 
                    color: color.text 
                }}
            >
                <FcGoogle className="w-6 h-6" />
                {/* Text is now controlled by your app logic */}
                {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
            </button>
            {/* REMOVED: <div id="googleSignInButton" className="w-full"></div> */}

            {/* ... (Footer links remain unchanged) */}
          </div>
        </div>
      </div>
    </div>
  );
}
     
