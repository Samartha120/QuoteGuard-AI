import React from 'react';
import { QuoteLineItem as LineItemType } from '../../types/quotation';
import { ConfidenceBadge } from './ConfidenceBadge';
import { SourceCitation } from './SourceCitation';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

interface QuoteLineItemProps {
  item: LineItemType;
}

export const QuoteLineItem: React.FC<QuoteLineItemProps> = ({ item }) => {
  const isAbstained = !item.unit_price || item.status === 'abstained';

  return (
    <tr style={{ background: isAbstained ? 'rgba(239, 68, 68, 0.03)' : undefined }}>
      <td style={{ fontWeight: 600, color: 'var(--text-main)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem' }}>
        {item.product_code}
      </td>
      <td>
        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.88rem' }}>
          {item.product_name}
        </div>
        <SourceCitation citations={item.citations} />
      </td>
      <td>
        <span 
          style={{ 
            fontSize: '0.72rem', 
            fontWeight: 600, 
            background: 'var(--bg-surface)', 
            border: '1px solid var(--border-subtle)', 
            padding: '0.15rem 0.45rem', 
            borderRadius: '4px',
            color: 'var(--text-secondary)'
          }}
        >
          {item.material_grade || 'SS304'}
        </span>
      </td>
      <td>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: 'var(--text-main)' }}>
          {item.quantity}
        </span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>units</span>
      </td>
      <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem' }}>
        {item.unit_price ? (
          <span style={{ color: 'var(--text-main)' }}>
            ₹{item.unit_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        ) : (
          <span style={{ color: 'var(--accent-amber)', fontSize: '0.75rem', background: 'rgba(245, 166, 35, 0.08)', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid rgba(245, 166, 35, 0.2)' }}>
            Unverified
          </span>
        )}
      </td>
      <td style={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.88rem' }}>
        {item.total_price ? (
          <span style={{ color: 'var(--accent-green)' }}>
            ₹{item.total_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        ) : (
          <span style={{ color: '#ef4444', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.08)', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <ShieldAlert size={12} /> Abstained
          </span>
        )}
      </td>
      <td>
        <ConfidenceBadge score={item.confidence_score} showMeter size="sm" />
      </td>
    </tr>
  );
};
