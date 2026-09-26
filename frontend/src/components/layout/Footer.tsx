import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Settings, User as UserIcon } from 'lucide-react';
import { QuoteShieldLogo } from './QuoteShieldLogo';

export const Footer: React.FC = () => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  return (
    <footer className="app-footer animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
      <div className="footer-inner">
        {/* Top Row: Identity & User */}
        <div className="footer-top-row">
          <div className="footer-identity">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <QuoteShieldLogo size={24} className="text-accent" />
              <span className="footer-logo">
                <span style={{ color: 'var(--text-main)' }}>Quote</span>
                <span style={{ color: 'var(--accent-green)' }}>Guard</span> 
                <span style={{ color: 'var(--text-muted)', marginLeft: '4px', fontWeight: 500 }}>AI</span>
              </span>
            </div>
            <span className="footer-desc">Source-Grounded Agentic Quotation Intelligence Platform for B2B MSMEs.</span>
          </div>
        </div>
        
        <div className="footer-divider" />
        
        {/* Middle Row: Links & Status */}
        <div className="footer-middle-row">
          <div className="footer-nav-groups">
            <div className="footer-nav-group">
              <span className="footer-nav-title">Product</span>
              <Link to="/" className="footer-link">Dashboard</Link>
              <Link to="/rfq-processing" className="footer-link">RFQ Processing</Link>
              <Link to="/evaluation" className="footer-link">Evaluation</Link>
            </div>
            <div className="footer-nav-group">
              <span className="footer-nav-title">Account</span>
              <Link to="/organization" className="footer-link">Workspace</Link>
              <Link to="/quotations" className="footer-link">Quotations</Link>
            </div>
            <div className="footer-nav-group">
              <span className="footer-nav-title">Support</span>
              <a href="https://docs.axion-ai.com" target="_blank" rel="noreferrer" className="footer-link">Documentation</a>
              <Link to="/contact" className="footer-link">Contact Us</Link>
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

        <div className="footer-divider" />
        
        {/* Bottom Row: Copyright & Legal */}
        <div className="footer-bottom-row">
          <div className="footer-copyright">
            © {new Date().getFullYear()} AXION AI
          </div>
          <div className="footer-legal">
            <a href="#" className="footer-link">Privacy</a>
            <span className="footer-dot">·</span>
            <a href="#" className="footer-link">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
