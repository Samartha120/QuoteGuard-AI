import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Database, Receipt, BarChart3, ShieldCheck } from 'lucide-react';

export const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <ShieldCheck size={22} />
        </div>
        <div>
          <div className="brand-title">QuoteGuard AI</div>
          <div className="brand-team">Team AXION AI</div>
        </div>
      </div>

      <nav>
        <ul className="nav-list">
          <li>
            <NavLink to="/" className={({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/rfq-processing" className={({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'active' : ''}`}>
              <FileText size={18} />
              <span>RFQ Processing</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/knowledge-base" className={({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Database size={18} />
              <span>Knowledge Base</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/quotations" className={({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Receipt size={18} />
              <span>Quotations</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/evaluation" className={({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'active' : ''}`}>
              <BarChart3 size={18} />
              <span>Evaluation</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
};
