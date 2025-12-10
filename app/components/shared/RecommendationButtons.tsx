'use client';
import React from 'react';
import { Zap } from 'lucide-react';
import { ButtonPressFeedback } from './ButtonPressFeedback';
import { RECOMMENDATION_CATEGORIES } from '@/lib/config';
import { color, font } from '@/lib/tokens';

interface RecommendationButtonsProps {
  activeRecommendation: string | null;
  onRecommendationClick: (id: string) => void;
  onQuizClick: () => void;
  variant?: 'desktop' | 'mobile';
  showQuizButton?: boolean;
}

export default function RecommendationButtons({
  activeRecommendation,
  onRecommendationClick,
  onQuizClick,
  variant = 'desktop',
  showQuizButton = true
}: RecommendationButtonsProps) {
  const isMobile = variant === 'mobile';
  const containerClasses = isMobile 
    ? "flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4" 
    : "flex gap-2";

  const buttonBaseStyle: React.CSSProperties = {
    border: `2px solid ${color.border}`,
    backgroundColor: color.bg,
    color: color.text,
  };

  const activeButtonStyle: React.CSSProperties = {
    backgroundColor: color.text,
    color: color.bg,
    borderColor: color.text,
  };

  const quizButtonStyle: React.CSSProperties = {
    backgroundColor: color.primary,
    color: color.primaryText,
    borderColor: color.primary,
  };

  // ✅ MOVED BEFORE RETURN - FIXES THE ERROR
  const quizButton = showQuizButton && (
    <ButtonPressFeedback
      onClick={onQuizClick}
      className={`flex items-center gap-2 rounded-xl font-bold flex-shrink-0 transition-all ${
        isMobile ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-xs'
      }`}
      style={quizButtonStyle}
    >
      <Zap size={isMobile ? 14 : 16} strokeWidth={2.5} />
      <span className="whitespace-nowrap">{isMobile ? 'Find Phone' : 'Quiz'}</span>
    </ButtonPressFeedback>
  );

  const renderButton = (id: string, label: string, icon: React.ElementType, isActive: boolean) => {
    if (!icon) return null;
    
    const Icon = icon;
    const style = isActive ? activeButtonStyle : buttonBaseStyle;

    return (
      <ButtonPressFeedback
        key={id}
        onClick={() => onRecommendationClick(id)}
        className={`flex items-center gap-2 rounded-xl font-bold flex-shrink-0 transition-all ${
          isMobile ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-xs'
        }`}
        style={style}
        hoverStyle={isActive ? activeButtonStyle : buttonBaseStyle}
      >
        <Icon size={isMobile ? 14 : 16} strokeWidth={2.5} />
        <span className="whitespace-nowrap">{label}</span>
      </ButtonPressFeedback>
    );
  };

  // ✅ NOW quizButton IS DEFINED BEFORE IT'S USED
  return (
    <div className={containerClasses}>
      {quizButton}
      {Object.entries(RECOMMENDATION_CATEGORIES).map(([key, rec]) => {
        if (!rec.icon) {
          console.error(`Missing icon for ${key}`);
          return null;
        }
        return renderButton(key, rec.title, rec.icon, activeRecommendation === key);
      })}
    </div>
  );
}