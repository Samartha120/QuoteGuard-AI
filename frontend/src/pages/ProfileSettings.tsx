import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { useAuth } from '../contexts/AuthContext';
import { Save, User, Mail, Shield, Key } from 'lucide-react';

export const ProfileSettings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [name, setName] = useState(user?.name || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Persist API save via context & localStorage
    setTimeout(() => {
      updateUser({ name });
      setIsSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 800);
  };

  if (!user) return null;

  return (
    <PageContainer title="Profile Settings">
      <div className="animate-fade-in animate-delay-1" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="section-header">
          <h2 className="section-title">Account Identity</h2>
          <div className="section-desc">Manage your personal profile, account information, and security settings.</div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} style={{ color: 'var(--text-secondary)' }} /> Profile Information
            </h3>
            
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
              <div style={{ 
                width: '80px', height: '80px', borderRadius: '50%', 
                background: 'var(--bg-surface-hover)', border: '2px dashed var(--border-strong)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-secondary)'
              }}>
                {user.avatarUrl ? <img src={user.avatarUrl} alt="" style={{ borderRadius: '50%' }} /> : user.name.charAt(0)}
              </div>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-input" defaultValue={user.email} disabled style={{ opacity: 0.7 }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email changes require administrator approval.</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <input type="text" className="form-input" defaultValue={user.role} disabled style={{ opacity: 0.7 }} />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} style={{ color: 'var(--text-secondary)' }} /> Security
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <h4 style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Two-Factor Authentication (2FA)</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Protect your account with an extra layer of security.</span>
                </div>
                <button type="button" className="btn btn-secondary">Enable 2FA</button>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <h4 style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Password</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Last changed 4 months ago</span>
                </div>
                <button type="button" className="btn btn-secondary">Update</button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
            {success && <span style={{ color: 'var(--accent-green)', fontSize: '0.85rem' }}>Profile saved successfully!</span>}
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
            </button>
          </div>

        </form>
      </div>
    </PageContainer>
  );
};
