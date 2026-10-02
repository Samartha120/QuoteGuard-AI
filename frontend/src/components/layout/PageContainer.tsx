import React from 'react';
import { motion } from 'framer-motion';
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
          <main className="page-content">
            <motion.div 
              className="page-content-inner"
              initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
              animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};
