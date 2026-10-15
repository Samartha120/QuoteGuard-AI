import React, { useState } from 'react';
import { UploadCloud, FileText, Settings2, Shield, Zap, Terminal, ArrowRight, Play, CheckCircle2, Cpu, FileCheck } from 'lucide-react';

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const pipelineStages = [
    { name: '1. Ingestion', status: 'Ready' },
    { name: '2. Grounding', status: 'Active' },
    { name: '3. Catalog Match', status: 'ChromaDB' },
    { name: '4. Pricing Engine', status: 'Deterministic' },
    { name: '5. Shield Guard', status: 'Active' },
  ];

  return (
    <div 
      className="card animate-fade-in" 
      style={{ 
        padding: 0, 
        marginBottom: '1.5rem', 
        background: 'var(--card-bg)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--card-border)',
        borderRadius: '14px',
        boxShadow: 'var(--card-shadow)',
        overflow: 'hidden',
      }}
    >
      {/* Header Area */}
      <div 
        style={{ 
          padding: '1.25rem 1.75rem', 
          borderBottom: '1px solid var(--border-subtle)', 
          background: 'var(--table-header-bg)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Terminal size={15} style={{ color: '#818cf8' }} /> 
            </div>
            Quotation Ingestion Engine
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', margin: '0.25rem 0 0 0' }}>
            Trigger the multi-agent RAG pipeline for automated RFQ structuring and verified pricing.
          </p>
        </div>

        {/* Tab mode selector */}
        <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--card-subtle-bg)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <button 
            onClick={() => setInputMode('text')}
            style={{ 
              background: inputMode === 'text' ? 'var(--bg-surface)' : 'transparent', 
              color: inputMode === 'text' ? 'var(--text-main)' : 'var(--text-muted)',
              border: inputMode === 'text' ? '1px solid var(--border-medium)' : '1px solid transparent',
              padding: '0.35rem 0.85rem', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontSize: '0.78rem', 
              fontWeight: 600, 
              boxShadow: inputMode === 'text' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Raw Payload
          </button>
          <button 
            onClick={() => setInputMode('file')}
            style={{ 
              background: inputMode === 'file' ? 'var(--bg-surface)' : 'transparent', 
              color: inputMode === 'file' ? 'var(--text-main)' : 'var(--text-muted)',
              border: inputMode === 'file' ? '1px solid var(--border-medium)' : '1px solid transparent',
              padding: '0.35rem 0.85rem', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontSize: '0.78rem', 
              fontWeight: 600, 
              boxShadow: inputMode === 'file' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Document Upload
          </button>
        </div>
      </div>

      {/* Mini Agent Pipeline Visualizer Strip */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.65rem 1.75rem',
          background: 'rgba(12, 16, 28, 0.5)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          overflowX: 'auto',
          gap: '1rem',
        }}
      >
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, whiteSpace: 'nowrap' }}>
          5-Agent Pipeline:
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'nowrap' }}>
          {pipelineStages.map((stage, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: '0.72rem', color: '#e2e8f0', fontWeight: 500 }}>{stage.name}</span>
              {i < pipelineStages.length - 1 && (
                <span style={{ color: 'rgba(255, 255, 255, 0.15)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', minHeight: '390px' }}>
        
        {/* Left Column: Data Input */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-subtle)' }}>
          {inputMode === 'text' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '0.85rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--card-subtle-bg)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>CUSTOMER / CLIENT</span>
                <input 
                  type="text" 
                  value={customerName} 
                  onChange={(e) => setCustomerName(e.target.value)} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.88rem', outline: 'none', width: '100%', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                />
              </div>
              <div style={{ flex: 1, position: 'relative', background: 'var(--bg-void)' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '42px', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', padding: '1rem 0', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace' }}>
                  {rawText.split('\n').map((_, i) => <div key={i} style={{ lineHeight: '1.6' }}>{i + 1}</div>)}
                </div>
                <textarea 
                  style={{ 
                    width: '100%', height: '100%', minHeight: '260px', background: 'transparent', border: 'none', 
                    color: 'var(--text-main)', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.84rem', 
                    padding: '1rem 1rem 1rem 54px', outline: 'none', resize: 'none', lineHeight: '1.6'
                  }}
                  value={rawText} 
                  onChange={(e) => setRawText(e.target.value)}
                  spellCheck={false}
                />
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--card-subtle-bg)' }}>
              <div style={{ padding: '0.85rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>CUSTOMER / CLIENT</span>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.88rem', outline: 'none', width: '100%' }}
                />
              </div>
              <div style={{ flex: 1, padding: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <input
                  type="file"
                  id="rfq-file-upload"
                  style={{ display: 'none' }}
                  accept=".pdf,.docx,.msg,.txt,.md,.csv"
                  disabled={loading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                    }
                  }}
                />
                <label 
                  htmlFor="rfq-file-upload"
                  style={{ 
                    width: '100%', maxWidth: '380px', border: '2px dashed var(--border-medium)', borderRadius: '12px', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '2.5rem 1.5rem', background: 'var(--bg-surface)', cursor: 'pointer', transition: 'all 0.2s ease'
                  }} 
                  onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'} 
                  onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-medium)'}
                >
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                    <UploadCloud size={24} style={{ color: '#818cf8' }} />
                  </div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 0.4rem 0' }}>
                    {selectedFile ? selectedFile.name : 'Upload RFQ Document'}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', margin: '0 0 1.25rem 0', textAlign: 'center', lineHeight: 1.5 }}>
                    {selectedFile ? 'File verified. Click Run Agentic Pipeline below.' : 'Supports PDF, DOCX, MSG, TXT, MD up to 15MB. Parsed and grounded server-side.'}
                  </p>
                  <div className="btn btn-secondary" style={{ fontSize: '0.76rem', pointerEvents: 'none' }}>
                    {loading ? 'Processing…' : (selectedFile ? 'Change File' : 'Browse File')}
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Pipeline Configuration */}
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', background: 'var(--card-subtle-bg)' }}>
          
          <h4 style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Settings2 size={13} /> Pipeline Config
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)' }}>Strict Grounding</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Enforce catalog match</div>
              </div>
              <div 
                onClick={() => setStrictGrounding(!strictGrounding)}
                style={{ width: '36px', height: '20px', background: strictGrounding ? '#10b981' : 'var(--border-medium)', borderRadius: '10px', position: 'relative', cursor: 'pointer', transition: '0.2s' }}
              >
                <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: strictGrounding ? '18px' : '2px', transition: '0.2s' }} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={14} style={{ color: '#fbbf24' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)' }}>Hallucination Shield</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Active (Threshold: 0.85)</div>
              </div>
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            onClick={() => {
              if (inputMode === 'text') {
                onProcess(rawText, customerName);
              } else if (inputMode === 'file' && selectedFile) {
                onUploadFile(selectedFile, customerName);
              } else {
                alert("Please select a file first.");
              }
            }}
            disabled={loading || (inputMode === 'file' && !selectedFile)}
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              justifyContent: 'center', 
              fontWeight: 600, 
              fontSize: '0.84rem', 
              marginBottom: '1.5rem', 
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', 
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Zap size={15} className="animate-pulse" /> Executing Pipeline...</span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Play size={14} /> Run Agentic Pipeline</span>
            )}
          </button>
          
          <div style={{ height: '1px', background: 'var(--border-subtle)', marginBottom: '1.25rem' }} />
          
          <h4 style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: '0.85rem', fontWeight: 600 }}>Historical Blueprints</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <button 
              onClick={onLoadSample1} 
              style={{ 
                background: 'var(--bg-surface)', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: '10px', 
                padding: '0.75rem', 
                cursor: 'pointer', 
                textAlign: 'left', 
                transition: 'all 0.15s ease', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.2rem'
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-surface-hover)'; e.currentTarget.style.borderColor = 'var(--accent-primary-glow)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={13} style={{ color: '#34d399' }} />
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)' }}>Apex Standard (Verified)</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', paddingLeft: '1.1rem' }}>Standard line-item validation</span>
            </button>
            
            <button 
              onClick={onLoadSample2} 
              style={{ 
                background: 'var(--bg-surface)', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: '10px', 
                padding: '0.75rem', 
                cursor: 'pointer', 
                textAlign: 'left', 
                transition: 'all 0.15s ease', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.2rem'
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-surface-hover)'; e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.3)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Shield size={13} style={{ color: '#fb7185' }} />
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)' }}>Zenith Edge-Case</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', paddingLeft: '1.1rem' }}>Triggers clarification flow</span>
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};
