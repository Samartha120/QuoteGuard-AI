import React, { useEffect, useRef, useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  /** Stagger index — adds entrance delay */
  index?: number;
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
      const duration = 900;
      const incrementTime = 16; // ~60fps
      const step = end / (duration / incrementTime);

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

import { motion } from 'framer-motion';

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtext, icon: Icon, index = 0 }) => {
  return (
    <motion.div 
      className="metric-card"
      initial={{ opacity: 0, y: 15, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: index * 0.08 }}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', borderColor: 'var(--border-focus)' }}
    >
      <div className="metric-header">
        <span>{title}</span>
        {Icon && <Icon size={16} />}
      </div>
      <div className="metric-value">
        <AnimatedValue value={value} />
      </div>
      {subtext && <div className="metric-subtext">{subtext}</div>}
    </motion.div>
  );
};
