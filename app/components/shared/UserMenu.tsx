// app/components/shared/UserMenu.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, LogOut, Heart, Star, Bell, History, ChevronRight, LogIn } from 'lucide-react';
import { ButtonPressFeedback } from './ButtonPressFeedback';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { APP_ROUTES } from '@/lib/config';
import { color } from '@/lib/tokens';
import type { User as UserType } from '@/lib/types';
import { api } from '@/lib/api';

interface UserData extends UserType {
  total_favorites?: number;
  total_reviews?: number;
  total_alerts?: number;
  total_comparisons?: number;
}

interface UserMenuProps {
  variant?: 'desktop' | 'mobile';
}

export const UserMenu: React.FC<UserMenuProps> = ({ variant = 'desktop' }) => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleLogoutClick = async () => {
    await api.auth.logout();
    setIsOpen(false);
    router.push('/login');
    router.refresh();
  };

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  const handleLogin = () => {
    const currentPath = window.location.pathname + window.location.search + window.location.hash;
    sessionStorage.setItem('returnUrl', currentPath);
    router.push(APP_ROUTES.login);
  };

  if (!user && !loading) {
    if (variant === 'mobile') {
      return (
        <ButtonPressFeedback
          onClick={handleLogin}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: color.text }}
        >
          <LogIn size={18} style={{ color: color.bg }} />
        </ButtonPressFeedback>
      );
    }

    return (
      <ButtonPressFeedback
        onClick={handleLogin}
        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-bold"
        style={{ backgroundColor: color.text, color: color.bg }}
      >
        <LogIn size={16} strokeWidth={2} />
        Sign In
      </ButtonPressFeedback>
    );
  }

  if (loading) {
    return (
      <div 
        className={`${variant === 'mobile' ? 'w-10 h-10' : 'w-10 h-10'} rounded-lg flex items-center justify-center animate-pulse`}
        style={{ backgroundColor: color.borderLight }}
      >
        <div className={`${variant === 'mobile' ? 'w-4 h-4' : 'w-5 h-5'} rounded-full`} style={{ backgroundColor: color.border }} />
      </div>
    );
  }

  const userData = user as UserData;

  const menuStyle: React.CSSProperties = {
    backgroundColor: color.bg,
    border: `1px solid ${color.borderLight}`,
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: color.borderLight,
    borderColor: color.borderLight,
  };

  const itemHoverStyle: React.CSSProperties = {
    backgroundColor: color.borderLight,
  };

  if (variant === 'mobile') {
    return (
      <div className="relative" ref={menuRef}>
        <ButtonPressFeedback
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: color.borderLight }}
        >
          {userData?.avatar_url ? (
            <img
              src={userData.avatar_url}
              alt={userData.display_name}
              className="w-full h-full rounded-full object-cover border"
              style={{ borderColor: color.border }}
            />
          ) : (
            <User size={18} style={{ color: color.textMuted }} />
          )}
        </ButtonPressFeedback>

        {isOpen && (
          <div 
            className="absolute right-0 mt-2 w-64 rounded-xl shadow-lg z-50 overflow-hidden"
            style={menuStyle}
          >
            <div className="p-4 border-b" style={headerStyle}>
              <div className="flex items-center gap-3">
                {userData?.avatar_url ? (
                  <img
                    src={userData.avatar_url}
                    alt={userData.display_name}
                    className="w-10 h-10 rounded-full object-cover border"
                    style={{ borderColor: color.border }}
                  />
                ) : (
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: color.borderLight }}
                  >
                    <User size={20} style={{ color: color.textMuted }} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate text-sm" style={{ color: color.text }}>
                    {userData?.display_name}
                  </p>
                  <p className="text-xs truncate" style={{ color: color.textMuted }}>
                    {userData?.email}
                  </p>
                </div>
              </div>
            </div>

            <nav className="py-2">
              <MenuItem
                icon={<Heart size={16} />}
                label="My Favorites"
                count={userData.total_favorites}
                onClick={() => handleNavigate(APP_ROUTES.accountFavorites)}
              />
              <MenuItem
                icon={<Star size={16} />}
                label="My Reviews"
                count={userData.total_reviews}
                onClick={() => handleNavigate(APP_ROUTES.accountReviews)}
              />
              <MenuItem
                icon={<Bell size={16} />}
                label="Price Alerts"
                count={userData.total_alerts}
                onClick={() => handleNavigate(APP_ROUTES.accountAlerts)}
              />
              <MenuItem
                icon={<History size={16} />}
                label="Comparison History"
                count={userData.total_comparisons}
                onClick={() => handleNavigate(APP_ROUTES.accountComparisons)}
              />
            </nav>

            <div className="border-t" style={{ borderColor: color.borderLight }}>
              <ButtonPressFeedback
                onClick={handleLogoutClick}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all"
                style={{ color: color.danger }}
                hoverStyle={{ backgroundColor: color.dangerBg }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </ButtonPressFeedback>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <ButtonPressFeedback
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg transition-all p-2"
        hoverStyle={itemHoverStyle}
      >
        {userData?.avatar_url ? (
          <img
            src={userData.avatar_url}
            alt={userData.display_name}
            className="w-8 h-8 rounded-full object-cover border"
            style={{ borderColor: color.border }}
          />
        ) : (
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: color.borderLight }}
          >
            <User size={16} style={{ color: color.textMuted }} />
          </div>
        )}
        <span className="text-sm font-semibold" style={{ color: color.text }}>
          {userData?.display_name}
        </span>
      </ButtonPressFeedback>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-64 rounded-xl shadow-lg z-50 overflow-hidden"
          style={menuStyle}
        >
          <div className="p-4 border-b" style={headerStyle}>
            <div className="flex items-center gap-3">
              {userData?.avatar_url ? (
                <img
                  src={userData.avatar_url}
                  alt={userData.display_name}
                  className="w-10 h-10 rounded-full object-cover border"
                  style={{ borderColor: color.border }}
                />
              ) : (
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: color.borderLight }}
                >
                  <User size={20} style={{ color: color.textMuted }} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate" style={{ color: color.text }}>
                  {userData?.display_name}
                </p>
                <p className="text-xs truncate" style={{ color: color.textMuted }}>
                  {userData?.email}
                </p>
              </div>
            </div>
          </div>

          <nav className="py-2">
            <MenuItem
              icon={<Heart size={16} />}
              label="My Favorites"
              count={userData.total_favorites}
              onClick={() => handleNavigate(APP_ROUTES.accountFavorites)}
            />
            <MenuItem
              icon={<Star size={16} />}
              label="My Reviews"
              count={userData.total_reviews}
              onClick={() => handleNavigate(APP_ROUTES.accountReviews)}
            />
            <MenuItem
              icon={<Bell size={16} />}
              label="Price Alerts"
              count={userData.total_alerts}
              onClick={() => handleNavigate(APP_ROUTES.accountAlerts)}
            />
            <MenuItem
              icon={<History size={16} />}
              label="Comparison History"
              count={userData.total_comparisons}
              onClick={() => handleNavigate(APP_ROUTES.accountComparisons)}
            />
          </nav>

          <div className="border-t" style={{ borderColor: color.borderLight }}>
            <ButtonPressFeedback
              onClick={handleLogoutClick}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all"
              style={{ color: color.danger }}
              hoverStyle={{ backgroundColor: color.dangerBg }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </ButtonPressFeedback>
          </div>
        </div>
      )}
    </div>
  );
};

const MenuItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  count?: number;
  onClick: () => void;
}> = ({ icon, label, count, onClick }) => (
  <ButtonPressFeedback
    onClick={onClick}
    className="w-full flex items-center justify-between px-3 py-2.5 transition-all"
    hoverStyle={{ backgroundColor: color.borderLight }}
  >
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 flex items-center justify-center" style={{ color: color.textMuted }}>
        {icon}
      </div>
      <span className="text-sm font-medium" style={{ color: color.text }}>
        {label}
      </span>
    </div>
    <div className="flex items-center gap-2">
      {count !== undefined && count > 0 && (
        <span 
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: color.borderLight, color: color.textMuted }}
        >
          {count}
        </span>
      )}
      <ChevronRight size={16} style={{ color: color.border }} />
    </div>
  </ButtonPressFeedback>
);