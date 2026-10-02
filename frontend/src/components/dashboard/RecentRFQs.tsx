import React from 'react';
import { RFQ } from '../../types/rfq';
import { ArrowUpRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScaleReveal, StaggerContainer, StaggerItem, AnimatedLine } from '../motion';

interface RecentRFQsProps {
  rfqs: RFQ[];
}

export const RecentRFQs: React.FC<RecentRFQsProps> = ({ rfqs }) => {
  const navigate = useNavigate();

  return (
    <ScaleReveal delay={0.2} className="card" width="100%">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 className="section-title" style={{ fontSize: '1.1rem' }}>Recent Operational RFQs</h3>
        <button className="btn btn-secondary" onClick={() => navigate('/rfq-processing')}>
          View All RFQs
        </button>
      </div>
      <AnimatedLine horizontal delay={0.3} />
      <div className="table-container" style={{ marginTop: '1rem' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Date</th>
              <th>Status</th>
              <th>Grounding</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rfqs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  No RFQs processed yet. Run a sample RFQ from RFQ Processing tab.
                </td>
              </tr>
            ) : (
              rfqs.slice(0, 5).map((rfq) => (
                <tr key={rfq.id}>
                  <td style={{ fontWeight: 600, color: '#FFFFFF' }}>{rfq.customer_name}</td>
                  <td>{new Date(rfq.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${rfq.status === 'GROUNDED' ? 'badge-grounded' : 'badge-abstained'}`}>
                      {rfq.status}
                    </span>
                  </td>
                  <td>
                    {rfq.status === 'GROUNDED' ? (
                      <span style={{ color: 'var(--accent-green)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                        <ShieldCheck size={14} /> Grounded (95%+)
                      </span>
                    ) : (
                      <span style={{ color: 'var(--accent-amber)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                        <AlertTriangle size={14} /> Clarification Req.
                      </span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-secondary" onClick={() => navigate(`/rfqs/${rfq.id}`)}>
                      Inspect <ArrowUpRight size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </ScaleReveal>
  );
};
