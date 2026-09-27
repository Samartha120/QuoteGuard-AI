import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, Clock } from 'lucide-react';
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

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <button
        onClick={toggle}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', position: 'relative', display: 'flex' }}
        title="Notifications"
      >
        <Bell size={16} />
        {items.length > 0 && (
          <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)' }}></span>
        )}
      </button>

      {open && (
        <div className="search-dropdown" style={{ right: 0, left: 'auto', width: '300px' }}>
          <div className="notif-header">
            Notifications {items.length > 0 && <span className="notif-count">{items.length}</span>}
          </div>
          {items.length === 0 && <div className="search-empty">You're all caught up.</div>}
          {items.map((n) => (
            <button key={n.id} className="search-result" onClick={() => goTo(n)}>
              <span className="search-result-icon">
                {n.kind === 'approval' ? <Clock size={14} /> : <AlertTriangle size={14} />}
              </span>
              <span className="search-result-text">
                <span className="search-result-label">{n.title}</span>
                <span className="search-result-sub">{n.detail}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
