import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { RFQProcessing } from './pages/RFQProcessing';
import { RFQDetail } from './pages/RFQDetail';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { Quotations } from './pages/Quotations';
import { QuotationDetail } from './pages/QuotationDetail';
import { Evaluation } from './pages/Evaluation';
import { Organization } from './pages/Organization';
import { ContactUs } from './pages/ContactUs';
import { ProfileSettings } from './pages/ProfileSettings';
import { Preferences } from './pages/Preferences';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/rfq-processing" element={<RFQProcessing />} />
            <Route path="/rfqs/:id" element={<RFQDetail />} />
            <Route path="/knowledge-base" element={<KnowledgeBase />} />
            <Route path="/quotations" element={<Quotations />} />
            <Route path="/quotations/:id" element={<QuotationDetail />} />
            <Route path="/evaluation" element={<Evaluation />} />
            <Route path="/organization" element={<Organization />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/settings/profile" element={<ProfileSettings />} />
            <Route path="/settings/preferences" element={<Preferences />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
