import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { useTheme } from '../contexts/ThemeContext';
import { Sliders, Bell, LayoutTemplate, Save } from 'lucide-react';
import { useScrollReveal, useStaggerReveal } from '../hooks/useScrollReveal';

export const Preferences: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Load preferences from localStorage or use defaults
  const [density, setDensity] = useState(() => localStorage.getItem('axion_pref_density') || 'comfortable');
  const [animations, setAnimations] = useState(() => localStorage.getItem('axion_pref_anim') || 'standard');
  const [timeRange, setTimeRange] = useState(() => localStorage.getItem('axion_pref_time') || '30d');

  const containerRef = useScrollReveal<HTMLDivElement>();
  const cardsRef = useStaggerReveal<HTMLDivElement>(':scope > .card');

  const handleSave = () => {
    setIsSaving(true);
    // Persist to localStorage
    setTimeout(() => {
      localStorage.setItem('axion_pref_density', density);
      localStorage.setItem('axion_pref_anim', animations);
      localStorage.setItem('axion_pref_time', timeRange);
      
      setIsSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 600);
  };

  return (
    <PageContainer title="Application Preferences">
      <div className="reveal-fade is-revealed" ref={containerRef} style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="section-header">
          <h2 className="section-title">Application Experience</h2>
          <div className="section-desc">Customize how QuoteGuard AI looks and behaves for your workflow.</div>
        </div>

        <div ref={cardsRef} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <LayoutTemplate size={18} style={{ color: 'var(--text-secondary)' }} /> Appearance
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Theme Mode</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Toggle between light and dark modes.</span>
                </div>
                <button className="btn btn-secondary" onClick={toggleTheme} style={{ width: '100px', justifyContent: 'center' }}>
                  {theme === 'dark' ? 'Dark' : 'Light'} Mode
                </button>
              </div>

              <div style={{ height: '1px', background: 'var(--border-subtle)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Layout Density</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Control the spacing in tables and lists.</span>
                </div>
                <select className="form-select" style={{ width: '160px' }} value={density} onChange={(e) => setDensity(e.target.value)}>
                  <option value="compact">Compact</option>
                  <option value="comfortable">Comfortable</option>
                  <option value="spacious">Spacious</option>
                </select>
              </div>

              <div style={{ height: '1px', background: 'var(--border-subtle)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Animation Preference</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Reduce motion if you prefer fewer transitions.</span>
                </div>
                <select className="form-select" style={{ width: '160px' }} value={animations} onChange={(e) => setAnimations(e.target.value)}>
                  <option value="reduced">Reduced Motion</option>
                  <option value="standard">Standard</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={18} style={{ color: 'var(--text-secondary)' }} /> Dashboard Defaults
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Default Time Range</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Initial date range shown in evaluation charts.</span>
                </div>
                <select className="form-select" style={{ width: '160px' }} value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
            {success && <span style={{ color: 'var(--accent-green)', fontSize: '0.85rem' }}>Preferences saved successfully!</span>}
            <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : <><Save size={16} /> Save Preferences</>}
            </button>
          </div>

        </div>
      </div>
    </PageContainer>
  );
};
