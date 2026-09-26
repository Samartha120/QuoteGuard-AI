import React, { useState } from 'react';
import { Upload, Play, FileText, CheckCircle2 } from 'lucide-react';

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

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem', color: '#FFFFFF' }}>
        Step 1: Input Customer RFQ
      </h3>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button className="btn btn-secondary" onClick={onLoadSample1} style={{ fontSize: '0.82rem' }}>
          <FileText size={16} /> Load DEMO RFQ 1 (Grounded Complete)
        </button>
        <button className="btn btn-secondary" onClick={onLoadSample2} style={{ fontSize: '0.82rem', borderColor: 'var(--accent-amber)', color: '#FCD34D' }}>
          <FileText size={16} /> Load DEMO RFQ 2 (SS316 Mismatch Abstention)
        </button>
      </div>

      <div className="form-group">
        <label className="form-label">Customer Name</label>
        <input 
          type="text" 
          className="form-input" 
          value={customerName} 
          onChange={(e) => setCustomerName(e.target.value)} 
        />
      </div>

      <div className="form-group">
        <label className="form-label">RFQ Raw Document / Text Content</label>
        <textarea 
          className="form-textarea" 
          rows={5} 
          value={rawText} 
          onChange={(e) => setRawText(e.target.value)} 
        />
      </div>

      <button 
        className="btn btn-primary" 
        onClick={() => onProcess(rawText, customerName)}
        disabled={loading}
      >
        <Play size={16} /> {loading ? 'Running 5-Agent Pipeline...' : 'Run Agentic Workflow'}
      </button>
    </div>
  );
};
