import React, { useRef, useEffect } from 'react';
import { FileText, Database, ShieldAlert, FileCode, CheckCircle2 } from 'lucide-react';

export const WorkflowOverview: React.FC = () => {
  const steps = [
    { title: 'RFQ Input',           icon: FileText,      desc: 'Unstructured PDF/Email' },
    { title: 'Requirement Extractor', icon: FileCode,    desc: 'Pydantic JSON Schema' },
    { title: 'Retrieval Agent',      icon: Database,     desc: 'ChromaDB + Cosine RAG' },
    { title: 'Planning & Validation', icon: ShieldAlert, desc: 'Abstention & Threshold' },
    { title: 'Drafting Agent',       icon: FileText,     desc: 'Grounded Draft / Clarification' },
    { title: 'Human Approval',       icon: CheckCircle2, desc: 'ReportLab PDF Output' },
  ];

  const lineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Animate the pipeline line draw-on effect when card enters view
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Stagger-reveal each pipeline step
    const stepEls = container.querySelectorAll('.pipeline-step');
    stepEls.forEach((el, i) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.opacity = '0';
      htmlEl.style.transform = 'translateX(-6px)';
      htmlEl.style.transition = `opacity 0.38s cubic-bezier(0.22,1,0.36,1), transform 0.38s cubic-bezier(0.22,1,0.36,1)`;
      htmlEl.style.transitionDelay = `${i * 70}ms`;
    });

    if (prefersReducedMotion) {
      stepEls.forEach((el) => {
        (el as HTMLElement).style.opacity = '1';
        (el as HTMLElement).style.transform = 'none';
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            stepEls.forEach((el) => {
              (el as HTMLElement).style.opacity = '1';
              (el as HTMLElement).style.transform = 'translateX(0)';
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="card animate-fade-in animate-delay-2" style={{ marginBottom: '1.5rem', flex: 1 }}>
      <div className="section-header" style={{ marginBottom: '1rem' }}>
        <h3 className="section-title" style={{ fontSize: '1rem' }}>Active Pipeline</h3>
      </div>
      <div
        ref={containerRef}
        className="workflow-vertical"
        style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}
      >
        {/* Vertical connecting line — animates draw-on via CSS */}
        <div
          ref={lineRef}
          style={{
            position: 'absolute',
            left: '11px',
            top: '10px',
            bottom: '10px',
            width: '1px',
            backgroundColor: 'var(--border-subtle)',
            zIndex: 0,
            transformOrigin: 'top center',
            animation: 'pipelineDraw 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both',
          }}
        />
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="pipeline-step"
              style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', zIndex: 1 }}
            >
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
          );
        })}
      </div>
    </div>
  );
};
