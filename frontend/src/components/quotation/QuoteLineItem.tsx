import React from 'react';
import { QuoteLineItem as LineItemType } from '../../types/quotation';
import { ConfidenceBadge } from './ConfidenceBadge';
import { SourceCitation } from './SourceCitation';

interface QuoteLineItemProps {
  item: LineItemType;
}

export const QuoteLineItem: React.FC<QuoteLineItemProps> = ({ item }) => {
  return (
    <tr>
      <td style={{ fontWeight: 600, color: '#FFFFFF' }}>{item.product_code}</td>
      <td>
        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.product_name}</div>
        <SourceCitation citations={item.citations} />
      </td>
      <td>{item.material_grade || 'SS304'}</td>
      <td>{item.quantity}</td>
      <td>{item.unit_price ? `₹${item.unit_price.toLocaleString('en-IN')}` : 'N/A (Unverified)'}</td>
      <td style={{ fontWeight: 600, color: '#FFFFFF' }}>
        {item.total_price ? `₹${item.total_price.toLocaleString('en-IN')}` : 'Abstained'}
      </td>
      <td>
        <ConfidenceBadge score={item.confidence_score} />
      </td>
    </tr>
  );
};
