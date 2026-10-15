import React, { useState } from 'react';
import { FileText, Database, ShieldAlert, FileCode, CheckCircle2, Cpu, Activity } from 'lucide-react';
import { ScaleReveal } from '../motion';
import { motion } from 'framer-motion';

export const WorkflowOverview: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const steps = [
    { 
      num: '01', 
      title: 'RFQ Ingestion Agent',          
      icon: FileText,      
      desc: 'Unstructured PDF & email semantic extraction', 
      badge: 'OCR & Vision', 
      telemetry: 'Speed: 210ms · Chunking: 512t',
      color: '#818cf8', 
      bg: 'rgba(99, 102, 241, 0.12)' 
    },
    { 
      num: '02', 
      title: 'Requirement Extractor', 
      icon: FileCode,    
      desc: 'Schema structuring, specs & itemization',    
      badge: 'Pydantic v2', 
      telemetry: 'JSON Schema Validation · Type-Safe',
      color: '#60a5fa', 
      bg: 'rgba(59, 130, 246, 0.12)' 
    },
    { 
      num: '03', 
      title: 'Retrieval Agent',      
      icon: Database,     
      desc: 'High-dimensional catalog vector search',    
      badge: 'ChromaDB', 
      telemetry: 'Cosine Sim · Top-K: 5 Candidates',
      color: '#34d399', 
      bg: 'rgba(16, 185, 129, 0.12)' 
    },
    { 
      num: '04', 
      title: 'Hallucination Shield', 
      icon: ShieldAlert, 
      desc: 'Grounding defense & strict abstention gate', 
      badge: 'Threshold > 0.85', 
      telemetry: 'Source Provenance · Zero Fabrication',
      color: '#fbbf24', 
      bg: 'rgba(245, 158, 11, 0.12)' 
    },
    { 
      num: '05', 
      title: 'Drafting Agent',       
      icon: FileText,     
      desc: 'Source-grounded quote & pricing calculation',      
      badge: 'Formula Engine', 
      telemetry: 'GST/Tax Verified · Deterministic Pricing',
      color: '#a5b4fc', 
      bg: 'rgba(99, 102, 241, 0.12)' 
    },
    { 
      num: '06', 
      title: 'Human Governance',       
      icon: CheckCircle2, 
      desc: 'Single-click executive signoff & delivery',     
      badge: 'ReportLab PDF', 
      telemetry: 'Audit Ledger · Cryptographic Timestamp',
      color: '#34d399', 
      bg: 'rgba(16, 185, 129, 0.12)' 
    },
  ];

  return (
    <ScaleReveal 
      delay={0.3} 
      className="card" 
      width="100%" 
      style={{ 
        padding: '1.4rem', 
        background: 'var(--card-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--card-border)',
        borderRadius: '16px',
        boxShadow: 'var(--card-shadow)',
        position: 'relative',
      }}
    >
      {/* Top subtle ambient glow */}
      <div 
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} 
      />

      {/* Header */}
      <div className="section-header" style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 className="section-title" style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <span style={{ display: 'inline-flex', padding: '4px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8' }}>
              <Cpu size={15} />
            </span>
            5-Agent Pipeline
          </h3>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
            Deterministic routing with strict abstention
          </p>
        </div>
        <span 
          style={{ 
            fontSize: '0.67rem', 
            fontWeight: 600, 
            color: '#34d399', 
            background: 'rgba(16, 185, 129, 0.08)', 
            border: '1px solid rgba(16, 185, 129, 0.22)', 
            padding: '0.2rem 0.55rem', 
            borderRadius: '9999px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          Synchronized
        </span>
      </div>

      {/* Pipeline Container with Animated Neural Laser Rail */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {/* Continuous Background Rail */}
        <div 
          style={{
            position: 'absolute',
            left: '23px',
            top: '20px',
            bottom: '24px',
            width: '2px',
            background: 'var(--border-subtle)',
            zIndex: 0,
            overflow: 'hidden',
          }}
        >
          {/* Animated Laser Pulse Traveling Down the Rail */}
          <div 
            style={{
              position: 'absolute',
              width: '100%',
              height: '40px',
              background: 'linear-gradient(180deg, transparent, #818cf8 50%, #34d399 100%)',
              boxShadow: '0 0 8px #818cf8',
              animation: 'laserFlow 3.5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            }}
          />
        </div>

        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isHovered = activeStep === idx;
          return (
            <motion.div 
              key={idx}
              onMouseEnter={() => setActiveStep(idx)}
              onMouseLeave={() => setActiveStep(null)}
              whileHover={{ x: 3 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              style={{ 
                display: 'flex', 
                gap: '0.85rem', 
                alignItems: 'center', 
                position: 'relative',
                zIndex: 1,
                padding: '0.65rem 0.8rem',
                borderRadius: '12px',
                background: isHovered ? 'var(--bg-surface-hover)' : 'var(--card-subtle-bg)',
                border: isHovered ? `1px solid ${step.color}55` : '1px solid var(--border-subtle)',
                boxShadow: isHovered ? `0 4px 16px -2px ${step.color}22` : 'none',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
            >
              {/* Node Icon with ambient aura */}
              <div
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '9px',
                  flexShrink: 0, 
                  backgroundColor: step.bg,
                  color: step.color,
                  border: `1px solid ${step.color}33`,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: `0 2px 10px ${step.color}22`,
                  position: 'relative',
                }}
              >
                <Icon size={15} />
              </div>

              {/* Node Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.2 }}>
                    {step.title}
                  </span>
                  <span 
                    style={{ 
                      fontSize: '0.63rem', 
                      fontFamily: 'JetBrains Mono, monospace',
                      color: isHovered ? step.color : 'var(--text-muted)', 
                      background: 'var(--bg-surface)', 
                      padding: '0.12rem 0.45rem', 
                      borderRadius: '5px',
                      border: '1px solid var(--border-subtle)',
                      whiteSpace: 'nowrap',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {step.badge}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: isHovered ? 'var(--text-main)' : 'var(--text-secondary)', marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'color 0.2s' }}>
                  {step.desc}
                </div>
                {/* Micro-telemetry on hover */}
                {isHovered && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{ fontSize: '0.66rem', color: step.color, fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}
                  >
                    <Activity size={10} /> {step.telemetry}
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </ScaleReveal>
  );
};
