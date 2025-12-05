// components/shared/ButtonPressFeedback.tsx
import React from 'react';

interface ButtonPressFeedbackProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const ButtonPressFeedback: React.FC<ButtonPressFeedbackProps> = ({ 
  children, 
  className = '', 
  onClick, 
  disabled = false 
}) => (
  <button
    className={`active:scale-[0.98] transition-all duration-150 ${className} ${
      disabled ? 'opacity-40 cursor-not-allowed' : ''
    }`}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);