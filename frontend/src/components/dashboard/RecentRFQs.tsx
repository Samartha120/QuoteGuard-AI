import React, { useState, useMemo } from 'react';
import { RFQ } from '../../types/rfq';
import { ArrowUpRight, ShieldCheck, AlertTriangle, Building, Clock, CheckCircle2, Loader2, FileText, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScaleReveal } from '../motion';
import { motion } from 'framer-motion';

interface RecentRFQsProps {
  rfqs: RFQ[];
}

export const RecentRFQs: React.FC<RecentRFQsProps> = ({ rfqs }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredRFQs = useMemo(() => {
    return rfqs.filter((rfq) => {
      const matchesSearch = 
        rfq.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rfq.id && rfq.id.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = 
        statusFilter === 'ALL' || 
        rfq.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rfqs, searchTerm, statusFilter]);

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
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
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

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-sm)', width: '220px' }}>
          <Search size={13} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.78rem', outline: 'none', width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
          {['ALL', 'GROUNDED', 'CLARIFICATION_REQUIRED'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                fontSize: '0.68rem',
                fontWeight: 600,
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: statusFilter === status ? 'var(--accent-blue)' : 'var(--bg-surface)',
                color: statusFilter === status ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.15s ease'
              }}
            >
              {status === 'CLARIFICATION_REQUIRED' ? 'CLARIFICATION' : status}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {filteredRFQs.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No RFQs match filter criteria.
          </div>
        ) : (
          filteredRFQs.slice(0, 5).map((rfq) => (
            <div 
              key={rfq.id}
              onClick={() => navigate(`/rfq/${rfq.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                background: 'var(--card-subtle-bg)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-blue)';
                e.currentTarget.style.background = 'var(--bg-surface-hover)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.background = 'var(--card-subtle-bg)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.78rem', color: 'var(--accent-blue)' }}>
                  {getInitials(rfq.customer_name)}
                </div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {rfq.customer_name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                    <Clock size={11} /> {new Date(rfq.created_at).toLocaleDateString()} · ID: {rfq.id.slice(0, 8)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {renderStatusBadge(rfq.status)}
                <ArrowUpRight size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>
          ))
        )}
      </div>
    </ScaleReveal>
  );
};
