import React from 'react';
import { QuoteShieldLogo } from './QuoteShieldLogo';
import { ShieldCheck, Sparkles, FileSearch } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Premium split-screen shell for the auth pages: an animated brand/marketing
 * panel on the left and the form on the right. Collapses to a single column
 * on small screens.
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="auth-shell">
      <div className="auth-aside">
        <div className="auth-aside-glow" />
        <div className="auth-aside-content">
          <div className="auth-brand">
            <QuoteShieldLogo size={40} className="auth-brand-logo" />
            <span className="auth-brand-name">
              <span style={{ color: '#fff' }}>Quote</span>
              <span style={{ color: 'var(--accent-green)' }}>Guard</span>
              <span style={{ color: 'rgba(255,255,255,0.55)', marginLeft: 6, fontWeight: 500 }}>AI</span>
            </span>
          </div>

          <h2 className="auth-aside-headline">
            Source-grounded quotation intelligence for B2B teams.
          </h2>
          <p className="auth-aside-sub">
            Turn RFQs into verified, citation-backed quotes — with an agentic pipeline
            that abstains instead of hallucinating.
          </p>

          <ul className="auth-feature-list">
            <li className="auth-feature" style={{ animationDelay: '0.15s' }}>
              <span className="auth-feature-icon"><ShieldCheck size={18} /></span>
              <span className="auth-feature-text">
                <span className="auth-feature-title">Traceable line items</span>
                <span className="auth-feature-desc">Every price and spec traced back to an approved source.</span>
              </span>
            </li>
            <li className="auth-feature" style={{ animationDelay: '0.28s' }}>
              <span className="auth-feature-icon"><FileSearch size={18} /></span>
              <span className="auth-feature-text">
                <span className="auth-feature-title">Grounded retrieval</span>
                <span className="auth-feature-desc">Validation across your catalog &amp; pricing — no guesswork.</span>
              </span>
            </li>
            <li className="auth-feature" style={{ animationDelay: '0.41s' }}>
              <span className="auth-feature-icon"><Sparkles size={18} /></span>
              <span className="auth-feature-text">
                <span className="auth-feature-title">Human-in-the-loop</span>
                <span className="auth-feature-desc">Approvals, notifications &amp; a full audit trail built in.</span>
              </span>
            </li>
          </ul>

          <div className="auth-trust" style={{ animationDelay: '0.55s' }}>
            <div className="auth-trust-item">
              <span className="auth-trust-value">0</span>
              <span className="auth-trust-label">hallucinated quotes</span>
            </div>
            <div className="auth-trust-divider" />
            <div className="auth-trust-item">
              <span className="auth-trust-value">100%</span>
              <span className="auth-trust-label">source-cited</span>
            </div>
            <div className="auth-trust-divider" />
            <div className="auth-trust-item">
              <span className="auth-trust-value">&lt;2s</span>
              <span className="auth-trust-label">avg RFQ pass</span>
            </div>
          </div>
        </div>
        <div className="auth-aside-footer">© {new Date().getFullYear()} AXION AI · QuoteGuard</div>
      </div>

      <div className="auth-main">
        <div className="auth-card-wrap animate-auth-in">{children}</div>
      </div>
    </div>
  );
};
