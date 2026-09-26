import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

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
        <main className="page-container">
          {children}
        </main>
      </div>
    </div>
  );
};
