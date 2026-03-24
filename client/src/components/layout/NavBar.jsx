import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboardIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircle2Icon,
  FileTextIcon,
  PillIcon,
  PackageIcon,
  ActivityIcon,
  UserIcon } from
'lucide-react';
import { useAppContext } from '../../context/AppContext';

export const NavBar = () => {
  const { user, currentPage, navigate } = useAppContext();
  const scrollRef = useRef(null);
  if (!user) return null;
  const patientLinks= [
  {
    name: 'Dashboard',
    icon: LayoutDashboardIcon,
    page: 'patient-dashboard'
  },
  {
    name: 'Book Appointment',
    icon: CalendarIcon,
    page: 'book-appointment'
  },
  {
    name: 'My Appointments',
    icon: ClockIcon,
    page: 'my-appointments'
  },
  {
    name: 'Medical History',
    icon: FileTextIcon,
    page: 'medical-history'
  },
  {
    name: 'Medicine Payments',
    icon: PillIcon,
    page: 'medicine-payments'
  },
  {
    name: 'Profile',
    icon: UserIcon,
    page: 'profile'
  }];

  const doctorLinks= [
  {
    name: 'Dashboard',
    icon: LayoutDashboardIcon,
    page: 'doctor-dashboard'
  },
  {
    name: 'Approvals',
    icon: CheckCircle2Icon,
    page: 'approvals'
  },
  {
    name: 'Appointment Management',
    icon: CalendarIcon,
    page: 'my-schedule'
  },
  {
    name: 'Availability',
    icon: ClockIcon,
    page: 'availability'
  },
  {
    name: 'Consultations',
    icon: ActivityIcon,
    page: 'consultations'
  },
  {
    name: 'Profile',
    icon: UserIcon,
    page: 'profile'
  }];

  const pharmacistLinks= [
  {
    name: 'Dashboard',
    icon: LayoutDashboardIcon,
    page: 'pharmacist-dashboard'
  },
  {
    name: 'Prescriptions',
    icon: PillIcon,
    page: 'prescriptions'
  },
  {
    name: 'Inventory',
    icon: PackageIcon,
    page: 'inventory'
  },
  {
    name: 'Profile',
    icon: UserIcon,
    page: 'profile'
  }];

  const studentLinks= [
  {
    name: 'Profile',
    icon: UserIcon,
    page: 'profile'
  }];

  let links = patientLinks;
  if (user.role === 'doctor') links = doctorLinks;
  if (user.role === 'pharmacist') links = pharmacistLinks;
  if (user.role === 'student') links = studentLinks;
  useEffect(() => {
    if (scrollRef.current) {
      const activeBtn = scrollRef.current.querySelector(
        '[data-active="true"]'
      );
      if (activeBtn) {
        activeBtn.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [currentPage]);
  return (
    <div className="bg-white border-b border-slate-200 sticky top-16 z-10 shadow-sm">
      <div
        ref={scrollRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center space-x-1 overflow-x-auto custom-scrollbar hide-scrollbar">

        {links.map((link) => {
          const isActive = currentPage === link.page;
          const Icon = link.icon;
          return (
            <button
              key={link.page}
              data-active={isActive}
              onClick={() => navigate(link.page)}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>

              <Icon
                className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />

              <span>{link.name}</span>

              {isActive &&
              <motion.div
                layoutId="nav-tab-indicator"
                className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 rounded-full"
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 30
                }} />

              }
            </button>);

        })}
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>);

};
