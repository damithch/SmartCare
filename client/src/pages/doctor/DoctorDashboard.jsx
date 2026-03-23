import React from 'react';
import { motion } from 'framer-motion';
import {
  UsersIcon,
  CalendarIcon,
  ClockIcon,
  DollarSignIcon,
  ChevronRightIcon,
  ActivityIcon,
  FileTextIcon,
  SettingsIcon } from
'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { mockAppointments } from '../../data/mockData';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
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
export const DoctorDashboard = () => {
  const { user, navigate } = useAppContext();
  if (!user) return null;
  const today = new Date().toISOString().split('T')[0];
  const todaysAppointments = mockAppointments.filter(
    (a) => a.doctorId === user.id && a.date === today
  );
  const pendingConsultations = todaysAppointments.filter(
    (a) => a.status === 'confirmed'
  );
  const stats = [
  {
    label: "Today's Appointments",
    value: todaysAppointments.length,
    icon: CalendarIcon,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    trend: '+1',
    trendUp: true,
    sparklineData: [4, 3, 5, 4, 6, 5, todaysAppointments.length],
    sparklineColor: '#2563EB'
  },
  {
    label: 'Total Patients',
    value: '1,248',
    icon: UsersIcon,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
    trend: '+12',
    trendUp: true,
    sparklineData: [1200, 1210, 1215, 1225, 1230, 1240, 1248],
    sparklineColor: '#059669'
  },
  {
    label: 'Pending Consultations',
    value: pendingConsultations.length,
    icon: ClockIcon,
    color: 'text-amber-600',
    bg: 'bg-amber-100',
    trend: '-2',
    trendUp: false,
    sparklineData: [5, 6, 4, 7, 3, 5, pendingConsultations.length],
    sparklineColor: '#D97706'
  },
  {
    label: 'Monthly Revenue',
    value: '$12,450',
    icon: DollarSignIcon,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
    trend: '+8%',
    trendUp: true,
    sparklineData: [9000, 9500, 10200, 11000, 10800, 11500, 12450],
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
  // Mock data for performance chart
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const consultationsData = [8, 12, 10, 15, 14, 6, 4];
  const maxConsultations = Math.max(...consultationsData);
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Welcome back, Dr. {user.name.split(' ').pop()}
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            {currentDate} • Here's your practice overview.
          </p>
        </div>
        <div className="flex-shrink-0 flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('availability')}
            className="shadow-sm">

            <SettingsIcon className="w-4 h-4 mr-2" />
            Manage Availability
          </Button>
          <Button
            onClick={() => navigate('consultations')}
            className="shadow-md shadow-blue-500/20">

            <ActivityIcon className="w-4 h-4 mr-2" />
            Start Consultation
          </Button>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {stats.map((stat, index) =>
        <motion.div key={index} variants={itemVariants}>
            <Card className="p-5 relative overflow-hidden group hover:border-blue-200 transition-colors">
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
        {/* Today's Schedule Timeline */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Today's Schedule
            </h2>
            <button
              onClick={() => navigate('my-schedule')}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center transition-colors">

              Full Schedule <ChevronRightIcon className="w-4 h-4 ml-1" />
            </button>
          </div>

          <Card className="p-6">
            {todaysAppointments.length > 0 ?
            <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 py-2">
                {todaysAppointments.map((apt, index) => {
                const isNext = apt.status === 'confirmed' && index === 0; // Mock logic for "next" appointment
                return (
                  <div key={apt.id} className="relative pl-6">
                      {/* Timeline Dot */}
                      <div
                      className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full ring-4 ring-white ${apt.status === 'completed' ? 'bg-slate-300' : isNext ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'bg-blue-400'}`} />


                      {isNext &&
                    <span className="absolute -left-16 top-1 text-xs font-bold text-blue-600 animate-pulse">
                          NOW
                        </span>
                    }

                      <div
                      className={`p-4 rounded-xl border transition-all ${isNext ? 'bg-blue-50/50 border-blue-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'}`}>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start space-x-4">
                            <div className="pt-1">
                              <p
                              className={`text-sm font-bold ${isNext ? 'text-blue-700' : 'text-slate-900'}`}>

                                {apt.time}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                30 min
                              </p>
                            </div>
                            <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>
                            <div className="flex items-center space-x-3">
                              <Avatar
                              name={apt.patientName || 'Patient'}
                              size="md"
                              className={isNext ? 'ring-2 ring-blue-200' : ''} />

                              <div>
                                <h3 className="font-bold text-slate-900">
                                  {apt.patientName}
                                </h3>
                                <p className="text-sm text-slate-500">
                                  {apt.patientAge} yrs • General Checkup
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                            variant={
                            apt.status === 'confirmed' ?
                            'warning' :
                            'success'
                            }
                            className="capitalize font-semibold">

                              {apt.status === 'confirmed' ?
                            'Upcoming' :
                            'Completed'}
                            </Badge>
                            {apt.status === 'confirmed' ?
                          <Button
                            size="sm"
                            onClick={() => navigate('consultations')}
                            className={
                            isNext ? 'shadow-md shadow-blue-500/20' : ''
                            }>

                                Start
                              </Button> :

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('medical-history')}>

                                Notes
                              </Button>
                          }
                          </div>
                        </div>
                      </div>
                    </div>);

              })}
              </div> :

            <div className="py-12 text-center">
                <div className="mx-auto w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <CalendarIcon className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  No appointments today
                </h3>
                <p className="text-sm text-slate-500 mt-1 mb-5">
                  Your schedule is clear for the day.
                </p>
                <Button
                variant="outline"
                onClick={() => navigate('availability')}>

                  Manage Availability
                </Button>
              </div>
            }
          </Card>
        </motion.div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Performance Chart */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Performance Overview
            </h2>
            <Card className="p-5">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Consultations (Last 7 Days)
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    69{' '}
                    <span className="text-sm font-medium text-emerald-600 ml-2">
                      ↑ 12%
                    </span>
                  </p>
                </div>
              </div>

              {/* Pure CSS Bar Chart */}
              <div className="h-32 flex items-end justify-between gap-2 pt-4 border-t border-slate-100">
                {consultationsData.map((val, i) => {
                  const heightPct = val / maxConsultations * 100;
                  const isToday = i === 6;
                  return (
                    <div
                      key={i}
                      className="flex flex-col items-center flex-1 group">

                      <div className="w-full relative flex justify-center h-full items-end">
                        {/* Tooltip */}
                        <div className="absolute -top-8 bg-slate-800 text-white text-xs font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {val}
                        </div>
                        {/* Bar */}
                        <div
                          className={`w-full max-w-[24px] rounded-t-sm transition-all duration-500 ${isToday ? 'bg-blue-600' : 'bg-blue-200 group-hover:bg-blue-400'}`}
                          style={{
                            height: `${heightPct}%`
                          }}>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold mt-2 ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>

                        {days[i]}
                      </span>
                    </div>);

                })}
              </div>
            </Card>
          </motion.div>

          {/* Recent Patients */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Recent Patients
              </h2>
            </div>

            <Card className="p-0 overflow-hidden border-slate-200 shadow-sm">
              <ul className="divide-y divide-slate-100">
                {[1, 2, 3].map((_, i) =>
                <li
                  key={i}
                  className="p-4 hover:bg-slate-50 transition-colors flex items-center space-x-3 cursor-pointer group">

                    <Avatar name={`Patient ${i + 1}`} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        Sarah Johnson
                      </p>
                      <p className="text-xs font-medium text-slate-500 truncate mt-0.5">
                        Hypertension follow-up
                      </p>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </li>
                )}
              </ul>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>);

};
