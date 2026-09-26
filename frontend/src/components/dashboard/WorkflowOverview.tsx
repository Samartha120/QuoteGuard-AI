import React from 'react';
import { FileText, Database, ShieldAlert, FileCode, CheckCircle2, ArrowRight } from 'lucide-react';

export const WorkflowOverview: React.FC = () => {
  const steps = [
    { title: 'RFQ Input', icon: FileText, desc: 'Unstructured PDF/Email' },
    { title: 'Requirement Extractor', icon: FileCode, desc: 'Pydantic JSON Schema' },
    { title: 'Retrieval Agent', icon: Database, desc: 'ChromaDB + Cosine RAG' },
    { title: 'Planning & Validation', icon: ShieldAlert, desc: 'Abstention & Threshold' },
    { title: 'Drafting Agent', icon: FileText, desc: 'Grounded Draft / Clarification' },
    { title: 'Human Approval', icon: CheckCircle2, desc: 'ReportLab PDF Output' },
  ];

  return (
    <div className="card animate-fade-in animate-delay-2" style={{ marginBottom: '1.5rem', flex: 1 }}>
      <div className="section-header" style={{ marginBottom: '1rem' }}>
        <h3 className="section-title" style={{ fontSize: '1rem' }}>Active Pipeline</h3>
      </div>
      <div className="workflow-vertical" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
        <div style={{ position: 'absolute', left: '11px', top: '10px', bottom: '10px', width: '1px', backgroundColor: 'var(--border-subtle)', zIndex: 0 }} />
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', zIndex: 1 }}>
              <div className="step-circle active" style={{ width: '24px', height: '24px', flexShrink: 0, backgroundColor: 'var(--bg-primary)' }}>
                <Icon size={12} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)', lineHeight: 1.2 }}>{step.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{step.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
