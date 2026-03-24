import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboardIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircle2Icon,
  FileTextIcon,
  UserIcon,
  LogOutIcon,
  PillIcon,
  PackageIcon,
  ActivityIcon,
  HeartPulseIcon } from
'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Avatar } from '../ui/Avatar';

export const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout, currentPage, navigate } = useAppContext();
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!user) return null;
  const displayName = user.fullName || user.name || 'User';
  const patientLinks = [
  {
    name: 'Dashboard',
    icon: LayoutDashboardIcon,
    page: 'patient-dashboard',
    section: 'MAIN MENU'
  },
  {
    name: 'Book Appointment',
    icon: CalendarIcon,
    page: 'book-appointment',
    section: 'MAIN MENU'
  },
  {
    name: 'My Appointments',
    icon: ClockIcon,
    page: 'my-appointments',
    section: 'RECORDS'
  },
  {
    name: 'Medical History',
    icon: FileTextIcon,
    page: 'medical-history',
    section: 'RECORDS'
  },
  {
    name: 'Medicine Payments',
    icon: PillIcon,
    page: 'medicine-payments',
    section: 'RECORDS'
  }];

  const doctorLinks = [
  {
    name: 'Dashboard',
    icon: LayoutDashboardIcon,
    page: 'doctor-dashboard',
    section: 'MAIN MENU'
  },
  {
    name: 'Approvals',
    icon: CheckCircle2Icon,
    page: 'approvals',
    section: 'MANAGEMENT'
  },
  {
    name: 'Appointment Management',
    icon: CalendarIcon,
    page: 'my-schedule',
    section: 'MANAGEMENT'
  },
  {
    name: 'Availability',
    icon: ClockIcon,
    page: 'availability',
    section: 'MANAGEMENT'
  },
  {
    name: 'Consultations',
    icon: ActivityIcon,
    page: 'consultations',
    section: 'CLINICAL'
  }];

  const pharmacistLinks = [
  {
    name: 'Dashboard',
    icon: LayoutDashboardIcon,
    page: 'pharmacist-dashboard',
    section: 'MAIN MENU'
  },
  {
    name: 'Prescriptions',
    icon: PillIcon,
    page: 'prescriptions',
    section: 'OPERATIONS'
  },
  {
    name: 'Inventory',
    icon: PackageIcon,
    page: 'inventory',
    section: 'OPERATIONS'
  }];

  const studentLinks = [
  {
    name: 'My Profile',
    icon: UserIcon,
    page: 'profile',
    section: 'ACCOUNT'
  }];

  let links = patientLinks;
  if (user.role === 'doctor') links = doctorLinks;
  if (user.role === 'pharmacist') links = pharmacistLinks;
  if (user.role === 'student') links = studentLinks;
  const groupedLinks = links.reduce(
    (acc, link) => {
      if (!acc[link.section]) acc[link.section] = [];
      acc[link.section].push(link);
      return acc;
    },
    {}
  );
  return (
    <>
      {isOpen &&
      <div
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-20 md:hidden"
        onClick={() => setIsOpen(false)} />

      }

      <motion.aside
        initial={false}
        animate={{
          x: isDesktop || isOpen ? 0 : '-100%'
        }}
        transition={{
          duration: isDesktop ? 0 : 0.25,
          ease: 'easeOut'
        }}
        className="fixed md:sticky top-0 left-0 h-screen w-72 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 border-r border-slate-800 z-30 flex flex-col shadow-2xl">

        <div className="h-16 flex items-center px-6 border-b border-white/5 shrink-0">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/20 mr-3">
            <HeartPulseIcon className="h-5 w-5 text-blue-400" />
            <div className="absolute inset-0 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)] blur-sm -z-10"></div>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            SmartCare
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
          {Object.entries(groupedLinks).map(([section, sectionLinks]) =>
          <div key={section} className="space-y-2">
              <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {section}
              </h3>
              <div className="space-y-1">
                {sectionLinks.map((link) => {
                const isActive = currentPage === link.page;
                const Icon = link.icon;
                return (
                  <button
                    key={link.name}
                    onClick={() => {
                      navigate(link.page);
                      if (window.innerWidth < 768) setIsOpen(false);
                    }}
                    className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 relative group ${isActive ? 'bg-white/10 text-white shadow-[inset_2px_0_0_0_rgba(96,165,250,1)]' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>

                      <Icon
                      className={`mr-3 h-5 w-5 shrink-0 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />

                      {link.name}
                      {isActive &&
                    <motion.div
                      layoutId="active-nav-glow"
                      className="absolute left-0 w-1 h-full bg-blue-400 rounded-r-full shadow-[0_0_10px_rgba(96,165,250,0.8)]"
                      initial={{
                        opacity: 0
                      }}
                      animate={{
                        opacity: 1
                      }}
                      exit={{
                        opacity: 0
                      }} />

                    }
                    </button>);

              })}
              </div>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-white/5 shrink-0 space-y-2">
          <div
            className="flex items-center p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
            onClick={() => navigate('profile')}>

            <Avatar
              name={displayName}
              src={user.avatar}
              size="sm"
              className="ring-2 ring-slate-800" />

            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {displayName}
              </p>
              <p className="text-xs text-slate-400 capitalize truncate">
                {user.role}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-slate-400 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors group">

            <LogOutIcon className="mr-3 h-5 w-5 shrink-0 text-slate-500 group-hover:text-red-400 transition-colors" />
            Sign Out
          </button>
        </div>
      </motion.aside>
    </>);

};
