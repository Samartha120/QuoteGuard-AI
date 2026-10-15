import React from 'react';
import { RFQ } from '../../types/rfq';
import { ArrowUpRight, ShieldCheck, AlertTriangle, Building, Clock, CheckCircle2, Loader2, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScaleReveal } from '../motion';
import { motion } from 'framer-motion';

interface RecentRFQsProps {
  rfqs: RFQ[];
}

export const RecentRFQs: React.FC<RecentRFQsProps> = ({ rfqs }) => {
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'RF';
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'GROUNDED':
        return (
          <span 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.55rem',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: '#34d399',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.22)',
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981' }} />
            Grounded
          </span>
        );
      case 'CLARIFICATION_REQUIRED':
        return (
          <span 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.55rem',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: '#fb7185',
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.22)',
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f43f5e' }} />
            Clarification
          </span>
        );
      case 'PROCESSING':
        return (
          <span 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.55rem',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: '#60a5fa',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.22)',
            }}
          >
            <Loader2 size={10} className="animate-spin" />
            Processing
          </span>
        );
      default:
        return (
          <span 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.55rem',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: '#94a3b8',
              background: 'rgba(148, 163, 184, 0.08)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#94a3b8' }} />
            Draft
          </span>
        );
    }
  };

  return (
    <ScaleReveal 
      delay={0.2} 
      className="card" 
      width="100%" 
      style={{ 
        padding: '1.5rem', 
        background: 'var(--card-bg)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--card-border)',
        borderRadius: '14px',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3 className="section-title" style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Recent Operational RFQs
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
            Live customer requests evaluated through the multi-agent grounding pipeline.
          </p>
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate('/rfq-processing')}
          style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
        >
          View All RFQs
        </button>
      </div>

      <div className="table-container" style={{ borderRadius: '10px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr style={{ background: 'var(--table-header-bg)' }}>
              <th style={{ paddingLeft: '1.25rem', fontSize: '0.72rem', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>CUSTOMER / ORGANIZATION</th>
              <th style={{ fontSize: '0.72rem', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>INGESTED</th>
              <th style={{ fontSize: '0.72rem', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>STATUS</th>
              <th style={{ fontSize: '0.72rem', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>GROUNDING VERIFICATION</th>
              <th style={{ textAlign: 'right', paddingRight: '1.25rem', fontSize: '0.72rem', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {rfqs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem 1rem' }}>
                  No RFQs processed yet. Run a sample RFQ from the RFQ Processing tab.
                </td>
              </tr>
            ) : (
              rfqs.slice(0, 5).map((rfq) => {
                const initials = getInitials(rfq.customer_name);
                const isGrounded = rfq.status === 'GROUNDED';

                return (
                  <motion.tr 
                    key={rfq.id}
                    whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.04)' }}
                    style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.15s ease' }}
                  >
                    <td style={{ paddingLeft: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div 
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '8px',
                            background: isGrounded ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                            color: isGrounded ? '#34d399' : '#a5b4fc',
                            border: `1px solid ${isGrounded ? 'rgba(16, 185, 129, 0.22)' : 'rgba(99, 102, 241, 0.22)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            letterSpacing: '0.02em',
                            flexShrink: 0,
                          }}
                        >
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.86rem' }}>
                            {rfq.customer_name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                            ID: {rfq.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                        {new Date(rfq.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                    <td>
                      {renderStatusBadge(rfq.status)}
                    </td>
                    <td>
                      {isGrounded ? (
                        <span style={{ color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 500 }}>
                          <ShieldCheck size={14} style={{ color: '#10b981' }} /> Grounded (95%+)
                        </span>
                      ) : (
                        <span style={{ color: '#fbbf24', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 500 }}>
                          <AlertTriangle size={14} style={{ color: '#f59e0b' }} /> Clarification Required
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => navigate(`/rfqs/${rfq.id}`)}
                        style={{ fontSize: '0.74rem', padding: '0.35rem 0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        Inspect <ArrowUpRight size={12} />
                      </button>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </ScaleReveal>
  );
};
