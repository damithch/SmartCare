import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLinkIcon } from 'lucide-react';
export function HeroSection() {
  const tabs = [
  'Cardiology',
  'Neurology',
  'Pediatrics',
  'Orthopedics',
  'Emergency Care',
  'General Medicine'];

  return (
    <section className="relative h-[80vh] min-h-[600px] w-full overflow-hidden flex flex-col justify-end pb-8">
      {/* Background Image/Gradient Placeholder */}
      <div className="absolute inset-0 z-0">
        {/* We use a complex gradient to simulate a dark, professional healthcare photo environment */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A1628] via-[#0A1628]/90 to-transparent z-10"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat opacity-40 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628] via-transparent to-transparent z-10"></div>
      </div>

      {/* Large Watermark Logo */}
      <div className="absolute bottom-32 left-8 z-10 opacity-10 pointer-events-none select-none hidden md:block">
        <span className="text-[12rem] font-black text-white leading-none tracking-tighter">
          SmartCare
        </span>
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.div
          initial={{
            opacity: 0,
            y: 30
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            duration: 0.8,
            ease: 'easeOut'
          }}
          className="max-w-3xl mb-16">

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-[1.1] tracking-tight">
            We are committed to <br />
            Education and Excellence <br />
            Beyond Boundaries.
          </h1>
        </motion.div>

        {/* Glassmorphism Tabs */}
        <motion.div
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            duration: 0.8,
            delay: 0.3,
            ease: 'easeOut'
          }}
          className="flex flex-wrap gap-2 md:gap-4">

          {tabs.map((tab, index) =>
          <button
            key={tab}
            className={`group relative overflow-hidden backdrop-blur-md border border-white/20 text-white px-6 py-4 rounded-md font-medium text-sm md:text-base transition-all duration-300 flex items-center gap-2
                ${index === 3 ? 'bg-[#0047AB] border-[#0047AB]' : 'bg-white/10 hover:bg-white/20'}`}>

              {tab}
              {index === 3 && <ExternalLinkIcon className="w-4 h-4" />}
            </button>
          )}
        </motion.div>
      </div>
    </section>);

}