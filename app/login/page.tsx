// app\login\page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Check, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { APP_ROUTES } from '@/lib/config';
import { color, font } from '@/lib/tokens';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || APP_ROUTES.accountFavorites;
  
  const { user, loading: authLoading, login } = useAuth();

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

  const passwordRequirements = {
    minLength: formData.password.length >= 8,
    hasUpper: /[A-Z]/.test(formData.password),
    hasLower: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
  };

  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;
  const allRequirementsMet = Object.values(passwordRequirements).every(req => req);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirectUrl);
    }
  }, [user, authLoading, router, redirectUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      await login(formData.email, formData.password, isLogin ? undefined : formData.displayName);
      router.replace(redirectUrl);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: color.bg }}>
        <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full" style={{ borderColor: color.border }} />
      </div>
    );
  }

  return (
    <div className="h-screen flex" style={{ backgroundColor: color.bg }}>
      <div
        className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative overflow-hidden"
        style={{ backgroundColor: color.bgInverse }}
      >
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-5"
          style={{ backgroundColor: color.primaryText }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-5"
          style={{ backgroundColor: color.primaryText }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <img src="/logo.svg" alt="Mobylite" className="w-10 h-10 invert" />
            <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: font.primary, color: color.primaryText }}>
              Mobylite
            </span>
          </div>

          <h1
            className="text-4xl font-bold tracking-tight leading-tight mb-4"
            style={{ fontFamily: font.primary, color: color.primaryText }}
          >
            Your next phone,
            <br />
            perfectly chosen.
          </h1>
          <p className="max-w-md" style={{ color: color.textMuted }}>
            Compare. Track. Decide.
          </p>
        </div>

        <div className="relative z-10 flex gap-10">
          {[
            { val: '50K+', lab: 'Models' },
            { val: '100+', lab: 'Brands' },
            { val: '10K+', lab: 'Users' },
          ].map((s) => (
            <div key={s.lab}>
              <div className="text-2xl font-bold" style={{ fontFamily: font.numeric, color: color.primaryText }}>
                {s.val}
              </div>
              <div className="text-sm" style={{ color: color.textMuted }}>{s.lab}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex justify-center mb-6">
            <img src="/logo.svg" alt="Mobylite" className="w-12 h-12" />
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold" style={{ fontFamily: font.primary, color: color.text }}>
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

          <form onSubmit={handleSubmit} className="space-y-4">
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
                />
              </div>
            )}
            
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
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: color.text }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: color.textMuted }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: color.text }}>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 pr-12 rounded-xl focus:outline-none transition"
                      style={{
                        border: `1px solid ${formData.confirmPassword && (passwordsMatch ? color.success : color.danger)}`,
                        backgroundColor: color.bg,
                        color: color.text,
                      }}
                      placeholder="••••••••"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      style={{ color: color.textMuted }}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

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

          <div className="text-center">
            <p style={{ color: color.textMuted }}>
              {isLogin ? "Don't have an account?" : 'Already have one?'}{' '}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setFormData({ email: '', password: '', confirmPassword: '', displayName: '' });
                }}
                className="font-bold"
                style={{ color: color.text }}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          <div className="text-center">
            <button
              onClick={() => router.push(APP_ROUTES.home)}
              className="text-sm"
              style={{ color: color.textLight }}
            >
              Continue as guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}