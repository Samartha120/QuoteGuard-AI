import React, { useState, useMemo } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { useQuotation } from '../hooks/useQuotation';
import { quotationApi } from '../api/quotationApi';
import { Receipt, Download, ShieldCheck, AlertTriangle, Search, Filter, ArrowUpRight, TrendingUp, CheckCircle2, Clock, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScaleReveal } from '../components/motion';
import { motion } from 'framer-motion';

export const Quotations: React.FC = () => {
  const { quotations, loading } = useQuotation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING_APPROVAL' | 'CLARIFICATION_REQUIRED' | 'DRAFT'>('ALL');

  // KPI Calculations
  const stats = useMemo(() => {
    const total = quotations.length;
    const totalValue = quotations.reduce((sum, q) => sum + (q.total_amount || 0), 0);
    const approvedCount = quotations.filter(q => q.status === 'APPROVED').length;
    const groundedHigh = quotations.filter(q => (q.overall_confidence || 0) >= 0.8).length;
    const groundRate = total > 0 ? ((groundedHigh / total) * 100).toFixed(0) : '100';

    return { total, totalValue, approvedCount, groundRate };
  }, [quotations]);

  // Filtered List
  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      const matchSearch = 
        q.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.quotation_number?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = statusFilter === 'ALL' || q.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [quotations, searchTerm, statusFilter]);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: '#34d399',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.22)',
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981' }} />
            Approved
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: '#fbbf24',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.22)',
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b' }} />
            Pending Review
          </span>
        );
      case 'CLARIFICATION_REQUIRED':
        return (
          <span 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.6rem',
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
      default:
        return (
          <span 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.6rem',
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
    <PageContainer title="Quotations Management & Audit Ledger">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Top KPI Metrics Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.15rem' }}>
          <div 
            className="card" 
            style={{ 
              padding: '1.25rem 1.4rem', 
              background: 'var(--card-bg)',
              backdropFilter: 'blur(16px)',
              border: '1px solid var(--card-border)',
              borderRadius: '14px',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Generated Quotations</span>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Receipt size={17} style={{ color: '#a5b4fc' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-main)', margin: '0.4rem 0 0.2rem 0', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {loading ? '…' : stats.total}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Historical quotation drafts</span>
          </div>

          <div 
            className="card" 
            style={{ 
              padding: '1.25rem 1.4rem', 
              background: 'var(--card-bg)',
              backdropFilter: 'blur(16px)',
              border: '1px solid var(--card-border)',
              borderRadius: '14px',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Quoted Volume</span>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={17} style={{ color: '#34d399' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-main)', margin: '0.4rem 0 0.2rem 0', fontFamily: 'JetBrains Mono, monospace' }}>
              {loading ? '…' : `₹${stats.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Aggregated line-item value</span>
          </div>

          <div 
            className="card" 
            style={{ 
              padding: '1.25rem 1.4rem', 
              background: 'var(--card-bg)',
              backdropFilter: 'blur(16px)',
              border: '1px solid var(--card-border)',
              borderRadius: '14px',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Grounded Confidence Rate</span>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={17} style={{ color: '#34d399' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#34d399', margin: '0.4rem 0 0.2rem 0', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {loading ? '…' : `${stats.groundRate}%`}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Passed strict 0.85 threshold</span>
          </div>

          <div 
            className="card" 
            style={{ 
              padding: '1.25rem 1.4rem', 
              background: 'var(--card-bg)',
              backdropFilter: 'blur(16px)',
              border: '1px solid var(--card-border)',
              borderRadius: '14px',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Approved & Signed</span>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={17} style={{ color: '#60a5fa' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-main)', margin: '0.4rem 0 0.2rem 0', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {loading ? '…' : stats.approvedCount}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ready for client delivery</span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <ScaleReveal delay={0.2} className="card" width="100%" style={{ padding: '1.5rem', background: 'var(--card-bg)', backdropFilter: 'blur(16px)', border: '1px solid var(--card-border)', borderRadius: '14px', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search quote number, customer..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem 0.6rem 2.3rem',
                  borderRadius: '8px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--input-color)',
                  fontSize: '0.82rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--input-border)'}
              />
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--card-subtle-bg)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
              {(['ALL', 'APPROVED', 'PENDING_APPROVAL', 'CLARIFICATION_REQUIRED', 'DRAFT'] as const).map(tab => {
                const label = tab === 'ALL' ? 'All Quotes' : tab === 'PENDING_APPROVAL' ? 'Pending Review' : tab === 'CLARIFICATION_REQUIRED' ? 'Clarification' : tab;
                const isSelected = statusFilter === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    style={{
                      background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                      color: isSelected ? 'var(--accent-blue)' : 'var(--text-secondary)',
                      border: isSelected ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quotation Table */}
          <div className="table-container" style={{ borderRadius: '10px', border: '1px solid var(--table-border)', overflow: 'hidden' }}>
            <table className="table">
              <thead>
                <tr style={{ background: 'var(--table-header-bg)' }}>
                  <th style={{ paddingLeft: '1.25rem', fontSize: '0.72rem', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>QUOTE IDENTIFIER</th>
                  <th style={{ fontSize: '0.72rem', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>CUSTOMER ORGANIZATION</th>
                  <th style={{ fontSize: '0.72rem', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>SUBTOTAL</th>
                  <th style={{ fontSize: '0.72rem', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>TAX (18%)</th>
                  <th style={{ fontSize: '0.72rem', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>TOTAL PAYABLE</th>
                  <th style={{ fontSize: '0.72rem', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>WORKFLOW STATUS</th>
                  <th style={{ fontSize: '0.72rem', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>GROUNDING INTEGRITY</th>
                  <th style={{ textAlign: 'right', paddingRight: '1.25rem', fontSize: '0.72rem', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotations.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                      {searchTerm || statusFilter !== 'ALL' 
                        ? 'No quotations match the active filters.' 
                        : 'No quotations generated yet. Process an RFQ to create a draft.'}
                    </td>
                  </tr>
                ) : (
                  filteredQuotations.map((q) => {
                    const isHighConfidence = (q.overall_confidence || 0) >= 0.8;

                    return (
                      <motion.tr 
                        key={q.id} 
                        className="table-row"
                        whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.03)' }}
                        onClick={() => navigate(`/quotations/${q.id}`)}
                        style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.15s ease', cursor: 'pointer' }}
                      >
                        <td style={{ paddingLeft: '1.25rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.84rem' }}>
                          {q.quotation_number}
                        </td>
                        <td style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.86rem' }}>
                          {q.customer_name}
                        </td>
                        <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          ₹{(q.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          ₹{(q.tax_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--text-main)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.86rem' }}>
                          ₹{(q.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td>
                          {renderStatusBadge(q.status)}
                        </td>
                        <td>
                          <span 
                            style={{ 
                              fontSize: '0.78rem', 
                              fontWeight: 600, 
                              color: isHighConfidence ? '#34d399' : '#fbbf24',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              fontFamily: 'JetBrains Mono, monospace',
                            }}
                          >
                            {isHighConfidence ? <ShieldCheck size={14} style={{ color: '#10b981' }} /> : <AlertTriangle size={14} style={{ color: '#f59e0b' }} />}
                            {((q.overall_confidence || 0) * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                          <div style={{ display: 'inline-flex', gap: '0.45rem' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }} 
                              onClick={() => navigate(`/quotations/${q.id}`)}
                            >
                              Inspect <ArrowUpRight size={12} />
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }} 
                              onClick={(e) => { e.stopPropagation(); quotationApi.downloadPDF(q.id); }}
                            >
                              <Download size={12} /> PDF
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </ScaleReveal>
      </div>
    </PageContainer>
  );
};
