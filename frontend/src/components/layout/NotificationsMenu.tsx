import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, Clock, Check, Filter } from 'lucide-react';
import { quotationApi } from '../../api/quotationApi';
import { Quotation } from '../../types/quotation';

interface Notification {
  id: string;
  title: string;
  detail: string;
  kind: 'approval' | 'clarification';
  to: string;
}

export const NotificationsMenu: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'approval' | 'clarification'>('all');
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const quotations = await quotationApi.listQuotations();
      const notes: Notification[] = quotations
        .filter((q: Quotation) => q.status === 'PENDING_APPROVAL' || q.status === 'CLARIFICATION_REQUIRED')
        .map((q: Quotation) => ({
          id: q.id,
          title:
            q.status === 'PENDING_APPROVAL'
              ? `Quotation ${q.quotation_number} awaiting approval`
              : `Quotation ${q.quotation_number} needs clarification`,
          detail: q.customer_name,
          kind: q.status === 'PENDING_APPROVAL' ? 'approval' : 'clarification',
          to: `/quotations/${q.id}`,
        }));
      setItems(notes);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const toggle = () => {
    if (!open) load();
    setOpen(!open);
  };

  const goTo = (n: Notification) => {
    setOpen(false);
    navigate(n.to);
  };

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter(i => i.kind === filter);
  }, [items, filter]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <button
        onClick={toggle}
        style={{ 
          background: 'var(--bg-surface-hover)', 
          border: '1px solid var(--border-subtle)', 
          borderRadius: '8px', 
          cursor: 'pointer', 
          color: 'var(--text-secondary)', 
          position: 'relative', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: 32, 
          height: 32 
        }}
        title="Notifications & Operational Alerts"
      >
        <Bell size={15} />
        {items.length > 0 && (
          <span style={{ position: 'absolute', top: '5px', right: '5px', width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 6px var(--accent-green)' }}></span>
        )}
      </button>

      {open && (
        <div className="search-dropdown" style={{ right: 0, left: 'auto', width: '320px', padding: '0.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: '12px', boxShadow: 'var(--card-shadow)', zIndex: 100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', paddingBottom: '0.45rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>Actionable Alerts</span>
              {items.length > 0 && (
                <span style={{ fontSize: '0.68rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)', padding: '0.1rem 0.4rem', borderRadius: '9999px', fontWeight: 700 }}>
                  {items.length}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.2rem' }}>
              {(['all', 'approval', 'clarification'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  style={{
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    padding: '0.15rem 0.35rem',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    background: filter === tab ? 'var(--accent-blue)' : 'transparent',
                    color: filter === tab ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {tab === 'clarification' ? 'Clarif' : tab}
                </button>
              ))}
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No pending alerts. All quotations are up to date.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '320px', overflowY: 'auto' }}>
              {filteredItems.map((n) => (
                <button 
                  key={n.id} 
                  onClick={() => goTo(n)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem',
                    padding: '0.55rem 0.65rem',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-blue)';
                    e.currentTarget.style.background = 'var(--bg-surface-hover)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.background = 'var(--bg-main)';
                  }}
                >
                  <span style={{ marginTop: '0.15rem', color: n.kind === 'approval' ? 'var(--accent-green)' : 'var(--accent-amber)', flexShrink: 0 }}>
                    {n.kind === 'approval' ? <Clock size={14} /> : <AlertTriangle size={14} />}
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.3 }}>
                      {n.title}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      Customer: {n.detail}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
