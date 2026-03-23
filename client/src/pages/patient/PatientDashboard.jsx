import React from 'react';
import { motion } from 'framer-motion';
import {
  CalendarIcon,
  ClockIcon,
  FileTextIcon,
  ActivityIcon,
  ChevronRightIcon,
  LightbulbIcon } from
'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { mockAppointments, mockPrescriptions } from '../../data/mockData';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
// Mini Sparkline Component
const Sparkline = ({
  data,
  color,
  className




}) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 30;
  const points = data.
  map((val, i) => {
    const x = i / (data.length - 1) * width;
    const y = height - (val - min) / range * height;
    return `${x},${y}`;
  }).
  join(' ');
  return (
    <svg
      viewBox={`0 -5 ${width} ${height + 10}`}
      className={`w-16 h-8 overflow-visible ${className}`}
      preserveAspectRatio="none">

      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points} />

    </svg>);

};
export const PatientDashboard = () => {
  const { user, navigate } = useAppContext();
  if (!user) return null;
  const upcomingAppointments = mockAppointments.filter(
    (a) => a.status === 'confirmed' || a.status === 'pending'
  );
  const recentPrescriptions = mockPrescriptions.slice(0, 3);
  const stats = [
  {
    label: 'Upcoming Appointments',
    value: upcomingAppointments.length,
    icon: CalendarIcon,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    trend: '+2',
    trendUp: true,
    sparklineData: [1, 0, 2, 1, 3, 2, upcomingAppointments.length],
    sparklineColor: '#2563EB'
  },
  {
    label: 'Completed Visits',
    value: mockAppointments.filter((a) => a.status === 'completed').length,
    icon: ActivityIcon,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
    trend: '+12%',
    trendUp: true,
    sparklineData: [2, 3, 3, 4, 5, 5, 6],
    sparklineColor: '#059669'
  },
  {
    label: 'Active Prescriptions',
    value: mockPrescriptions.filter(
      (p) => p.status === 'pending' || p.status === 'processing'
    ).length,
    icon: FileTextIcon,
    color: 'text-amber-600',
    bg: 'bg-amber-100',
    trend: '-1',
    trendUp: false,
    sparklineData: [3, 2, 2, 1, 2, 1, 1],
    sparklineColor: '#D97706'
  },
  {
    label: 'Total Spent',
    value: '$230',
    icon: ClockIcon,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
    trend: '+5%',
    trendUp: false,
    sparklineData: [150, 150, 150, 230, 230, 230, 230],
    sparklineColor: '#9333EA'
  }];

  const containerVariants = {
    hidden: {
      opacity: 0
    },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    show: {
      opacity: 1,
      y: 0
    }
  };
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Good morning, {user.name.split(' ')[0]}
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            {currentDate} • Here's your health overview.
          </p>
        </div>
        <div className="flex-shrink-0">
          <Button
            onClick={() => navigate('book-appointment')}
            className="shadow-md shadow-blue-500/20">

            <CalendarIcon className="w-4 h-4 mr-2" />
            Book Appointment
          </Button>
        </div>
      </div>

      {/* Health Tip Banner */}
      <motion.div
        initial={{
          opacity: 0,
          y: -10
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        transition={{
          delay: 0.2
        }}>

        <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100 rounded-xl p-4 flex items-start sm:items-center space-x-4 shadow-sm">
          <div className="bg-white p-2 rounded-full shadow-sm shrink-0">
            <LightbulbIcon className="w-5 h-5 text-teal-500" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Daily Health Tip
            </h4>
            <p className="text-sm text-slate-600 mt-0.5">
              Stay hydrated! Drinking 8 glasses of water daily helps maintain
              energy levels and supports joint health.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {stats.map((stat, index) =>
        <motion.div key={index} variants={itemVariants}>
            <Card className="p-5 relative overflow-hidden group hover:border-blue-200 transition-colors">
              {/* Subtle gradient background on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>

              <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div
                className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${stat.trendUp ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>

                  {stat.trend}
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-sm font-medium text-slate-500 mt-1">
                    {stat.label}
                  </p>
                </div>
                <div className="opacity-60 group-hover:opacity-100 transition-opacity pb-1">
                  <Sparkline
                  data={stat.sparklineData}
                  color={stat.sparklineColor} />

                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Upcoming Appointments
            </h2>
            <button
              onClick={() => navigate('my-appointments')}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center transition-colors">

              View All <ChevronRightIcon className="w-4 h-4 ml-1" />
            </button>
          </div>

          {upcomingAppointments.length > 0 ?
          <div className="space-y-3">
              {upcomingAppointments.map((apt) =>
            <Card
              key={apt.id}
              className="p-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
              onClick={() => navigate('my-appointments')}>

                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="bg-slate-50 group-hover:bg-blue-50 transition-colors p-3 rounded-xl text-slate-700 group-hover:text-blue-700 text-center min-w-[4.5rem] border border-slate-100 group-hover:border-blue-100">
                        <p className="text-[10px] font-bold uppercase tracking-wider">
                          {new Date(apt.date).toLocaleString('default', {
                        month: 'short'
                      })}
                        </p>
                        <p className="text-2xl font-black leading-none mt-1">
                          {new Date(apt.date).getDate()}
                        </p>
                      </div>
                      <div className="pt-1">
                        <h3 className="font-bold text-slate-900 text-base">
                          {apt.doctorName}
                        </h3>
                        <p className="text-sm font-medium text-blue-600">
                          {apt.doctorSpecialization}
                        </p>
                        <div className="flex items-center mt-2 text-sm font-medium text-slate-500">
                          <ClockIcon className="w-4 h-4 mr-1.5 text-slate-400" />
                          {apt.time}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between h-full">
                      <Badge
                    variant={
                    apt.status === 'confirmed' ? 'success' : 'warning'
                    }
                    className="capitalize font-semibold shadow-sm">

                        {apt.status}
                      </Badge>
                      <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs font-bold text-blue-600 flex items-center">
                          Details{' '}
                          <ChevronRightIcon className="w-3 h-3 ml-0.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
            )}
            </div> :

          <Card className="p-10 text-center border-dashed border-2 bg-slate-50/50">
              <div className="mx-auto w-14 h-14 bg-white shadow-sm rounded-full flex items-center justify-center mb-4">
                <CalendarIcon className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                No upcoming appointments
              </h3>
              <p className="text-sm text-slate-500 mt-1 mb-5 max-w-xs mx-auto">
                You don't have any scheduled visits. Book an appointment to see
                a doctor.
              </p>
              <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('book-appointment')}
              className="font-semibold">

                Book Now
              </Button>
            </Card>
          }
        </motion.div>

        {/* Recent Prescriptions */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Recent Prescriptions
            </h2>
            <button
              onClick={() => navigate('medical-history')}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center transition-colors">

              History <ChevronRightIcon className="w-4 h-4 ml-1" />
            </button>
          </div>

          <Card className="p-0 overflow-hidden border-slate-200 shadow-sm">
            <ul className="divide-y divide-slate-100">
              {recentPrescriptions.map((rx) =>
              <li
                key={rx.id}
                className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                onClick={() => navigate('medical-history')}>

                  <div className="flex justify-between items-start mb-1.5">
                    <p className="font-bold text-slate-900 truncate pr-2 group-hover:text-blue-600 transition-colors">
                      {rx.medicines.map((m) => m.name.split(' ')[0]).join(', ')}
                    </p>
                    <Badge
                    variant={
                    rx.status === 'dispensed' ? 'success' : 'warning'
                    }
                    className="text-[10px] capitalize shrink-0 font-bold">

                      {rx.status}
                    </Badge>
                  </div>
                  <p className="text-xs font-medium text-slate-500">
                    Prescribed by {rx.doctorName}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {new Date(rx.date).toLocaleDateString()}
                    </p>
                    <ChevronRightIcon className="w-3 h-3 text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </li>
              )}
              {recentPrescriptions.length === 0 &&
              <li className="p-8 text-center flex flex-col items-center justify-center">
                  <FileTextIcon className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-500">
                    No recent prescriptions.
                  </p>
                </li>
              }
            </ul>
          </Card>
        </motion.div>
      </div>
    </div>);

};
