// ./app/login/LoginForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingDown, GitCompare, Star, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';

import { useAuth } from '@/lib/auth-context';
import { APP_ROUTES } from '@/lib/config';
import { color, font } from '@/lib/tokens';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
interface LoginFormProps {
  redirectUrl: string;
}

declare global {
  interface Window {
    google: any;
  }
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export default function LoginForm({ redirectUrl }: LoginFormProps) {
  const router = useRouter();
  const { user, loading: authLoading, login, googleLogin } = useAuth();

  /* ----- local state ---------------------------------------------- */
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });

  const [googleReady, setGoogleReady] = useState(false);

  /* ----- derived state -------------------------------------------- */
  const passwordRequirements = {
    minLength: formData.password.length >= 8,
    hasUpper: /[A-Z]/.test(formData.password),
    hasLower: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
  };

  const passwordsMatch =
    formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  const allRequirementsMet = Object.values(passwordRequirements).every(Boolean);

  /* ----- effects -------------------------------------------------- */
  useEffect(() => {
    if (!authLoading && user) router.replace(redirectUrl);
  }, [user, authLoading, router, redirectUrl]);

  /* Google One-Tap script */
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById('hiddenGoogleButton')!,
        {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'signin_with',
          shape: 'rectangular',
        }
      );
      setGoogleReady(true);
    };

    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ----- handlers ------------------------------------------------- */
  const handleGoogleResponse = async (response: any) => {
    setLoading(true);
    setError('');
    try {
      await googleLogin(response.credential);

      const returnUrl =
        typeof window !== 'undefined'
          ? sessionStorage.getItem('returnUrl') || APP_ROUTES.home
          : APP_ROUTES.home;

      if (typeof window !== 'undefined') sessionStorage.removeItem('returnUrl');

      router.replace(returnUrl);
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');

    if (!isLogin) {
      if (!allRequirementsMet) {
        setError('Password does not meet requirements');
        setLoading(false);
        return;
      }
      if (!passwordsMatch) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
    }

    try {
      await login(
        formData.email,
        formData.password,
        isLogin ? undefined : formData.displayName
      );

      const returnUrl =
        typeof window !== 'undefined'
          ? sessionStorage.getItem('returnUrl') || APP_ROUTES.home
          : APP_ROUTES.home;

      if (typeof window !== 'undefined') sessionStorage.removeItem('returnUrl');

      router.replace(returnUrl);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  /* ----- render --------------------------------------------------- */
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: color.bg }}>
        <div
          className="animate-spin w-8 h-8 border-4 rounded-full border-t-transparent"
          style={{ borderColor: color.border }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: color.bg }}>
      <div className="flex flex-col lg:flex-row lg:h-screen">
        {/* --------------- LEFT (hero) ---------------- */}
        <div
          className="order-2 lg:order-1 w-full lg:w-1/2 p-12 flex flex-col justify-between relative overflow-hidden"
          style={{ backgroundColor: color.bgInverse, minHeight: '100vh' }}
        >
          {/* decorative logos */}
          <img
            src="/logo.svg"
            alt="Decorative logo"
            className="absolute -top-35 -right-48 w-96 h-96 opacity-30"
            style={{ filter: 'invert(1)' }}
          />
          <img
            src="/logo.svg"
            alt="Decorative logo"
            className="absolute -bottom-50 -left-45 w-96 h-96 opacity-20"
            style={{ filter: 'invert(1)' }}
          />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-40">
              <img src="/logo.svg" alt="Mobylite" className="w-10 h-10 invert" />
              <span
                className="text-xl font-bold tracking-tight logo-heading-override"
                style={{ color: color.primaryText }}
              >
                Mobylite
              </span>
            </div>

            <h1
              className="text-4xl font-bold tracking-tight leading-tight mb-4"
              style={{ fontFamily: font.primary, color: color.primaryText }}
            >
              Your next phone, <br /> perfectly chosen.
            </h1>

            <div className="flex flex-col gap-4 mb-8 max-w-xs">
              <div className="flex items-center gap-3">
                <GitCompare size={18} style={{ color: color.primaryText, opacity: 0.8 }} />
                <span className="text-sm font-medium" style={{ color: color.primaryText, opacity: 0.8 }}>
                  Compare side-by-side
                </span>
              </div>
              <div className="flex items-center gap-3">
                <TrendingDown size={18} style={{ color: color.primaryText, opacity: 0.8 }} />
                <span className="text-sm font-medium" style={{ color: color.primaryText, opacity: 0.8 }}>
                  Track price drops
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Star size={18} style={{ color: color.primaryText, opacity: 0.8 }} />
                <span className="text-sm font-medium" style={{ color: color.primaryText, opacity: 0.8 }}>
                  Expert reviews
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex gap-10">
            {[
              { val: '50K+', lab: 'Models' },
              { val: '100+', lab: 'Brands' },
              { val: '10K+', lab: 'Users' },
            ].map((s) => (
              <div key={s.lab}>
                <div
                  className="text-2xl font-bold"
                  style={{ fontFamily: font.numeric, color: color.primaryText }}
                >
                  {s.val}
                </div>
                <div className="text-sm" style={{ color: color.textMuted }}>
                  {s.lab}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --------------- RIGHT (form) ---------------- */}
        <div className="order-1 lg:order-2 flex-1 flex items-center justify-center p-8 min-h-screen lg:min-h-0">
          <div className="w-full max-w-md space-y-6">
            {/* mobile logo */}
            <div className="lg:hidden flex justify-center mb-6">
              <img src="/logo.svg" alt="Mobylite" className="w-12 h-12" />
            </div>

            <div className="text-center lg:text-left">
              <h2
                className="text-3xl font-bold"
                style={{ fontFamily: font.primary, color: color.text }}
              >
                {isLogin ? 'Welcome back' : 'Join Mobylite'}
              </h2>
              <p style={{ color: color.textMuted }}>
                {isLogin ? 'Sign in to continue' : 'Create your account'}
              </p>
            </div>

            {error && (
              <div
                className="px-4 py-3 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: color.dangerBg, color: color.danger }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
              {/* ----- display name (signup) ----- */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: color.text }}>
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none transition"
                    style={{
                      border: `1px solid ${color.border}`,
                      backgroundColor: color.bg,
                      color: color.text,
                    }}
                    placeholder="Enter your name"
                    required
                    autoComplete="name"
                    disabled={loading}
                  />
                </div>
              )}

              {/* ----- email ----- */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: color.text }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none transition"
                  style={{
                    border: `1px solid ${color.border}`,
                    backgroundColor: color.bg,
                    color: color.text,
                  }}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              {/* ----- password ----- */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: color.text }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 pr-12 rounded-xl focus:outline-none transition"
                    style={{
                      border: `1px solid ${color.border}`,
                      backgroundColor: color.bg,
                      color: color.text,
                    }}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ color: color.textMuted }}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* ----- confirm password (signup) ----- */}
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: color.text }}>
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({ ...formData, confirmPassword: e.target.value })
                        }
                        className="w-full px-4 py-3 pr-12 rounded-xl focus:outline-none transition"
                        style={{
                          border: `1px solid ${
                            formData.confirmPassword && (passwordsMatch ? color.success : color.danger)
                          }`,
                          backgroundColor: color.bg,
                          color: color.text,
                        }}
                        placeholder="••••••••"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((p) => !p)}
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                        style={{ color: color.textMuted }}
                        disabled={loading}
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* requirements */}
                  {formData.password.length > 0 && !allRequirementsMet && (
                    <div className="space-y-1.5">
                      {!passwordRequirements.minLength && (
                        <p className="text-xs font-medium" style={{ color: color.danger }}>
                          • Must be at least 8 characters
                        </p>
                      )}
                      {!passwordRequirements.hasUpper && (
                        <p className="text-xs font-medium" style={{ color: color.danger }}>
                          • Add an uppercase letter
                        </p>
                      )}
                      {!passwordRequirements.hasLower && (
                        <p className="text-xs font-medium" style={{ color: color.danger }}>
                          • Add a lowercase letter
                        </p>
                      )}
                      {!passwordRequirements.hasNumber && (
                        <p className="text-xs font-medium" style={{ color: color.danger }}>
                          • Add a number
                        </p>
                      )}
                    </div>
                  )}

                  {formData.confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="text-xs font-medium" style={{ color: color.danger }}>
                      • Passwords do not match
                    </p>
                  )}
                </>
              )}

              {/* ----- submit ----- */}
              <button
                type="submit"
                disabled={loading || (!isLogin && (!allRequirementsMet || !passwordsMatch))}
                className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: color.primary, color: color.primaryText }}
              >
                {loading ? (
                  'Please wait…'
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* ----- divider ----- */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: color.border }} />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4" style={{ backgroundColor: color.bg, color: color.textMuted }}>
                  Or continue with
                </span>
              </div>
            </div>

            {/* ----- google button ----- */}
            <div id="hiddenGoogleButton" style={{ display: 'none' }} />
            <button
              onClick={() => {
                const googleButton = document
                  .getElementById('hiddenGoogleButton')
                  ?.querySelector('div[role="button"]');
                if (googleButton) (googleButton as HTMLElement).click();
              }}
              disabled={!googleReady || loading}
              className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#ffffff', color: '#3c4043', border: `1px solid ${color.border}` }}
            >
              <FcGoogle className="w-5 h-5" />
              {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
            </button>

            {/* ----- switch mode ----- */}
            <div className="text-center">
              <p style={{ color: color.textMuted }}>
                {isLogin ? "Don't have an account?" : 'Already have one?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin((s) => !s);
                    setError('');
                    setFormData({ email: '', password: '', confirmPassword: '', displayName: '' });
                  }}
                  className="font-bold"
                  style={{ color: color.text }}
                  disabled={loading}
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>

            {/* ----- guest ----- */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push(APP_ROUTES.home)}
                className="text-sm"
                style={{ color: color.textLight }}
                disabled={loading}
              >
                Continue as guest
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
