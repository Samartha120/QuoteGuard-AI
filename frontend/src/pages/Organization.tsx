import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Building2, Users, Database, Shield, CreditCard, Key, Check, Copy, UserPlus, RefreshCw } from 'lucide-react';
import { ScaleReveal } from '../components/motion';

export const Organization: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'team' | 'integrations'>('profile');

  const handleCopyKey = () => {
    navigator.clipboard.writeText('qg_live_sec_9941a87b320d41');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const teamMembers = [
    { name: 'Samartha Shrestha', email: 'samartha@vertex-industrial.com', role: 'Enterprise Administrator', status: 'Active', avatar: 'SS' },
    { name: 'David Miller', email: 'david.m@vertex-industrial.com', role: 'Lead Quotation Approver', status: 'Active', avatar: 'DM' },
    { name: 'Sarah Chen', email: 's.chen@vertex-industrial.com', role: 'Pricing & Catalog Specialist', status: 'Active', avatar: 'SC' },
    { name: 'Alex Johnson', email: 'alex.j@vertex-industrial.com', role: 'Sales Operations Manager', status: 'Active', avatar: 'AJ' },
  ];

  return (
    <PageContainer title="Workspace / Vertex Industrial">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* Workspace Header */}
        <div 
          className="card"
          style={{
            padding: '1.5rem 2rem',
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div 
              style={{
                width: 52,
                height: 52,
                borderRadius: '12px',
                background: 'rgba(56, 189, 248, 0.12)',
                color: 'var(--accent-blue)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                fontWeight: 700,
              }}
            >
              VI
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
                  Vertex Industrial Corp.
                </h2>
                <span className="badge badge-grounded">Enterprise Tier</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                Workspace ID: <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-main)' }}>org_v9k2x1m</span> · Region: AWS US-East-1
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--card-subtle-bg)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setActiveTab('profile')}
              style={{
                background: activeTab === 'profile' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'profile' ? 'var(--text-main)' : 'var(--text-secondary)',
                boxShadow: activeTab === 'profile' ? 'var(--shadow-sm)' : 'none',
                border: 'none',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Workspace Profile
            </button>
            <button
              onClick={() => setActiveTab('team')}
              style={{
                background: activeTab === 'team' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'team' ? 'var(--text-main)' : 'var(--text-secondary)',
                boxShadow: activeTab === 'team' ? 'var(--shadow-sm)' : 'none',
                border: 'none',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Team & Governance
            </button>
            <button
              onClick={() => setActiveTab('integrations')}
              style={{
                background: activeTab === 'integrations' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'integrations' ? 'var(--text-main)' : 'var(--text-secondary)',
                boxShadow: activeTab === 'integrations' ? 'var(--shadow-sm)' : 'none',
                border: 'none',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              ERP Integrations
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.75rem', alignItems: 'start' }}>
          
          {/* Main Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {activeTab === 'profile' && (
              <ScaleReveal delay={0.1} className="card" style={{ padding: '1.75rem', background: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
                  <Building2 size={18} style={{ color: 'var(--accent-blue)' }} />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                    Organization Attributes
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Legal Entity Name</label>
                    <input type="text" className="form-input" defaultValue="Vertex Industrial Limited" readOnly />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Primary Business Domain</label>
                    <input type="text" className="form-input" defaultValue="vertex-industrial.com" readOnly />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Industry Sector</label>
                    <input type="text" className="form-input" defaultValue="Industrial Valves & Heavy Engineering" readOnly />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Default Currency</label>
                    <input type="text" className="form-input" defaultValue="INR (₹) · GST 18%" readOnly />
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <Key size={16} style={{ color: 'var(--accent-amber)' }} />
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>Enterprise Ingestion API Key</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input 
                      type="password" 
                      className="form-input" 
                      value="qg_live_sec_9941a87b320d41" 
                      readOnly 
                      style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem' }} 
                    />
                    <button className="btn btn-secondary" onClick={handleCopyKey} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {copiedKey ? <Check size={14} style={{ color: 'var(--accent-green)' }} /> : <Copy size={14} />}
                      {copiedKey ? 'Copied' : 'Copy Key'}
                    </button>
                  </div>
                </div>
              </ScaleReveal>
            )}

            {activeTab === 'team' && (
              <ScaleReveal delay={0.1} className="card" style={{ padding: '1.75rem', background: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Users size={18} style={{ color: 'var(--accent-green)' }} />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                      Team Directory & Governance
                    </h3>
                  </div>
                  <button className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <UserPlus size={14} /> Invite Member
                  </button>
                </div>

                <div className="table-container" style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ paddingLeft: '1.25rem' }}>Member</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right', paddingRight: '1.25rem' }}>Access Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamMembers.map((member, i) => (
                        <tr key={i}>
                          <td style={{ paddingLeft: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--card-subtle-bg)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                {member.avatar}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>{member.name}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{member.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{member.role}</td>
                          <td><span className="badge badge-grounded">{member.status}</span></td>
                          <td style={{ textAlign: 'right', paddingRight: '1.25rem', fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                            Full Signoff
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ScaleReveal>
            )}

            {activeTab === 'integrations' && (
              <ScaleReveal delay={0.1} className="card" style={{ padding: '1.75rem', background: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Database size={18} style={{ color: 'var(--accent-blue)' }} />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                      Live ERP & CRM Connectors
                    </h3>
                  </div>
                  <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <RefreshCw size={13} /> Sync All
                  </button>
                </div>

                <div className="table-container" style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ paddingLeft: '1.25rem' }}>System Connector</th>
                        <th>Status</th>
                        <th>Sync Cadence</th>
                        <th style={{ textAlign: 'right', paddingRight: '1.25rem' }}>Health</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ paddingLeft: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>SAP S/4HANA ERP Connector</td>
                        <td><span className="badge badge-grounded">Active</span></td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Live Webhook (2 mins ago)</td>
                        <td style={{ textAlign: 'right', paddingRight: '1.25rem', color: 'var(--accent-green)', fontSize: '0.8rem', fontWeight: 600 }}>100% OK</td>
                      </tr>
                      <tr>
                        <td style={{ paddingLeft: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>ChromaDB Vector Store</td>
                        <td><span className="badge badge-grounded">Active</span></td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Persistent Local & Cloud</td>
                        <td style={{ textAlign: 'right', paddingRight: '1.25rem', color: 'var(--accent-green)', fontSize: '0.8rem', fontWeight: 600 }}>100% OK</td>
                      </tr>
                      <tr>
                        <td style={{ paddingLeft: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>Salesforce B2B Quoting CRM</td>
                        <td><span className="badge badge-grounded">Active</span></td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Hourly Batch Poll</td>
                        <td style={{ textAlign: 'right', paddingRight: '1.25rem', color: 'var(--accent-green)', fontSize: '0.8rem', fontWeight: 600 }}>100% OK</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </ScaleReveal>
            )}

          </div>

          {/* Right Column: Plan & Security */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Plan Usage Card */}
            <div className="card" style={{ padding: '1.5rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1.5px', background: 'linear-gradient(90deg, transparent, var(--accent-blue), transparent)', opacity: 0.7 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <CreditCard size={18} style={{ color: 'var(--accent-blue)' }} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                  Quotation Quota Usage
                </h3>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'JetBrains Mono, monospace' }}>
                  842 <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ 1,000</span>
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: 600 }}>84.2% consumed</span>
              </div>

              {/* Progress bar — Clean single solid emerald green line */}
              <div style={{ background: 'var(--bg-surface-hover)', borderRadius: '9999px', height: '6px', overflow: 'hidden', marginBottom: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                <div style={{ width: '84.2%', height: '100%', background: 'var(--accent-green)', borderRadius: '9999px' }} />
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
                Renews automatically on the 1st of each month. Overage billed at ₹12 / quote.
              </div>

              <button className="btn btn-secondary" style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem', justifyContent: 'center' }}>
                Manage Billing & Tier
              </button>
            </div>

            {/* Security Posture */}
            <div className="card" style={{ padding: '1.5rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1.5px', background: 'linear-gradient(90deg, transparent, var(--accent-green), transparent)', opacity: 0.7 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Shield size={18} style={{ color: 'var(--accent-green)' }} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                  Security & Compliance
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Two-Factor (TOTP)</span>
                  <span className="badge badge-grounded">Enforced</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Session Timeout</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>24 Hours</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Data Residency</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>India (ap-south-1)</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </PageContainer>
  );
};
