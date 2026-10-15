import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { QuoteShieldLogo } from './QuoteShieldLogo';
import { X, ShieldCheck, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Footer: React.FC = () => {
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

  return (
    <footer className="app-footer animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
      <div className="footer-content-container">
        <div className="footer-main-content">
          
          {/* Left Side: Brand */}
          <div className="footer-brand-section">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
              <QuoteShieldLogo size={28} className="text-accent" />
              <span className="footer-logo">
                <span style={{ color: 'var(--text-main)', fontSize: '1.25rem' }}>Quote</span>
                <span style={{ color: 'var(--accent-green)', fontSize: '1.25rem' }}>Guard</span> 
                <span style={{ color: 'var(--text-muted)', marginLeft: '6px', fontWeight: 500, fontSize: '1.05rem' }}>AI</span>
              </span>
            </Link>
            <div className="footer-desc">
              Source-Grounded Agentic Quotation Intelligence<br/>
              Platform for B2B MSMEs &amp; Enterprise Procurement.
            </div>
          </div>

          {/* Right Side: Navigation & Status */}
          <div className="footer-right-section">
            <div className="footer-nav-groups">
              <div className="footer-nav-group">
                <span className="footer-nav-title">PRODUCT</span>
                <Link to="/" className="footer-link">Dashboard</Link>
                <Link to="/rfq-processing" className="footer-link">RFQ Processing</Link>
                <Link to="/knowledge-base" className="footer-link">Knowledge Base</Link>
                <Link to="/evaluation" className="footer-link">Evaluation Matrix</Link>
              </div>
              <div className="footer-nav-group">
                <span className="footer-nav-title">ACCOUNT</span>
                <Link to="/organization" className="footer-link">Workspace</Link>
                <Link to="/quotations" className="footer-link">Quotations</Link>
                <Link to="/settings/profile" className="footer-link">Profile Settings</Link>
                <Link to="/settings/preferences" className="footer-link">Preferences</Link>
              </div>
              <div className="footer-nav-group">
                <span className="footer-nav-title">SUPPORT</span>
                <Link to="/contact" className="footer-link">Contact Us &amp; FAQ</Link>
                <button 
                  onClick={() => setLegalModal('privacy')} 
                  style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', font: 'inherit' }}
                  className="footer-link"
                >
                  Data Privacy
                </button>
                <div className="footer-link-static">System Status: OK</div>
              </div>
            </div>
            
            <div className="footer-system-info">
              <div className="footer-status">
                <div className="status-indicator">
                  <span className="status-dot"></span>
                  Operational
                </div>
              </div>
              <div className="footer-version">v1.2.0 · Enterprise</div>
            </div>
          </div>

        </div>
      </div>

      <div className="footer-divider" />
      
      {/* Bottom Row: Copyright & Legal */}
      <div className="footer-content-container">
        <div className="footer-bottom-content">
          <div className="footer-copyright">
            © {new Date().getFullYear()} AXION AI · QuoteGuard Enterprise Platform. All rights reserved.
          </div>
          <div className="footer-legal">
            <button 
              onClick={() => setLegalModal('privacy')} 
              style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.8rem' }}
              onMouseOver={e => e.currentTarget.style.color = '#fff'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              Privacy Policy
            </button>
            <span className="footer-dot">·</span>
            <button 
              onClick={() => setLegalModal('terms')} 
              style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.8rem' }}
              onMouseOver={e => e.currentTarget.style.color = '#fff'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              Terms of Service
            </button>
          </div>
        </div>
      </div>

      {/* Legal Dialog Modal */}
      <AnimatePresence>
        {legalModal && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(8px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
            onClick={() => setLegalModal(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                width: '100%',
                maxWidth: '560px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  {legalModal === 'privacy' ? <ShieldCheck size={20} style={{ color: 'var(--accent-green)' }} /> : <FileText size={20} style={{ color: 'var(--accent-blue)' }} />}
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                    {legalModal === 'privacy' ? 'Enterprise Privacy & Data Grounding' : 'Terms of Service & SLA'}
                  </h3>
                </div>
                <button 
                  onClick={() => setLegalModal(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {legalModal === 'privacy' ? (
                  <>
                    <p style={{ marginTop: 0 }}>
                      <strong>Zero Data Retention for Training:</strong> QuoteGuard AI never uses your private RFQs, client catalogs, or negotiated pricing tables to train foundational language models.
                    </p>
                    <p>
                      <strong>ChromaDB Vector Encryption:</strong> All embeddings and source chunk indexes are encrypted in-transit (TLS 1.3) and at-rest using AES-256 with tenant-isolated namespaces.
                    </p>
                    <p>
                      <strong>Audit Logging &amp; Traceability:</strong> Every line-item citation is strictly traceable back to indexed source files, ensuring full governance and compliance for your finance audits.
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ marginTop: 0 }}>
                      <strong>Commercial SLA Guarantee:</strong> QuoteGuard guarantees 99.95% availability for production endpoints with an automated multi-region failover architecture.
                    </p>
                    <p>
                      <strong>Deterministic Quotation Abstention:</strong> In accordance with our hallucination defense protocol, QuoteGuard is designed to abstain when catalog confidence drops below 0.85, eliminating commercial quotation liability.
                    </p>
                    <p>
                      <strong>Human-in-the-Loop Signoff:</strong> Quotations marked for human approval require authorized organizational signoff prior to final binding PDF generation.
                    </p>
                  </>
                )}
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setLegalModal(null)}>
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </footer>
  );
};
