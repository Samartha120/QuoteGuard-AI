import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Mail, MessageSquare, Phone, Send } from 'lucide-react';

export const ContactUs: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setTimeout(() => setStatus('success'), 800);
  };

  return (
    <PageContainer title="Support & Contact">
      <div className="animate-fade-in animate-delay-1" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="section-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 className="section-title" style={{ fontSize: '1.75rem' }}>Get in Touch</h2>
          <div className="section-desc" style={{ fontSize: '1rem' }}>Need help with QuoteGuard AI? Our enterprise support team is here to assist.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Send us a message</h3>
            
            {status === 'success' ? (
              <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'rgba(0, 230, 118, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 230, 118, 0.2)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent-green)', color: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <Send size={20} />
                </div>
                <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Message Sent</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Our support team will respond to your inquiry shortly.</p>
                <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => setStatus('idle')}>Send another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select className="form-select" required>
                    <option value="">Select an issue type...</option>
                    <option value="technical">Technical Support</option>
                    <option value="billing">Billing & Invoicing</option>
                    <option value="feature">Feature Request</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea className="form-textarea" rows={5} placeholder="Describe your issue or inquiry in detail..." required></textarea>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={status === 'submitting'}>
                  {status === 'submitting' ? 'Sending...' : 'Submit Inquiry'}
                </button>
              </form>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ color: 'var(--text-secondary)' }}><Mail size={24} /></div>
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Email Support</h4>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Guaranteed 4-hour response time for Enterprise tiers.</div>
                <a href="mailto:support@axion-ai.com" style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none' }}>support@axion-ai.com</a>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ color: 'var(--text-secondary)' }}><MessageSquare size={24} /></div>
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Live Chat</h4>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Chat directly with our engineering team for critical issues.</div>
                <button className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>Open Chat</button>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ color: 'var(--text-secondary)' }}><Phone size={24} /></div>
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Dedicated Account Manager</h4>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>For escalation and contract inquiries.</div>
                <div style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 500 }}>+1 (800) 555-0199</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
