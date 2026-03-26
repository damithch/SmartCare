import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({
  className = '',
  hoverable = false,
  children,
  ...props
}) => {
  return (
    <motion.div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${hoverable ? 'hover:shadow-md transition-shadow cursor-pointer' : ''} ${className}`}
      {...props}>

      {children}
    </motion.div>);

};
