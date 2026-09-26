import React from 'react';
import { RequirementExtracted } from '../../types/rfq';
import { CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface RequirementTableProps {
  requirements: RequirementExtracted[];
}

export const RequirementTable: React.FC<RequirementTableProps> = ({ requirements }) => {
  return (
    <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="section-header" style={{ marginBottom: '1rem' }}>
        <h4 className="section-title" style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <ShieldCheck size={16} style={{ color: 'var(--text-secondary)' }} />
          Extracted Structured Requirements
        </h4>
      </div>
      <div className="table-container" style={{ flex: 1, background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead style={{ background: 'var(--bg-surface-hover)' }}>
            <tr>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 500, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>Product Name</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 500, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>Material Spec</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 500, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>Qty</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 500, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>Grounding Verification</th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((req, i) => (
              <tr key={i} style={{ borderBottom: i === requirements.length - 1 ? 'none' : '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 500, color: 'var(--text-main)' }}>{req.product_name}</td>
                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{req.material_grade || req.requested_spec || 'Standard Stock'}</td>
                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-main)', fontWeight: 500 }}>{req.quantity}</td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  {req.status === 'verified' ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.6rem', borderRadius: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-green)', fontSize: '0.75rem', fontWeight: 500 }}>
                      <CheckCircle2 size={12} /> Verified Stock Grade
                    </div>
                  ) : (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.6rem', borderRadius: '1rem', background: 'rgba(245, 166, 35, 0.1)', color: 'var(--accent-amber)', fontSize: '0.75rem', fontWeight: 500 }}>
                      <AlertTriangle size={12} /> Unverified / Mismatch
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
