import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarIcon,
  ClockIcon,
  FileTextIcon,
  ActivityIcon,
  ChevronRightIcon,
  LightbulbIcon
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { fetchMyAppointments, fetchMyMedicalRecords } from '../../services/auth';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const Sparkline = ({ data, color, className = '' }) => {
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
    <svg
      viewBox={`0 -5 ${width} ${height + 10}`}
      className={`h-8 w-16 overflow-visible ${className}`}
      preserveAspectRatio="none"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

const buildRecentTrend = (items, getDate) => {
  const today = new Date();
  const counts = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const dayStart = new Date(today);
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(today.getDate() - offset);

    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    counts.push(
      items.filter((item) => {
        const date = new Date(getDate(item));
        return !Number.isNaN(date.getTime()) && date >= dayStart && date < dayEnd;
      }).length
    );
  }

  return counts;
};

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

export const PatientDashboard = () => {
  const { user, token, navigate } = useAppContext();
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !token) {
      return undefined;
    }

    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        if (isMounted) {
          setIsLoading(true);
          setError('');
        }

        const [appointmentData, recordData] = await Promise.all([
          fetchMyAppointments(token),
          fetchMyMedicalRecords(token)
        ]);

        if (!isMounted) {
          return;
        }

        setAppointments(Array.isArray(appointmentData) ? appointmentData : []);
        setMedicalRecords(Array.isArray(recordData) ? recordData : []);
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load patient dashboard');
          setAppointments([]);
          setMedicalRecords([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [token, user]);

  const displayName = user?.fullName || user?.name || 'User';
  const firstName = displayName.split(' ')[0] || 'User';
  const now = new Date();

  const upcomingAppointments = useMemo(
    () => appointments
      .filter((appointment) => ['pending', 'approved'].includes(appointment.status) && new Date(appointment.appointmentDate) >= now)
      .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate)),
    [appointments]
  );

  const completedAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === 'completed'),
    [appointments]
  );

  const recentPrescriptions = useMemo(
    () => medicalRecords
      .flatMap((record) =>
        (record.prescriptions || []).map((prescription, index) => ({
          id: `${record._id}-${index}`,
          doctorName: record.doctor?.fullName || 'Doctor',
          prescribedAt: prescription.prescribedAt || record.createdAt,
          medicineName: prescription.medicineName,
          dosage: prescription.dosage,
          frequency: prescription.frequency,
          duration: prescription.duration
        }))
      )
      .sort((a, b) => new Date(b.prescribedAt) - new Date(a.prescribedAt))
      .slice(0, 3),
    [medicalRecords]
  );

  const activePrescriptionCount = useMemo(
    () => medicalRecords.reduce((sum, record) => sum + (record.prescriptions?.length || 0), 0),
    [medicalRecords]
  );

  const totalSpent = useMemo(
    () => appointments
      .filter((appointment) => appointment.paymentStatus === 'paid')
      .reduce((sum, appointment) => sum + Number(appointment.amountPaid || appointment.availabilitySlot?.price || 0), 0),
    [appointments]
  );

  const appointmentTrend = useMemo(() => buildRecentTrend(appointments, (item) => item.appointmentDate), [appointments]);
  const visitTrend = useMemo(() => buildRecentTrend(completedAppointments, (item) => item.appointmentDate), [completedAppointments]);
  const prescriptionTrend = useMemo(() => buildRecentTrend(medicalRecords, (item) => item.createdAt), [medicalRecords]);
  const spendTrend = useMemo(
    () => appointmentTrend.map((_, index) => {
      const relevant = appointments.filter((appointment) => {
        const date = new Date(appointment.appointmentDate);
        const threshold = new Date();
        threshold.setHours(0, 0, 0, 0);
        threshold.setDate(threshold.getDate() - (6 - index));
        return !Number.isNaN(date.getTime()) && date >= threshold && appointment.paymentStatus === 'paid';
      });

      return relevant.reduce((sum, appointment) => sum + Number(appointment.amountPaid || appointment.availabilitySlot?.price || 0), 0);
    }),
    [appointmentTrend, appointments]
  );

  const stats = [
    {
      label: 'Upcoming Appointments',
      value: upcomingAppointments.length,
      icon: CalendarIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      sparklineData: appointmentTrend,
      sparklineColor: '#2563EB'
    },
    {
      label: 'Completed Visits',
      value: completedAppointments.length,
      icon: ActivityIcon,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      sparklineData: visitTrend,
      sparklineColor: '#059669'
    },
    {
      label: 'Recorded Prescriptions',
      value: activePrescriptionCount,
      icon: FileTextIcon,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
      sparklineData: prescriptionTrend,
      sparklineColor: '#D97706'
    },
    {
      label: 'Total Spent',
      value: formatCurrency(totalSpent),
      icon: ClockIcon,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      sparklineData: spendTrend,
      sparklineColor: '#9333EA'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Good morning, {firstName}</h1>
          <p className="mt-1 font-medium text-slate-500">{currentDate} | Here's your health overview.</p>
        </div>
        <div className="flex-shrink-0">
          <Button onClick={() => navigate('book-appointment')} className="shadow-md shadow-blue-500/20">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Book Appointment
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-start space-x-4 rounded-xl border border-teal-100 bg-gradient-to-r from-teal-50 to-blue-50 p-4 shadow-sm sm:items-center">
          <div className="shrink-0 rounded-full bg-white p-2 shadow-sm">
            <LightbulbIcon className="h-5 w-5 text-teal-500" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Daily Health Tip</h4>
            <p className="mt-0.5 text-sm text-slate-600">
              Stay hydrated. Drinking enough water helps maintain energy levels and supports joint health.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card className="group relative overflow-hidden p-5 transition-colors hover:border-blue-200">
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white to-slate-50 opacity-0 transition-opacity group-hover:opacity-100"></div>
              <div className="mb-4 flex items-start justify-between">
                <div className={`rounded-xl p-2.5 ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
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
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Upcoming Appointments</h2>
            <button
              onClick={() => navigate('my-appointments')}
              className="flex items-center text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
            >
              View All <ChevronRightIcon className="ml-1 h-4 w-4" />
            </button>
          </div>

          {isLoading ? (
            <Card className="border-dashed bg-slate-50/50 p-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                <CalendarIcon className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Loading appointments</h3>
              <p className="mt-1 text-sm text-slate-500">Fetching your latest schedule.</p>
            </Card>
          ) : upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppointments.slice(0, 4).map((appointment) => {
                const appointmentDate = new Date(appointment.appointmentDate);

                return (
                  <Card
                    key={appointment._id}
                    className="group cursor-pointer p-4 transition-all hover:border-blue-200 hover:shadow-md"
                    onClick={() => navigate('my-appointments')}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="min-w-[4.5rem] rounded-xl border border-slate-100 bg-slate-50 p-3 text-center text-slate-700 transition-colors group-hover:border-blue-100 group-hover:bg-blue-50 group-hover:text-blue-700">
                          <p className="text-[10px] font-bold uppercase tracking-wider">
                            {appointmentDate.toLocaleString('default', { month: 'short' })}
                          </p>
                          <p className="mt-1 text-2xl font-black leading-none">{appointmentDate.getDate()}</p>
                        </div>
                        <div className="pt-1">
                          <h3 className="text-base font-bold text-slate-900">{appointment.doctor?.fullName || 'Doctor'}</h3>
                          <p className="text-sm font-medium text-blue-600">
                            {appointment.doctor?.specialization || 'General Practice'}
                          </p>
                          <div className="mt-2 flex items-center text-sm font-medium text-slate-500">
                            <ClockIcon className="mr-1.5 h-4 w-4 text-slate-400" />
                            {appointmentDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <Badge variant={appointment.status === 'approved' ? 'success' : 'warning'} className="capitalize font-semibold shadow-sm">
                          {appointment.status}
                        </Badge>
                        <div className="mt-6 opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="flex items-center text-xs font-bold text-blue-600">
                            Details <ChevronRightIcon className="ml-0.5 h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-dashed border-2 bg-slate-50/50 p-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                <CalendarIcon className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No upcoming appointments</h3>
              <p className="mx-auto mb-5 mt-1 max-w-xs text-sm text-slate-500">
                You do not have any scheduled visits yet. Book an appointment to see a doctor.
              </p>
              <Button variant="outline" size="sm" onClick={() => navigate('book-appointment')} className="font-semibold">
                Book Now
              </Button>
            </Card>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Recent Prescriptions</h2>
            <button
              onClick={() => navigate('medical-history')}
              className="flex items-center text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
            >
              History <ChevronRightIcon className="ml-1 h-4 w-4" />
            </button>
          </div>

          <Card className="overflow-hidden border-slate-200 p-0 shadow-sm">
            <ul className="divide-y divide-slate-100">
              {recentPrescriptions.map((prescription) => (
                <li
                  key={prescription.id}
                  className="group cursor-pointer p-4 transition-colors hover:bg-slate-50"
                  onClick={() => navigate('medical-history')}
                >
                  <div className="mb-1.5 flex items-start justify-between">
                    <p className="truncate pr-2 font-bold text-slate-900 transition-colors group-hover:text-blue-600">
                      {prescription.medicineName}
                    </p>
                    <Badge variant="info" className="shrink-0 text-[10px] font-bold uppercase">
                      Rx
                    </Badge>
                  </div>
                  <p className="text-xs font-medium text-slate-500">Prescribed by {prescription.doctorName}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {new Date(prescription.prescribedAt).toLocaleDateString()}
                    </p>
                    <ChevronRightIcon className="h-3 w-3 text-slate-300 transition-colors group-hover:text-blue-500" />
                  </div>
                </li>
              ))}
              {!isLoading && recentPrescriptions.length === 0 && (
                <li className="flex flex-col items-center justify-center p-8 text-center">
                  <FileTextIcon className="mb-2 h-8 w-8 text-slate-300" />
                  <p className="text-sm font-medium text-slate-500">No prescriptions recorded yet.</p>
                </li>
              )}
            </ul>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
