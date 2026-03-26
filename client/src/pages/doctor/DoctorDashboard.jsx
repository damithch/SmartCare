import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  UsersIcon,
  CalendarIcon,
  ClockIcon,
  DollarSignIcon,
  ChevronRightIcon,
  ActivityIcon,
  SettingsIcon,
  TrendingUpIcon,
  AlertCircleIcon,
  CheckCircle2Icon
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { fetchMyAppointments, fetchMyAvailability, updateAppointment } from '../../services/auth';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';

const Sparkline = ({ data, color, className }) => {
  const safeData = Array.isArray(data) && data.length > 1 ? data : [0, 0];
  const max = Math.max(...safeData);
  const min = Math.min(...safeData);
  const range = max - min || 1;
  const width = 100;
  const height = 30;
  const points = safeData
    .map((value, index) => {
      const x = (index / (safeData.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 -5 ${width} ${height + 10}`} className={`h-8 w-16 overflow-visible ${className || ''}`} preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
};

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

const getTrend = (current, previous) => {
  const diff = current - previous;
  const directionUp = diff >= 0;
  const label = diff === 0 ? '0' : `${directionUp ? '+' : ''}${diff}`;
  return { label, directionUp };
};

const groupCountsByRecentDays = (appointments, daysToTrack = 7) => {
  const today = new Date();
  const results = [];

  for (let offset = daysToTrack - 1; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setHours(0, 0, 0, 0);
    day.setDate(today.getDate() - offset);

    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);

    const count = appointments.filter((appointment) => {
      const date = new Date(appointment.appointmentDate);
      return date >= day && date < nextDay;
    }).length;

    results.push(count);
  }

  return results;
};

const formatTime = (dateLike) => {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });
};

export const DoctorDashboard = () => {
  const { user, token, navigate } = useAppContext();
  const [appointments, setAppointments] = useState([]);
  const [todaySlots, setTodaySlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAppointmentId, setActiveAppointmentId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !token) {
      return undefined;
    }

    let isMounted = true;
    const today = new Date().toISOString().split('T')[0];

    const loadDashboardData = async () => {
      try {
        if (isMounted) {
          setError('');
        }

        const [appointmentData, availabilityData] = await Promise.all([
          fetchMyAppointments(token),
          fetchMyAvailability(token, today)
        ]);

        if (!isMounted) {
          return;
        }

        setAppointments(Array.isArray(appointmentData) ? appointmentData : []);
        setTodaySlots(Array.isArray(availabilityData) ? availabilityData : []);
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load doctor dashboard');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDashboardData();
    const intervalId = setInterval(loadDashboardData, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [token, user]);

  const displayName = user?.fullName || user?.name || 'Doctor';
  const lastName = displayName.split(' ').pop() || 'Doctor';
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const todaysAppointments = useMemo(
    () => appointments
      .filter((appointment) => {
        const date = new Date(appointment.appointmentDate);
        return date >= today && date < tomorrow;
      })
      .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate)),
    [appointments]
  );

  const upcomingAppointments = useMemo(
    () => appointments
      .filter((appointment) => ['pending', 'approved'].includes(appointment.status) && new Date(appointment.appointmentDate) >= new Date())
      .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate)),
    [appointments]
  );

  const monthlyAppointments = useMemo(
    () => appointments.filter((appointment) => new Date(appointment.appointmentDate) >= monthStart),
    [appointments]
  );

  const completedAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === 'completed'),
    [appointments]
  );

  const completedThisMonth = useMemo(
    () => completedAppointments.filter((appointment) => new Date(appointment.appointmentDate) >= monthStart),
    [completedAppointments]
  );

  const uniquePatientsCount = useMemo(
    () => new Set(appointments.map((appointment) => appointment.patient?._id).filter(Boolean)).size,
    [appointments]
  );

  const bookedTodaySlots = useMemo(
    () => todaySlots.filter((slot) => slot.isBooked),
    [todaySlots]
  );

  const openTodaySlots = useMemo(
    () => todaySlots.filter((slot) => !slot.isBooked),
    [todaySlots]
  );

  const pendingConsultations = useMemo(
    () => todaysAppointments.filter((appointment) => appointment.status === 'approved'),
    [todaysAppointments]
  );

  const monthlyRevenue = useMemo(
    () => completedThisMonth.reduce((sum, appointment) => sum + Number(appointment.amountPaid || appointment.availabilitySlot?.price || 0), 0),
    [completedThisMonth]
  );

  const appointmentTrendData = useMemo(() => groupCountsByRecentDays(appointments, 7), [appointments]);
  const todayTrend = getTrend(todaysAppointments.length, appointmentTrendData[appointmentTrendData.length - 2] || 0);
  const patientTrend = getTrend(uniquePatientsCount, Math.max(uniquePatientsCount - Math.max(todaysAppointments.length, 1), 0));
  const pendingTrend = getTrend(pendingConsultations.length, todaysAppointments.length - pendingConsultations.length);
  const revenueTrend = getTrend(monthlyRevenue, monthlyRevenue - completedThisMonth.reduce((sum, appointment) => sum + Number(appointment.amountPaid || 0), 0));
  const pendingApprovals = useMemo(
    () => todaysAppointments.filter((appointment) => appointment.status === 'pending'),
    [todaysAppointments]
  );

  const stats = [
    {
      label: "Today's Appointments",
      value: todaysAppointments.length,
      icon: CalendarIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      trend: todayTrend.label,
      trendUp: todayTrend.directionUp,
      sparklineData: appointmentTrendData,
      sparklineColor: '#2563EB'
    },
    {
      label: 'Unique Patients',
      value: uniquePatientsCount,
      icon: UsersIcon,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      trend: patientTrend.label,
      trendUp: patientTrend.directionUp,
      sparklineData: appointmentTrendData.map((value, index) => Math.max(value + index, 0)),
      sparklineColor: '#059669'
    },
    {
      label: 'Pending Consultations',
      value: pendingConsultations.length,
      icon: ClockIcon,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
      trend: pendingTrend.label,
      trendUp: !pendingTrend.directionUp,
      sparklineData: appointmentTrendData,
      sparklineColor: '#D97706'
    },
    {
      label: 'Awaiting Approval',
      value: pendingApprovals.length,
      icon: CheckCircle2Icon,
      color: 'text-cyan-600',
      bg: 'bg-cyan-100',
      trend: `${pendingApprovals.length}`,
      trendUp: false,
      sparklineData: appointmentTrendData,
      sparklineColor: '#0891B2'
    },
    {
      label: 'Monthly Revenue',
      value: formatCurrency(monthlyRevenue),
      icon: DollarSignIcon,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      trend: revenueTrend.label,
      trendUp: revenueTrend.directionUp,
      sparklineData: appointmentTrendData.map((value) => value * 50),
      sparklineColor: '#9333EA'
    }
  ];

  const recentPatients = useMemo(() => {
    const seen = new Set();
    return upcomingAppointments
      .filter((appointment) => {
        const patientId = appointment.patient?._id;
        if (!patientId || seen.has(patientId)) {
          return false;
        }
        seen.add(patientId);
        return true;
      })
      .slice(0, 4);
  }, [upcomingAppointments]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const updateAppointmentState = async (appointmentId, nextStatus) => {
    if (!token) {
      return;
    }

    setActiveAppointmentId(appointmentId);
    setError('');

    try {
      const updatedAppointment = await updateAppointment(token, appointmentId, { status: nextStatus });
      setAppointments((current) =>
        current.map((appointment) => (appointment._id === appointmentId ? updatedAppointment : appointment))
      );
    } catch (err) {
      setError(err.message || 'Failed to update appointment');
    } finally {
      setActiveAppointmentId('');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Welcome back, Dr. {lastName}</h1>
          <p className="mt-1 font-medium text-slate-500">{currentDate} � Here's your live practice overview.</p>
        </div>
        <div className="flex flex-shrink-0 gap-3">
          <Button variant="outline" onClick={() => navigate('availability')} className="shadow-sm">
            <SettingsIcon className="mr-2 h-4 w-4" />
            Manage Availability
          </Button>
          <Button onClick={() => navigate('consultations')} className="shadow-md shadow-blue-500/20">
            <ActivityIcon className="mr-2 h-4 w-4" />
            Start Consultation
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card className="group relative overflow-hidden p-5 transition-colors hover:border-blue-200">
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white to-slate-50 opacity-0 transition-opacity group-hover:opacity-100"></div>
              <div className="mb-4 flex items-start justify-between">
                <div className={`rounded-xl p-2.5 ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className={`flex items-center rounded-full px-2 py-1 text-xs font-bold ${stat.trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {stat.trend}
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-extrabold tracking-tight text-slate-900">{stat.value}</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">{stat.label}</p>
                </div>
                <div className="pb-1 opacity-60 transition-opacity group-hover:opacity-100">
                  <Sparkline data={stat.sparklineData} color={stat.sparklineColor} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div variants={itemVariants} className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Today's Schedule</h2>
            <button onClick={() => navigate('my-schedule')} className="flex items-center text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700">
              Full Schedule <ChevronRightIcon className="ml-1 h-4 w-4" />
            </button>
          </div>

          <Card className="p-6">
            {isLoading ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
                  <CalendarIcon className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Loading dashboard</h3>
                <p className="mt-1 text-sm text-slate-500">Fetching your real appointments and availability.</p>
              </div>
            ) : todaysAppointments.length > 0 ? (
              <div className="relative ml-3 space-y-8 border-l-2 border-slate-100 py-2">
                {todaysAppointments.map((appointment, index) => {
                  const appointmentTime = formatTime(appointment.appointmentDate);
                  const isNext = ['pending', 'approved'].includes(appointment.status) && index === 0;
                  const patientName = appointment.patient?.fullName || 'Patient';
                  const patientEmail = appointment.patient?.email || 'No email';

                  return (
                    <div key={appointment._id} className="relative pl-6">
                      <div className={`absolute -left-[9px] top-1.5 h-4 w-4 rounded-full ring-4 ring-white ${appointment.status === 'completed' ? 'bg-slate-300' : isNext ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'bg-blue-400'}`}></div>
                      {isNext && <span className="absolute -left-16 top-1 animate-pulse text-xs font-bold text-blue-600">NOW</span>}

                      <div className={`rounded-xl border p-4 transition-all ${isNext ? 'border-blue-200 bg-blue-50/50 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="pt-1">
                              <p className={`text-sm font-bold ${isNext ? 'text-blue-700' : 'text-slate-900'}`}>{appointmentTime}</p>
                              <p className="mt-0.5 text-xs text-slate-500">{appointment.paymentStatus === 'paid' ? 'Paid' : 'Pending payment'}</p>
                            </div>
                            <div className="hidden h-10 w-px bg-slate-200 sm:block"></div>
                            <div className="flex items-center space-x-3">
                              <Avatar name={patientName} size="md" className={isNext ? 'ring-2 ring-blue-200' : ''} />
                              <div>
                                <h3 className="font-bold text-slate-900">{patientName}</h3>
                                <p className="text-sm text-slate-500">{patientEmail}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={appointment.status === 'approved' ? 'success' : appointment.status === 'pending' ? 'warning' : appointment.status === 'completed' ? 'info' : ['rejected', 'cancelled'].includes(appointment.status) ? 'danger' : 'default'} className="capitalize font-semibold">
                              {appointment.status}
                            </Badge>
                            {appointment.status === 'pending' ? (
                              <>
                                <Button
                                  size="sm"
                                  isLoading={activeAppointmentId === appointment._id}
                                  onClick={() => updateAppointmentState(appointment._id, 'approved')}
                                  className={isNext ? 'shadow-md shadow-blue-500/20' : ''}
                                >
                                  Accept
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  isLoading={activeAppointmentId === appointment._id}
                                  onClick={() => updateAppointmentState(appointment._id, 'rejected')}
                                >
                                  Reject
                                </Button>
                              </>
                            ) : appointment.status === 'approved' ? (
                              <Button size="sm" onClick={() => navigate('consultations')} className={isNext ? 'shadow-md shadow-blue-500/20' : ''}>
                                Start
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" onClick={() => navigate('my-schedule')}>
                                View
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
                  <CalendarIcon className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No appointments today</h3>
                <p className="mb-5 mt-1 text-sm text-slate-500">Your schedule is clear for the day.</p>
                <Button variant="outline" onClick={() => navigate('availability')}>Manage Availability</Button>
              </div>
            )}
          </Card>
        </motion.div>

        <div className="space-y-6">
          <motion.div variants={itemVariants} className="space-y-4">
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Live Overview</h2>
            <Card className="p-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Open Slots Today</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{openTodaySlots.length}</p>
                  </div>
                  <TrendingUpIcon className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Booked Slots Today</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{bookedTodaySlots.length}</p>
                  </div>
                  <CheckCircle2Icon className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Needs Attention</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{appointments.filter((appointment) => appointment.paymentStatus !== 'paid').length}</p>
                  </div>
                  <AlertCircleIcon className="h-5 w-5 text-amber-500" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight text-slate-900">Recent Patients</h2>
            </div>

            <Card className="overflow-hidden border-slate-200 p-0 shadow-sm">
              {recentPatients.length > 0 ? (
                <ul className="divide-y divide-slate-100">
                  {recentPatients.map((appointment) => (
                    <li key={appointment._id} className="group flex cursor-pointer items-center space-x-3 p-4 transition-colors hover:bg-slate-50">
                      <Avatar name={appointment.patient?.fullName || 'Patient'} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-blue-600">
                          {appointment.patient?.fullName || 'Patient'}
                        </p>
                        <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                          {formatTime(appointment.appointmentDate)} � {appointment.patient?.email || 'No email'}
                        </p>
                      </div>
                      <ChevronRightIcon className="h-4 w-4 text-slate-300 transition-colors group-hover:text-blue-500" />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-5 text-sm text-slate-500">No recent patient activity yet.</div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
