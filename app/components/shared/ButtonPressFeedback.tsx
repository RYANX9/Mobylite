'use client';
import React, { useState } from 'react';

interface ButtonPressFeedbackProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  hoverStyle?: React.CSSProperties;
}

export const ButtonPressFeedback: React.FC<ButtonPressFeedbackProps> = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  style,
  hoverStyle,
}) => {
  const [pressed, setPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseDown = () => setPressed(true);
  const handleMouseUp = () => setPressed(false);
  const handleMouseLeave = () => {
    setPressed(false);
    setIsHovered(false);
  };
  const handleMouseEnter = () => {
    if (!disabled) setIsHovered(true);
  };

  const combinedStyle: React.CSSProperties = {
    ...style,
    ...(isHovered && hoverStyle ? hoverStyle : {}),
    transform: pressed ? 'scale(0.95)' : 'scale(1)',
    transition: 'transform 0.1s ease, all 0.2s ease',
  };

  // Remove conflicting shorthand properties
  if (combinedStyle.border && hoverStyle?.borderColor) {
    delete combinedStyle.border;
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      className={`${className} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      style={combinedStyle}
    >
      {children}
    </button>
  );
};