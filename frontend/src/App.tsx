import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { RFQProcessing } from './pages/RFQProcessing';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { Quotations } from './pages/Quotations';
import { QuotationDetail } from './pages/QuotationDetail';
import { Evaluation } from './pages/Evaluation';

export const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/rfq-processing" element={<RFQProcessing />} />
        <Route path="/knowledge-base" element={<KnowledgeBase />} />
        <Route path="/quotations" element={<Quotations />} />
        <Route path="/quotations/:id" element={<QuotationDetail />} />
        <Route path="/evaluation" element={<Evaluation />} />
      </Routes>
    </Router>
  );
};

export default App;
