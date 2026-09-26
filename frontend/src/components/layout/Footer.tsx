import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Settings, User as UserIcon } from 'lucide-react';
import { QuoteShieldLogo } from './QuoteShieldLogo';

export const Footer: React.FC = () => {
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
              Platform for B2B MSMEs.
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
                <Link to="/evaluation" className="footer-link">Evaluation</Link>
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
                <a href="https://docs.axion-ai.com" target="_blank" rel="noreferrer" className="footer-link">Documentation</a>
                <Link to="/contact" className="footer-link">Contact Us</Link>
                <div className="footer-link-static">System Status</div>
              </div>
            </div>
            
            <div className="footer-system-info">
              <div className="footer-status">
                <div className="status-indicator">
                  <span className="status-dot"></span>
                  Operational
                </div>
              </div>
              <div className="footer-version">v1.2.0</div>
            </div>
          </div>

        </div>
      </div>

      <div className="footer-divider" />
      
      {/* Bottom Row: Copyright & Legal */}
      <div className="footer-content-container">
        <div className="footer-bottom-content">
          <div className="footer-copyright">
            © {new Date().getFullYear()} AXION AI
          </div>
          <div className="footer-legal">
            <Link to="/privacy" className="footer-link">Privacy</Link>
            <span className="footer-dot">·</span>
            <Link to="/terms" className="footer-link">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
