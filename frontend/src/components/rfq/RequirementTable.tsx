import React from 'react';
import { RequirementExtracted } from '../../types/rfq';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface RequirementTableProps {
  requirements: RequirementExtracted[];
}

export const RequirementTable: React.FC<RequirementTableProps> = ({ requirements }) => {
  return (
    <div className="card">
      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', color: '#FFFFFF' }}>
        Stage 1: Extracted Structured Requirements
      </h4>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Material Spec</th>
              <th>Qty</th>
              <th>Grounding Verification</th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((req, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600, color: '#FFFFFF' }}>{req.product_name}</td>
                <td>{req.material_grade || req.requested_spec || 'Standard Stock'}</td>
                <td>{req.quantity}</td>
                <td>
                  {req.status === 'verified' ? (
                    <span className="badge badge-grounded">
                      <CheckCircle2 size={12} /> Verified Stock Grade
                    </span>
                  ) : (
                    <span className="badge badge-abstained">
                      <AlertTriangle size={12} /> Unverified / Mismatch
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
