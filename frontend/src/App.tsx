import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { RequireAuth } from './components/layout/RequireAuth';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/rfq-processing" element={<RequireAuth><RFQProcessing /></RequireAuth>} />
            <Route path="/rfqs/:id" element={<RequireAuth><RFQDetail /></RequireAuth>} />
            <Route path="/knowledge-base" element={<RequireAuth><KnowledgeBase /></RequireAuth>} />
            <Route path="/quotations" element={<RequireAuth><Quotations /></RequireAuth>} />
            <Route path="/quotations/:id" element={<RequireAuth><QuotationDetail /></RequireAuth>} />
            <Route path="/evaluation" element={<RequireAuth><Evaluation /></RequireAuth>} />
            <Route path="/organization" element={<RequireAuth><Organization /></RequireAuth>} />
            <Route path="/contact" element={<RequireAuth><ContactUs /></RequireAuth>} />
            <Route path="/settings/profile" element={<RequireAuth><ProfileSettings /></RequireAuth>} />
            <Route path="/settings/preferences" element={<RequireAuth><Preferences /></RequireAuth>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
