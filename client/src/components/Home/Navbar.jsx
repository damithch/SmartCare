import React, { useEffect, useState } from 'react';
import { HeartPulseIcon, MenuIcon, XIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';
export function Navbar() {
  const { navigate } = useAppContext();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40); // 40px is approx TopBar height
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const navLinks = ['DEPARTMENTS', 'SERVICES', 'APPOINTMENTS', 'EMERGENCY'];
  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 bg-white ${isScrolled ? 'shadow-md py-4' : 'py-6'}`}>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo - styled like ESU (Blue text, red accent) */}
          <div className="flex items-center gap-1 cursor-pointer">
            <span className="text-4xl font-black text-[#0047AB] tracking-tighter">
              Smart
            </span>
            <div className="relative flex items-center justify-center">
              <span className="text-4xl font-black text-[#0047AB] tracking-tighter">
                Care
              </span>
              <HeartPulseIcon
                className="absolute -top-3 -right-4 h-6 w-6 text-[#DC2626]"
                strokeWidth={3} />

            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-10">
            <ul className="flex items-center gap-8">
              {navLinks.map((link) =>
              <li key={link}>
                  <a
                  href={`#${link.toLowerCase()}`}
                  className="text-[#1A1A2E] hover:text-[#0047AB] font-bold text-sm tracking-wider transition-colors">

                    {link}
                  </a>
                </li>
              )}
            </ul>
          </nav>

          <div className="hidden lg:block">
            <button
              className="bg-[#0047AB] hover:bg-[#003DA5] text-white px-8 py-3 rounded-md font-bold transition-all shadow-md"
              onClick={() => navigate('register')}>
              Book Now
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 text-[#1A1A2E]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu">

            {isMobileMenuOpen ?
            <XIcon className="h-8 w-8" /> :

            <MenuIcon className="h-8 w-8" />
            }
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen &&
        <motion.div
          initial={{
            opacity: 0,
            height: 0
          }}
          animate={{
            opacity: 1,
            height: 'auto'
          }}
          exit={{
            opacity: 0,
            height: 0
          }}
          className="lg:hidden bg-white border-t border-gray-100 overflow-hidden">

            <div className="px-4 py-6 space-y-6">
              <ul className="space-y-4">
                {navLinks.map((link) =>
              <li key={link}>
                    <a
                  href={`#${link.toLowerCase()}`}
                  className="block text-[#1A1A2E] font-bold text-lg tracking-wide"
                  onClick={() => setIsMobileMenuOpen(false)}>

                      {link}
                    </a>
                  </li>
              )}
              </ul>
              <button
                className="w-full bg-[#0047AB] text-white px-6 py-4 rounded-md font-bold text-lg"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate('register');
                }}>
                Book Now
              </button>
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </header>);

}
