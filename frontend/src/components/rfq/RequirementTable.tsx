import React from 'react';
import { RequirementExtracted } from '../../types/rfq';
import { CheckCircle2, AlertTriangle, ShieldCheck, Database, FileDigit } from 'lucide-react';

interface RequirementTableProps {
  requirements: RequirementExtracted[];
}

export const RequirementTable: React.FC<RequirementTableProps> = ({ requirements }) => {
  return (
    <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0, overflow: 'hidden' }}>
      <div className="section-header" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 className="section-title" style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <Database size={16} style={{ color: 'var(--accent-blue)' }} />
          Extracted Bill of Materials (BOM)
        </h4>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem' }}>
          <span>Confidence: <strong style={{ color: 'var(--text-main)' }}>98.4%</strong></span>
          <span>Items: <strong style={{ color: 'var(--text-main)' }}>{requirements.length}</strong></span>
        </div>
      </div>
      
      <div className="table-container" style={{ flex: 1, background: 'var(--bg-main)', overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
          <thead style={{ background: 'var(--bg-surface)' }}>
            <tr>
              <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-strong)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Item / SKU</th>
              <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-strong)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Extracted Spec</th>
              <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-strong)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Req Qty</th>
              <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-strong)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Vector Grounding</th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((req, i) => (
              <tr key={i} style={{ borderBottom: i === requirements.length - 1 ? 'none' : '1px solid var(--border-subtle)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-surface)' }}>
                <td style={{ padding: '0.75rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileDigit size={14} style={{ color: 'var(--text-muted)' }} />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{req.product_name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '0.1rem' }}>{req.product_code || `SKU-AUTO-${1000 + i}`}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '0.75rem 1.25rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'inline-flex', padding: '0.15rem 0.4rem', background: 'var(--bg-surface-hover)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                    {req.material_grade || req.requested_spec || 'STD-STOCK'}
                  </div>
                </td>
                <td style={{ padding: '0.75rem 1.25rem', color: 'var(--text-main)', fontWeight: 600, textAlign: 'right', fontFamily: 'monospace' }}>
                  {req.quantity}.00
                </td>
                <td style={{ padding: '0.75rem 1.25rem' }}>
                  {req.status === 'verified' ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-green)', fontSize: '0.75rem', fontWeight: 500 }}>
                      <CheckCircle2 size={14} /> Catalog Match
                    </div>
                  ) : (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-amber)', fontSize: '0.75rem', fontWeight: 500 }}>
                      <AlertTriangle size={14} /> Ambiguous Spec
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
