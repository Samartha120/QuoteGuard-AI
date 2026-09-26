import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Footer } from './Footer';

interface PageContainerProps {
  title: string;
  children: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({ title, children }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-wrapper">
        <Topbar title={title} />
        <div className="page-scroll-container">
          <main className="page-content animate-slide-up">
            <div className="page-content-inner">
              {children}
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};
