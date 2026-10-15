import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { 
  Mail, MessageSquare, Phone, Send, X, Bot, User, CheckCircle2, 
  ChevronDown, ShieldCheck, Clock, HelpCircle, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  time: string;
}

export const ContactUs: React.FC = () => {
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formSubject, setFormSubject] = useState('technical');
  const [formMessage, setFormMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  // Interactive Live Chat Modal State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'agent',
      text: "Hello! I'm the QuoteGuard AI Enterprise Assistant. How can I assist you with your quotation pipeline, catalog indexing, or grounding thresholds today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does QuoteGuard ensure zero hallucinations in pricing?',
      a: 'QuoteGuard uses a multi-stage validation engine. Before any quotation is formulated, the Planning & Validation Agent checks every line item against your indexed ChromaDB vector catalog and pricing tables. If the semantic cosine similarity drops below 0.85 or a requested specification does not match, the agent explicitly abstains and flags the case for clarification rather than inventing a price.',
    },
    {
      q: 'Which document formats are supported for automated RFQ ingestion?',
      a: 'The pipeline currently accepts PDF, Microsoft Word (.docx), Outlook Email files (.msg), Markdown (.md), CSV datasets, and raw plain text payloads. Text is extracted server-side using PyPDF and structured into strict Pydantic v2 schemas.',
    },
    {
      q: 'Can QuoteGuard integrate with our existing ERP or CRM systems?',
      a: 'Yes. QuoteGuard provides bi-directional REST endpoints and webhook listeners compatible with SAP S/4HANA, Salesforce, Microsoft Dynamics 365, and custom Postgres/SQL databases for continuous synchronization.',
    },
    {
      q: 'What are the enterprise support SLAs?',
      a: 'Enterprise plan accounts receive guaranteed 4-hour response SLAs on critical issues, 99.95% uptime guarantees, dedicated technical account manager (TAM) access, and bespoke vector catalog training sessions.',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMessage.trim()) return;
    setStatus('submitting');
    setTimeout(() => {
      setStatus('success');
      setFormMessage('');
    }, 700);
  };

  const handleSendChatMessage = (textToSend?: string) => {
    const text = (textToSend || chatInput).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput('');
    setIsTyping(true);

    // Dynamic contextual response
    setTimeout(() => {
      let reply = "Thank you for asking! Our engineering team will inspect this in detail. In the meantime, you can review live benchmark performance under the Evaluation Matrix tab.";
      const lower = text.toLowerCase();
      if (lower.includes('ground') || lower.includes('hallucinat')) {
        reply = "QuoteGuard enforces a strict 0.85 cosine grounding threshold. Any item lacking 100% catalog citation is flagged as 'CLARIFICATION_REQUIRED' to prevent liability.";
      } else if (lower.includes('pdf') || lower.includes('upload') || lower.includes('ingest')) {
        reply = "You can drag-and-drop RFQ documents under the RFQ Processing tab. We support PDFs, DOCX, and MSG files up to 15MB with server-side OCR parsing.";
      } else if (lower.includes('price') || lower.includes('quote') || lower.includes('cost')) {
        reply = "Quotations are formulated using your verified pricing policies from the Knowledge Base. Total tax and freight margins are automatically calculated in INR.";
      } else if (lower.includes('sla') || lower.includes('support')) {
        reply = "Enterprise accounts enjoy a 4-hour response SLA and 99.95% system uptime guarantee. Our engineering team is on standby 24/7.";
      }

      const agentMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'agent',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, agentMsg]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <PageContainer title="Enterprise Support & Help Desk">
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        
        {/* Header Section */}
        <div style={{ textAlign: 'center' }}>
          <div 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              color: 'var(--accent-blue)',
              fontSize: '0.78rem',
              fontWeight: 600,
              marginBottom: '0.85rem',
            }}
          >
            <Sparkles size={14} /> 24/7 Dedicated Assistance
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em', margin: '0 0 0.5rem 0' }}>
            We're here to keep your pipeline running smoothly.
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '620px', margin: '0 auto' }}>
            Get help with enterprise vector ingestion, ERP integrations, strict grounding rules, or custom deployment configurations.
          </p>
        </div>

        {/* SLA Guarantee Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--accent-green)', marginBottom: '0.4rem' }}>
              <Clock size={18} />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>4-Hour Priority SLA</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              Rapid engineering resolution for mission-critical quotation workflows.
            </p>
          </div>

          <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--accent-blue)', marginBottom: '0.4rem' }}>
              <ShieldCheck size={18} />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>99.95% Availability</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              High-availability ChromaDB cluster with automatic regional failover.
            </p>
          </div>

          <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--accent-amber)', marginBottom: '0.4rem' }}>
              <CheckCircle2 size={18} />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>Deterministic Grounding</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              Zero hallucinated quotes backed by strict source document citations.
            </p>
          </div>
        </div>

        {/* Main 2-Column: Form & Direct Contact Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.75rem', alignItems: 'start' }}>
          
          {/* Inquiry Form */}
          <div className="card" style={{ padding: '2rem', background: 'var(--bg-surface)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Submit a Priority Inquiry
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Direct ticket creation tracked by our enterprise support engineering pod.
            </p>

            {status === 'success' ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  background: 'rgba(16, 185, 129, 0.05)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              >
                <div 
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--accent-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                  }}
                >
                  <CheckCircle2 size={26} />
                </div>
                <h4 style={{ fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem', fontSize: '1.1rem' }}>
                  Inquiry Dispatched Successfully
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                  Ticket reference #QG-{Math.floor(100000 + Math.random() * 900000)} has been generated. Our team will follow up at your registered email within the agreed SLA.
                </p>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setStatus('idle')}
                >
                  Submit Another Inquiry
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Full Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Jane Doe" 
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Work Email</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="jane@company.com" 
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Issue Category</label>
                  <select 
                    className="form-select" 
                    value={formSubject} 
                    onChange={(e) => setFormSubject(e.target.value)}
                    required
                  >
                    <option value="technical">Technical Support & Pipeline Error</option>
                    <option value="rag">Vector Knowledge Base & ChromaDB Sync</option>
                    <option value="integration">ERP / SAP S/4HANA Integration</option>
                    <option value="billing">Enterprise License & Invoicing</option>
                    <option value="feature">Custom Feature & Agent Workflow</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Inquiry Details</label>
                  <textarea 
                    className="form-textarea" 
                    rows={4} 
                    placeholder="Describe your issue, catalog questions, or pipeline requirements in detail..." 
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '0.8rem', justifyContent: 'center', marginTop: '0.5rem' }} 
                  disabled={status === 'submitting'}
                >
                  {status === 'submitting' ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="spinner" /> Submitting Inquiry...
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Send size={15} /> Send Priority Ticket
                    </span>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right Direct Channels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Live Chat Card with Working Modal Trigger */}
            <div 
              className="card" 
              style={{
                padding: '1.25rem', 
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(16, 24, 40, 0.9) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                <div 
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: 'var(--accent-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h4 style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem', margin: 0 }}>
                    Live AI Assistant
                  </h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-green)' }} /> Online Now
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
                Instant answers regarding grounding thresholds, document uploads, and configuration.
              </p>
              <button 
                className="btn btn-primary" 
                onClick={() => setIsChatOpen(true)}
                style={{ width: '100%', padding: '0.55rem', fontSize: '0.8rem', justifyContent: 'center' }}
              >
                Open Live Chat
              </button>
            </div>

            {/* Email Support */}
            <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                <div 
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Mail size={18} />
                </div>
                <div>
                  <h4 style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem', margin: 0 }}>
                    Email Engineering
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>4-hr SLA Guaranteed</span>
                </div>
              </div>
              <a 
                href="mailto:support@axion-ai.com" 
                style={{ color: 'var(--accent-blue)', fontSize: '0.82rem', fontWeight: 500, textDecoration: 'none' }}
              >
                support@axion-ai.com
              </a>
            </div>

            {/* Phone Support */}
            <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                <div 
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Phone size={18} />
                </div>
                <div>
                  <h4 style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem', margin: 0 }}>
                    Dedicated TAM Hotline
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Enterprise Tier Only</span>
                </div>
              </div>
              <div style={{ color: '#f8fafc', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
                +1 (800) 555-0199
              </div>
            </div>

          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div className="card" style={{ padding: '2rem', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <HelpCircle size={20} style={{ color: 'var(--accent-blue)' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
              Frequently Asked Questions
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div 
                  key={index}
                  style={{
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    background: isOpen ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    style={{
                      width: '100%',
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: isOpen ? '#f8fafc' : 'var(--text-secondary)',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                    }}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown 
                      size={16} 
                      style={{ 
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                        transition: 'transform 0.2s ease',
                        flexShrink: 0,
                        marginLeft: '0.5rem',
                      }} 
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div 
                          style={{ 
                            padding: '0 1.25rem 1rem 1.25rem', 
                            fontSize: '0.84rem', 
                            color: 'var(--text-secondary)', 
                            lineHeight: 1.55,
                            borderTop: '1px solid rgba(255, 255, 255, 0.03)',
                            paddingTop: '0.75rem',
                          }}
                        >
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Interactive AI Chat Modal */}
      <AnimatePresence>
        {isChatOpen && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(8px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
            onClick={() => setIsChatOpen(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: '100%',
                maxWidth: '520px',
                height: '620px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Chat Header */}
              <div 
                style={{
                  padding: '1rem 1.25rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  background: 'var(--bg-primary)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div 
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: 'var(--accent-green)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Bot size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f8fafc' }}>
                      QuoteGuard Support Agent
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-green)' }} />
                      Online · Grounded Response Mode
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setIsChatOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    borderRadius: '4px',
                  }}
                  title="Close Assistant"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Chat Message Stream */}
              <div 
                style={{
                  flex: 1,
                  padding: '1.25rem',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  background: 'var(--bg-main)',
                }}
              >
                {messages.map((msg) => (
                  <div 
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div 
                      style={{
                        maxWidth: '82%',
                        padding: '0.75rem 0.95rem',
                        borderRadius: '12px',
                        fontSize: '0.84rem',
                        lineHeight: 1.45,
                        backgroundColor: msg.sender === 'user' ? 'var(--accent-blue)' : 'var(--bg-surface)',
                        color: msg.sender === 'user' ? '#fff' : 'var(--text-main)',
                        border: msg.sender === 'user' ? 'none' : '1px solid var(--border-subtle)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                      }}
                    >
                      {msg.text}
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem', padding: '0 0.25rem' }}>
                      {msg.time}
                    </span>
                  </div>
                ))}

                {isTyping && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.75rem', padding: '0.25rem' }}>
                    <Bot size={13} /> Agent formulating response...
                  </div>
                )}
              </div>

              {/* Quick Prompt Chips */}
              <div 
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--bg-surface)',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  gap: '0.45rem',
                  overflowX: 'auto',
                }}
              >
                <button 
                  onClick={() => handleSendChatMessage('How does the Grounding Threshold work?')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.68rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  🛡️ Grounding Threshold
                </button>
                <button 
                  onClick={() => handleSendChatMessage('How do I ingest RFQ documents?')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.68rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  📄 Ingestion Specs
                </button>
                <button 
                  onClick={() => handleSendChatMessage('What are the SLA response times?')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.68rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ⚡ Support SLAs
                </button>
              </div>

              {/* Input Footer */}
              <div 
                style={{
                  padding: '0.85rem 1.25rem',
                  borderTop: '1px solid var(--border-subtle)',
                  background: 'var(--bg-primary)',
                  display: 'flex',
                  gap: '0.65rem',
                  alignItems: 'center',
                }}
              >
                <input 
                  type="text" 
                  placeholder="Ask QuoteGuard AI assistant anything..." 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendChatMessage();
                  }}
                  style={{
                    flex: 1,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.6rem 0.85rem',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
                <button 
                  className="btn btn-primary" 
                  onClick={() => handleSendChatMessage()}
                  style={{ padding: '0.6rem 0.95rem' }}
                >
                  <Send size={15} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
};
