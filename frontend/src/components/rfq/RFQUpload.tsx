import React, { useState } from 'react';
import { UploadCloud, FileText, Settings2, Shield, Zap, Terminal, ArrowRight, Play } from 'lucide-react';

interface RFQUploadProps {
  onLoadSample1: () => void;
  onLoadSample2: () => void;
  onProcess: (rawText: string, customerName: string) => void;
  onUploadFile: (file: File, customerName: string) => void;
  loading: boolean;
}

export const RFQUpload: React.FC<RFQUploadProps> = ({ onLoadSample1, onLoadSample2, onProcess, onUploadFile, loading }) => {
  const [customerName, setCustomerName] = useState('Apex Engineering Works Ltd.');
  const [rawText, setRawText] = useState(
    `REQUEST FOR QUOTATION (RFQ)\nCustomer Name: Apex Engineering Works Ltd.\nPlease supply:\n1. Industrial Valve IV-200 (SS304) - 20 units\n2. Pressure Relief Valve PV-100 (SS304) - 15 units\nTerms: Net 30 Days credit`
  );
  
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [strictGrounding, setStrictGrounding] = useState(true);

  return (
    <div className="card animate-fade-in" style={{ padding: 0, marginBottom: '1.5rem', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      
      {/* Header Area */}
      <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Terminal size={18} style={{ color: 'var(--accent-blue)' }} /> 
            Quotation Ingestion Engine
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>Trigger the multi-agent RAG pipeline for automated RFQ structuring and pricing.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-primary)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)' }}>
          <button 
            onClick={() => setInputMode('text')}
            style={{ 
              background: inputMode === 'text' ? 'var(--bg-surface-hover)' : 'transparent', 
              color: inputMode === 'text' ? 'var(--text-main)' : 'var(--text-muted)',
              border: 'none',
              padding: '0.35rem 1rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, transition: 'all 0.2s'
            }}
          >Raw Payload</button>
          <button 
            onClick={() => setInputMode('file')}
            style={{ 
              background: inputMode === 'file' ? 'var(--bg-surface-hover)' : 'transparent', 
              color: inputMode === 'file' ? 'var(--text-main)' : 'var(--text-muted)',
              border: 'none',
              padding: '0.35rem 1rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, transition: 'all 0.2s'
            }}
          >Document Upload</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', minHeight: '400px' }}>
        
        {/* Left Column: Data Input */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-subtle)' }}>
          {inputMode === 'text' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--bg-main)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>CLIENT ID</span>
                <input 
                  type="text" 
                  value={customerName} 
                  onChange={(e) => setCustomerName(e.target.value)} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-green)', fontWeight: 600, fontSize: '0.9rem', outline: 'none', width: '100%' }}
                />
              </div>
              <div style={{ flex: 1, position: 'relative', background: '#0d0d0d' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '40px', background: '#111', borderRight: '1px solid #222', display: 'flex', flexDirection: 'column', padding: '1rem 0', alignItems: 'center', color: '#555', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                  {rawText.split('\n').map((_, i) => <div key={i}>{i + 1}</div>)}
                </div>
                <textarea 
                  style={{ 
                    width: '100%', height: '100%', minHeight: '250px', background: 'transparent', border: 'none', 
                    color: '#e2e8f0', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.85rem', 
                    padding: '1rem 1rem 1rem 50px', outline: 'none', resize: 'none', lineHeight: '1.6'
                  }}
                  value={rawText} 
                  onChange={(e) => setRawText(e.target.value)}
                  spellCheck={false}
                />
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>CLIENT ID</span>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-green)', fontWeight: 600, fontSize: '0.9rem', outline: 'none', width: '100%' }}
                />
              </div>
              <div style={{ flex: 1, padding: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <input
                type="file"
                id="rfq-file-upload"
                style={{ display: 'none' }}
                accept=".pdf,.docx,.msg,.txt,.md,.csv"
                disabled={loading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onUploadFile(file, customerName);
                    e.target.value = '';
                  }
                }}
              />
              <label 
                htmlFor="rfq-file-upload"
                style={{ 
                  width: '100%', maxWidth: '400px', border: '2px dashed var(--border-strong)', borderRadius: 'var(--radius-lg)', 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '3rem 2rem', background: 'var(--bg-surface)', cursor: 'pointer', transition: 'all 0.2s'
                }} 
                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'} 
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
              >
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(0, 112, 243, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <UploadCloud size={28} style={{ color: 'var(--accent-blue)' }} />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>Upload RFQ Document</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0 0 1.5rem 0', textAlign: 'center' }}>
                  Supports PDF, DOCX, MSG, TXT, MD, CSV up to 15MB. Text is extracted server-side and run through the pipeline.
                </p>
                <div className="btn btn-secondary" style={{ fontSize: '0.8rem', pointerEvents: 'none' }}>{loading ? 'Processing…' : 'Select File'}</div>
              </label>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Pipeline Configuration */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
          
          <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings2 size={14} /> Pipeline Config
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>Strict Grounding</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Enforce catalog match</div>
              </div>
              <div 
                onClick={() => setStrictGrounding(!strictGrounding)}
                style={{ width: '36px', height: '20px', background: strictGrounding ? 'var(--accent-green)' : 'var(--border-strong)', borderRadius: '10px', position: 'relative', cursor: 'pointer', transition: '0.2s' }}
              >
                <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: strictGrounding ? '18px' : '2px', transition: '0.2s' }} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <Shield size={16} style={{ color: 'var(--accent-amber)' }} />
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>Hallucination Shield</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Active (Threshold: 0.85)</div>
              </div>
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            onClick={() => onProcess(rawText, customerName)}
            disabled={loading}
            style={{ width: '100%', padding: '0.85rem', justifyContent: 'center', fontWeight: 600, fontSize: '0.9rem', marginBottom: '2rem', background: 'var(--text-main)', color: 'var(--bg-primary)' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Zap size={16} className="animate-pulse" /> Executing Pipeline...</span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Play size={16} /> Run Agentic Pipeline</span>
            )}
          </button>
          
          <div style={{ height: '1px', background: 'var(--border-subtle)', marginBottom: '1.5rem' }} />
          
          <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '1rem', fontWeight: 600 }}>Historical Blueprints</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button 
              onClick={onLoadSample1} 
              style={{ 
                background: 'transparent', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', 
                padding: '0.75rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', gap: '0.25rem'
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-surface-hover)'; e.currentTarget.style.borderColor = 'var(--border-focus)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)' }}>Apex Standard (Verified)</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Standard item validation</span>
            </button>
            
            <button 
              onClick={onLoadSample2} 
              style={{ 
                background: 'transparent', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', 
                padding: '0.75rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', gap: '0.25rem'
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-surface-hover)'; e.currentTarget.style.borderColor = 'var(--border-focus)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)' }}>Zenith Edge-Case</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Triggers clarification flow</span>
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};
