import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';
export const DashboardLayout = ({
  children
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentPage } = useAppContext();
  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopBar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{
                opacity: 0,
                y: 10,
                filter: 'blur(4px)'
              }}
              animate={{
                opacity: 1,
                y: 0,
                filter: 'blur(0px)'
              }}
              exit={{
                opacity: 0,
                y: -10,
                filter: 'blur(4px)'
              }}
              transition={{
                duration: 0.3,
                ease: 'easeOut'
              }}
              className="max-w-7xl mx-auto w-full h-full">

              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>);

};
