import React, { useEffect, useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
}

const AnimatedValue: React.FC<{ value: string | number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState<string | number>(0);

  useEffect(() => {
    const stringVal = String(value);
    const numMatch = stringVal.match(/^([\d.]+)(.*)$/);
    
    if (numMatch && parseFloat(numMatch[1]) > 0) {
      const end = parseFloat(numMatch[1]);
      const suffix = numMatch[2];
      const isInteger = !numMatch[1].includes('.');
      
      let start = 0;
      const duration = 800; // subtle, fast animation (150-300ms requested for transitions, so 800ms for counter is good)
      const incrementTime = 20;
      const step = (end / (duration / incrementTime));
      
      const timer = setInterval(() => {
        start += step;
        if (start >= end) {
          clearInterval(timer);
          setDisplayValue(stringVal);
        } else {
          setDisplayValue(isInteger ? Math.floor(start) + suffix : start.toFixed(2) + suffix);
        }
      }, incrementTime);
      return () => clearInterval(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value]);

  return <>{displayValue}</>;
};

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtext, icon: Icon }) => {
  return (
    <div className="metric-card animate-fade-in">
      <div className="metric-header">
        <span>{title}</span>
        {Icon && <Icon size={16} />}
      </div>
      <div className="metric-value">
        <AnimatedValue value={value} />
      </div>
      {subtext && <div className="metric-subtext">{subtext}</div>}
    </div>
  );
};
