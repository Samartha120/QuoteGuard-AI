import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Building2, Users, Database, Shield, CreditCard } from 'lucide-react';

export const Organization: React.FC = () => {
  return (
    <PageContainer title="Workspace / Vertex Industrial">
      <div className="animate-fade-in animate-delay-1">
        <div className="section-header">
          <h2 className="section-title">Vertex Industrial Organization</h2>
          <div className="section-desc">Manage workspace settings, team members, and billing.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Building2 size={20} style={{ color: 'var(--text-secondary)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Workspace Profile</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label className="form-label">Company Name</label>
                  <input type="text" className="form-input" defaultValue="Vertex Industrial" readOnly />
                </div>
                <div>
                  <label className="form-label">Workspace ID</label>
                  <input type="text" className="form-input" defaultValue="org_v9k2x1m" readOnly style={{ fontFamily: 'JetBrains Mono, monospace' }} />
                </div>
                <div>
                  <label className="form-label">Industry</label>
                  <input type="text" className="form-input" defaultValue="Industrial Manufacturing" readOnly />
                </div>
                <div>
                  <label className="form-label">Domain</label>
                  <input type="text" className="form-input" defaultValue="vertex-industrial.com" readOnly />
                </div>
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Database size={20} style={{ color: 'var(--text-secondary)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Data Integrations</h3>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Connection</th>
                      <th>Status</th>
                      <th>Last Sync</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 500 }}>ERP (SAP S/4HANA)</td>
                      <td><span className="badge badge-grounded">Active</span></td>
                      <td>2 mins ago</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 500 }}>Product PIM</td>
                      <td><span className="badge badge-grounded">Active</span></td>
                      <td>1 hour ago</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 500 }}>Salesforce CRM</td>
                      <td><span className="badge badge-abstained">Syncing</span></td>
                      <td>In progress</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <CreditCard size={18} style={{ color: 'var(--text-secondary)' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Plan & Usage</h3>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Current Plan</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>Enterprise</div>
              </div>
              <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Quotation Quota</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>842 / 1000</span>
              </div>
              <div style={{ background: 'var(--bg-surface-hover)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                <div style={{ width: '84.2%', height: '100%', background: 'var(--text-main)' }} />
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <Shield size={18} style={{ color: 'var(--text-secondary)' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Security Settings</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem' }}>Two-Factor Auth</span>
                  <span className="badge badge-grounded">Enforced</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem' }}>SSO Integration</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Configured</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
