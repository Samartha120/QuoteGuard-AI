import React, { useRef } from 'react';
import { motion, useInView, useScroll, useTransform, Variants } from 'framer-motion';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  width?: 'fit-content' | '100%';
}

const printVariants: Variants = {
  hidden: { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
  visible: { 
    opacity: 1, 
    clipPath: 'inset(0 0% 0 0)',
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  }
};

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  }
};

const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  }
};

export const PrintReveal: React.FC<RevealProps> = ({ children, delay = 0, width = 'fit-content', className = '' }) => {
  return (
    <motion.div 
      variants={printVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10%" }}
      style={{ width }}
      className={className}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
};

export const FadeUpReveal: React.FC<RevealProps> = ({ children, delay = 0, width = '100%', className = '' }) => {
  return (
    <motion.div 
      variants={fadeUpVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-5%" }}
      style={{ width }}
      className={className}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
};

export const ScaleReveal: React.FC<RevealProps> = ({ children, delay = 0, width = '100%', className = '' }) => {
  return (
    <motion.div 
      variants={scaleVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-5%" }}
      style={{ width }}
      className={className}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
};

interface StaggerContextProps {
  children: React.ReactNode;
  className?: string;
  delayOrder?: number; // base delay
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export const StaggerContainer: React.FC<StaggerContextProps> = ({ children, className = '', delayOrder = 0 }) => {
  return (
    <motion.div 
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-5%" }}
      className={className}
      transition={{ delay: delayOrder * 0.2 }}
    >
      {children}
    </motion.div>
  );
};

export const StaggerTableBody: React.FC<StaggerContextProps> = ({ children, className = '', delayOrder = 0 }) => {
  return (
    <motion.tbody 
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-5%" }}
      className={className}
      transition={{ delay: delayOrder * 0.2 }}
    >
      {children}
    </motion.tbody>
  );
};

export const StaggerItem: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <motion.div variants={fadeUpVariants} className={className}>
      {children}
    </motion.div>
  );
};

export const StaggerTableRow: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <motion.tr variants={fadeUpVariants} className={className}>
      {children}
    </motion.tr>
  );
};

export const AnimatedLine: React.FC<{ horizontal?: boolean; delay?: number }> = ({ horizontal = true, delay = 0 }) => {
  return (
    <motion.div
      initial={{ scaleX: horizontal ? 0 : 1, scaleY: horizontal ? 1 : 0, transformOrigin: '0 0' }}
      whileInView={{ scaleX: 1, scaleY: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay }}
      style={{
        width: horizontal ? '100%' : '1px',
        height: horizontal ? '1px' : '100%',
        background: 'var(--border-strong)',
        opacity: 0.5
      }}
    />
  );
};

export const RegistrationMark: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, rotate: -45, scale: 0.5 }}
      whileInView={{ opacity: 1, rotate: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1], delay }}
      style={{
        width: '12px',
        height: '12px',
        border: '1px solid var(--accent-green)',
        position: 'relative',
        display: 'inline-block'
      }}
    >
      <div style={{ position: 'absolute', top: '50%', left: '-4px', right: '-4px', height: '1px', background: 'var(--accent-green)', transform: 'translateY(-50%)' }} />
      <div style={{ position: 'absolute', left: '50%', top: '-4px', bottom: '-4px', width: '1px', background: 'var(--accent-green)', transform: 'translateX(-50%)' }} />
    </motion.div>
  );
};
