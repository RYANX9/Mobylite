// components/shared/RecommendationButtons.tsx
import React from 'react';
import { Zap } from 'lucide-react';
import { ButtonPressFeedback } from './ButtonPressFeedback';
import { Recommendation } from './types';
import { RECOMMENDATIONS } from './constants';

interface RecommendationButtonsProps {
  activeRecommendation: string | null;
  onRecommendationClick: (id: string) => void;
  onQuizClick: () => void;
  variant?: 'desktop' | 'mobile';
  showQuizButton?: boolean;
}

export const RecommendationButtons: React.FC<RecommendationButtonsProps> = ({
  activeRecommendation,
  onRecommendationClick,
  onQuizClick,
  variant = 'desktop',
  showQuizButton = true
}) => {
  if (variant === 'mobile') {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
        {showQuizButton && (
          <ButtonPressFeedback
            onClick={onQuizClick}
            className="flex items-center gap-2 px-3 py-2 bg-white text-black rounded-xl font-bold flex-shrink-0"
          >
            <Zap size={14} strokeWidth={2.5} />
            <span className="text-xs whitespace-nowrap">Find Phone</span>
          </ButtonPressFeedback>
        )}
        {RECOMMENDATIONS.map((rec) => (
          <ButtonPressFeedback
            key={rec.id}
            onClick={() => onRecommendationClick(rec.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border flex-shrink-0 ${
              activeRecommendation === rec.id
                ? 'bg-white text-black border-white'
                : 'bg-white/10 text-white border-white/20'
            }`}
          >
            <rec.icon size={14} strokeWidth={2.5} />
            <span className="text-xs font-bold whitespace-nowrap">{rec.label}</span>
          </ButtonPressFeedback>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {showQuizButton && (
        <button
          onClick={onQuizClick}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-all"
        >
          <Zap size={16} strokeWidth={2.5} />
          <span className="text-xs">Quiz</span>
        </button>
      )}
      {RECOMMENDATIONS.map((rec) => (
        <ButtonPressFeedback
          key={rec.id}
          onClick={() => onRecommendationClick(rec.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
            activeRecommendation === rec.id
              ? 'bg-black text-white border-black'
              : 'bg-white text-black border-gray-200 hover:border-black'
          }`}
        >
          <rec.icon size={16} strokeWidth={2.5} />
          <span className="text-xs font-bold">{rec.label}</span>
        </ButtonPressFeedback>
      ))}
    </div>
  );
};