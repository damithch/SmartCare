import React, { useState } from 'react';
import {
  MenuIcon,
  BellIcon,
  ChevronRightIcon,
  CalendarIcon,
  PillIcon,
  ActivityIcon,
  UserIcon,
  ClockIcon } from
'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Avatar } from '../ui/Avatar';
import { motion, AnimatePresence } from 'framer-motion';

export const TopBar = ({ toggleSidebar }) => {
  const { user, currentPage, navigate } = useAppContext();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  if (!user) return null;
  const displayName = user.fullName || user.name || 'User';
  const firstName = displayName.split(' ')[0] || 'User';
  const homePage = user.role === 'student' ? 'profile' : `${user.role}-dashboard`;
  const getPageTitle = () => {
    const titles= {
      'patient-dashboard': 'Patient Dashboard',
      'book-appointment': 'Book Appointment',
      'my-appointments': 'My Appointments',
      'medical-history': 'Medical History',
      'medicine-payments': 'Medicine Payments',
      'doctor-dashboard': 'Doctor Dashboard',
      approvals: 'Appointment Requests',
      'my-schedule': 'Appointment Management',
      availability: 'Availability Manager',
      consultations: 'Consultations',
      'pharmacist-dashboard': 'Pharmacist Dashboard',
      prescriptions: 'Prescription Queue',
      inventory: 'Inventory Management',
      profile: 'My Profile'
    };
    return titles[currentPage] || 'Dashboard';
  };
  const unreadCount = 0;
  const userNotifications = [];
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'appointment':
        return <CalendarIcon className="w-4 h-4 text-blue-500" />;
      case 'prescription':
        return <PillIcon className="w-4 h-4 text-teal-500" />;
      default:
        return <ActivityIcon className="w-4 h-4 text-slate-500" />;
    }
  };
  const getNotificationColor = (type) => {
    switch (type) {
      case 'appointment':
        return 'border-blue-500';
      case 'prescription':
        return 'border-teal-500';
      default:
        return 'border-slate-300';
    }
  };
  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="mr-4 p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 md:hidden transition-colors">

          <MenuIcon className="h-6 w-6" />
        </button>

        <div className="hidden sm:flex items-center text-sm font-medium">
          <span
            className="text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
            onClick={() => navigate(homePage)}>

            Home
          </span>
          <ChevronRightIcon className="w-4 h-4 mx-2 text-slate-300" />
          <span className="text-slate-900">{getPageTitle()}</span>
        </div>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-5">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 relative transition-colors">

            <BellIcon className="h-5 w-5" />
            {unreadCount > 0 &&
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 ring-2 ring-white"></span>
              </span>
            }
          </button>

          <AnimatePresence>
            {showNotifications &&
            <motion.div
              initial={{
                opacity: 0,
                y: 10,
                scale: 0.95
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1
              }}
              exit={{
                opacity: 0,
                y: 10,
                scale: 0.95
              }}
              transition={{
                duration: 0.2
              }}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 origin-top-right">

                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-semibold text-slate-900">
                    Notifications
                  </h3>
                  <span className="text-xs text-blue-600 font-medium cursor-pointer hover:text-blue-700 transition-colors">
                    Mark all read
                  </span>
                </div>
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {userNotifications.length > 0 ?
                userNotifications.map((notification) =>
                <div
                  key={notification.id}
                  className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-start space-x-3 border-l-4 ${getNotificationColor(notification.type)} ${!notification.isRead ? 'bg-blue-50/30' : ''}`}>

                        <div className="mt-0.5 bg-white p-1.5 rounded-full shadow-sm border border-slate-100 shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div>
                          <p
                      className={`text-sm ${!notification.isRead ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>

                            {notification.title}
                          </p>
                          <p className="text-sm text-slate-600 mt-1 leading-snug">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-400 mt-2 font-medium">
                            {notification.timestamp}
                          </p>
                        </div>
                      </div>
                ) :

                <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center">
                      <BellIcon className="w-8 h-8 text-slate-300 mb-2" />
                      No new notifications
                    </div>
                }
                </div>
              </motion.div>
            }
          </AnimatePresence>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2 pl-1 pr-3 py-1 rounded-full hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all">

            <Avatar name={displayName} src={user.avatar} size="sm" />
            <div className="hidden sm:flex flex-col items-start text-left">
              <span className="text-sm font-semibold text-slate-700 leading-tight">
                {firstName}
              </span>
              <span className="text-[10px] font-medium text-slate-500 capitalize leading-tight">
                {user.role}
              </span>
            </div>
          </button>

          <AnimatePresence>
            {showProfileMenu &&
            <motion.div
              initial={{
                opacity: 0,
                y: 10,
                scale: 0.95
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1
              }}
              exit={{
                opacity: 0,
                y: 10,
                scale: 0.95
              }}
              transition={{
                duration: 0.2
              }}
              className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 origin-top-right">

                <div className="px-4 py-3 border-b border-slate-100 mb-2 bg-slate-50/50">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {user.email}
                  </p>
                </div>

                <div className="px-2 space-y-1">
                  <button
                  onClick={() => {
                    navigate('profile');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors flex items-center">

                    <UserIcon className="w-4 h-4 mr-2 text-slate-400" />
                    View Profile
                  </button>

                  {user.role === 'patient' &&
                <button
                  onClick={() => {
                    navigate('book-appointment');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors flex items-center">

                      <CalendarIcon className="w-4 h-4 mr-2 text-slate-400" />
                      Book Appointment
                    </button>
                }

                  {user.role === 'doctor' &&
                <button
                  onClick={() => {
                    navigate('availability');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors flex items-center">

                      <ClockIcon className="w-4 h-4 mr-2 text-slate-400" />
                      Manage Availability
                    </button>
                }
                </div>
              </motion.div>
            }
          </AnimatePresence>
        </div>
      </div>
    </header>);

};
