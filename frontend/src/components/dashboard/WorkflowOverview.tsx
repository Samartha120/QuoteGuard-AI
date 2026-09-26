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
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem', color: '#FFFFFF' }}>
        Agentic Quotation Pipeline Architecture
      </h2>
      <div className="workflow-bar">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <React.Fragment key={idx}>
              <div className="workflow-step">
                <div className="step-circle active">
                  <Icon size={20} />
                </div>
                <div className="step-label" style={{ fontWeight: 600, color: '#FFFFFF' }}>{step.title}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{step.desc}</div>
              </div>
              {idx < steps.length - 1 && (
                <ArrowRight size={18} style={{ color: 'var(--text-muted)' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
