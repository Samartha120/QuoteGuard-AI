import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export const QuoteShieldLogo: React.FC<LogoProps> = ({ size = 24, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left Quote / Shield Side */}
      <path 
        d="M20 25 L45 15 L45 55 Q45 75 25 85 L20 70 Q32 65 32 50 L20 50 Z" 
        fill="currentColor" 
        style={{ opacity: 0.9 }}
      />
      {/* Right Quote / Shield Side */}
      <path 
        d="M55 25 L80 15 L80 55 Q80 75 60 85 L55 70 Q67 65 67 50 L55 50 Z" 
        fill="currentColor"
        style={{ opacity: 0.7 }}
      />
      {/* Connecting Shield Lines */}
      <path 
        d="M45 15 L55 25 M45 55 L55 50 M25 85 L60 85" 
        stroke="currentColor" 
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.4 }}
      />
    </svg>
  );
};
