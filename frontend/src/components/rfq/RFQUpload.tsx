import React, { useState } from 'react';
import { UploadCloud, Play, FileText, CheckCircle2, ChevronDown, Wand2, ArrowRight } from 'lucide-react';

interface RFQUploadProps {
  onLoadSample1: () => void;
  onLoadSample2: () => void;
  onProcess: (rawText: string, customerName: string) => void;
  loading: boolean;
}

export const RFQUpload: React.FC<RFQUploadProps> = ({ onLoadSample1, onLoadSample2, onProcess, loading }) => {
  const [customerName, setCustomerName] = useState('Apex Engineering Works Ltd.');
  const [rawText, setRawText] = useState(
    `REQUEST FOR QUOTATION (RFQ)\nCustomer Name: Apex Engineering Works Ltd.\nPlease supply:\n1. Industrial Valve IV-200 (SS304) - 20 units\n2. Pressure Relief Valve PV-100 (SS304) - 15 units\nTerms: Net 30 Days credit`
  );
  
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');

  return (
    <div className="card animate-fade-in" style={{ padding: '2rem', marginBottom: '1.5rem', background: 'var(--bg-surface)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Start Quotation Workflow</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Input raw RFQ data or upload a document to trigger the agentic analysis pipeline.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-surface-hover)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
          <button 
            onClick={() => setInputMode('text')}
            style={{ 
              background: inputMode === 'text' ? 'var(--bg-surface)' : 'transparent', 
              color: inputMode === 'text' ? 'var(--text-main)' : 'var(--text-muted)',
              border: inputMode === 'text' ? '1px solid var(--border-subtle)' : '1px solid transparent',
              boxShadow: inputMode === 'text' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
              padding: '0.35rem 1rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, transition: 'all 0.2s'
            }}
          >Raw Text</button>
          <button 
            onClick={() => setInputMode('file')}
            style={{ 
              background: inputMode === 'file' ? 'var(--bg-surface)' : 'transparent', 
              color: inputMode === 'file' ? 'var(--text-main)' : 'var(--text-muted)',
              border: inputMode === 'file' ? '1px solid var(--border-subtle)' : '1px solid transparent',
              boxShadow: inputMode === 'file' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
              padding: '0.35rem 1rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, transition: 'all 0.2s'
            }}
          >File Upload</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '2rem' }}>
        
        {/* Left Column: Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {inputMode === 'text' ? (
            <>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 500 }}>Customer Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ background: 'var(--bg-main)', border: '1px solid var(--border-strong)' }}
                  value={customerName} 
                  onChange={(e) => setCustomerName(e.target.value)} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label className="form-label" style={{ fontWeight: 500 }}>RFQ Content</label>
                <textarea 
                  className="form-textarea" 
                  style={{ flex: 1, minHeight: '180px', background: 'var(--bg-main)', border: '1px solid var(--border-strong)', fontFamily: 'monospace', fontSize: '0.85rem' }}
                  value={rawText} 
                  onChange={(e) => setRawText(e.target.value)} 
                />
              </div>
            </>
          ) : (
            <div style={{ 
              flex: 1, border: '2px dashed var(--border-strong)', borderRadius: 'var(--radius-lg)', 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '3rem', background: 'var(--bg-main)', cursor: 'pointer', transition: 'all 0.2s'
            }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <UploadCloud size={32} style={{ color: 'var(--accent-green)' }} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>Drag & drop RFQ document</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 1.5rem 0', textAlign: 'center' }}>
                Supports PDF, DOCX, MSG, and EML formats up to 10MB.
              </p>
              <button className="btn btn-secondary">Browse Files</button>
            </div>
          )}
        </div>

        {/* Right Column: Execution & Samples */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '2rem' }}>
          
          <button 
            className="btn btn-primary" 
            onClick={() => onProcess(rawText, customerName)}
            disabled={loading}
            style={{ width: '100%', padding: '0.85rem', justifyContent: 'center', fontWeight: 600, fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}
          >
            {loading ? (
              <>Running Agents...</>
            ) : (
              <><Wand2 size={16} /> Execute Workflow</>
            )}
          </button>
          
          <div style={{ margin: '1rem 0', height: '1px', background: 'var(--border-subtle)' }} />
          
          <div>
            <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '1rem', fontWeight: 600 }}>Test Scenarios</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                onClick={onLoadSample1} 
                style={{ 
                  background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', 
                  padding: '0.75rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', gap: '0.25rem'
                }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-green)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  Standard Validation <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Apex Engineering Works</span>
              </button>
              
              <button 
                onClick={onLoadSample2} 
                style={{ 
                  background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', 
                  padding: '0.75rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', gap: '0.25rem'
                }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-amber)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  Edge-Case Clarification <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Zenith Chemical Processing</span>
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
