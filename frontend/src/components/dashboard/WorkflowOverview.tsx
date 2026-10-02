import React from 'react';
import { FileText, Database, ShieldAlert, FileCode, CheckCircle2 } from 'lucide-react';
import { ScaleReveal, StaggerContainer, StaggerItem, AnimatedLine, RegistrationMark } from '../motion';

export const WorkflowOverview: React.FC = () => {
  const steps = [
    { title: 'RFQ Input',           icon: FileText,      desc: 'Unstructured PDF/Email' },
    { title: 'Requirement Extractor', icon: FileCode,    desc: 'Pydantic JSON Schema' },
    { title: 'Retrieval Agent',      icon: Database,     desc: 'ChromaDB + Cosine RAG' },
    { title: 'Planning & Validation', icon: ShieldAlert, desc: 'Abstention & Threshold' },
    { title: 'Drafting Agent',       icon: FileText,     desc: 'Grounded Draft / Clarification' },
    { title: 'Human Approval',       icon: CheckCircle2, desc: 'ReportLab PDF Output' },
  ];

  return (
    <ScaleReveal delay={0.3} className="card" width="100%">
      <div className="section-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="section-title" style={{ fontSize: '1rem' }}>Active Pipeline</h3>
        <RegistrationMark delay={0.6} />
      </div>
      <StaggerContainer
        className="workflow-vertical"
        style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}
      >
        {/* Vertical connecting line — animates draw-on via CSS */}
        <div style={{ position: 'absolute', left: '11px', top: '10px', bottom: '10px', width: '1px', zIndex: 0 }}>
          <AnimatedLine horizontal={false} delay={0.5} />
        </div>
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <StaggerItem
              key={idx}
              className="pipeline-step"
            >
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', zIndex: 1, position: 'relative' }}>
                <div
                  className="step-circle active"
                  style={{ width: '24px', height: '24px', flexShrink: 0, backgroundColor: 'var(--bg-primary)' }}
                >
                  <Icon size={12} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)', lineHeight: 1.2 }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {step.desc}
                  </div>
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </ScaleReveal>
  );
};
