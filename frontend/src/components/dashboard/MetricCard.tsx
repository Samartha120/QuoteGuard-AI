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

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtext, icon: Icon, index = 0 }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
    el.style.transition = `opacity 0.5s cubic-bezier(0.22,1,0.36,1), transform 0.5s cubic-bezier(0.22,1,0.36,1)`;
    el.style.transitionDelay = `${index * 60}ms`;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [index]);

  return (
    <div ref={cardRef} className="metric-card">
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
