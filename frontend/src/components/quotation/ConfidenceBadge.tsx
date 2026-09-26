import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

interface ConfidenceBadgeProps {
  score: number;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ score }) => {
  const isHigh = score >= 0.80;
  const percentage = (score * 100).toFixed(0);

  return (
    <span 
      className={`badge ${isHigh ? 'badge-grounded' : 'badge-abstained'}`}
      title={`Grounding Confidence: ${percentage}%`}
    >
      {isHigh ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
      <span>{percentage}% Grounded</span>
    </span>
  );
};
