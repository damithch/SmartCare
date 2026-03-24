import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  CreditCardIcon,
  ShieldCheckIcon
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { fetchMyAppointments } from '../../services/auth';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';

const formatPrice = (value) => `$${Number(value || 0).toFixed(2)}`;

const getStatusColor = (status) => {
  switch (status) {
    case 'approved':
      return 'success';
    case 'pending':
      return 'warning';
    case 'rejected':
      return 'danger';
    case 'completed':
      return 'info';
    case 'cancelled':
      return 'danger';
    default:
      return 'default';
  }
};

const getPaymentColor = (status) => {
  switch (status) {
    case 'paid':
      return 'success';
    case 'failed':
      return 'danger';
    case 'refunded':
      return 'warning';
    default:
      return 'default';
  }
};

const getStatusLabel = (status) => {
  if (status === 'approved') {
    return 'accepted';
  }

  return status;
};

export const MyAppointments = () => {
  const { user, token, navigate } = useAppContext();
  const [activeTab, setActiveTab] = useState('All');
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !token) {
      return;
    }

    let isMounted = true;

    const loadAppointments = async () => {
      setIsLoading(true);
      setError('');

      try {
        const data = await fetchMyAppointments(token);
        if (isMounted) {
          setAppointments(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load appointments');
          setAppointments([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAppointments();

    return () => {
      isMounted = false;
    };
  }, [token, user]);

  const filteredAppointments = useMemo(() => {
    const now = new Date();

    return appointments.filter((appointment) => {
      if (activeTab === 'All') {
        return true;
      }

      if (activeTab === 'Upcoming') {
        return ['pending', 'approved'].includes(appointment.status) && new Date(appointment.appointmentDate) >= now;
      }

      return appointment.status === activeTab.toLowerCase();
    });
  }, [activeTab, appointments]);

  if (!user) {
    return null;
  }

  const tabs = ['All', 'Upcoming', 'Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled'];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
          <p className="mt-1 text-sm text-slate-500">Live appointment records including Stripe payment status.</p>
        </div>

        <div className="flex self-start rounded-lg bg-slate-100 p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <Card className="p-12 text-center border-dashed">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <CalendarIcon className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">Loading appointments</h3>
            <p className="mt-1 text-slate-500">Fetching your current bookings from the backend.</p>
          </Card>
        ) : filteredAppointments.length > 0 ? (
          filteredAppointments.map((appointment, index) => {
            const doctorName = appointment.doctor?.fullName || 'Doctor';
            const doctorSpecialization = appointment.doctor?.specialization || 'General Practice';
            const appointmentDate = new Date(appointment.appointmentDate);

            return (
              <motion.div
                key={appointment._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="flex flex-col items-start gap-6 p-5 md:flex-row md:items-center">
                  <div className="flex w-full shrink-0 items-center rounded-xl bg-slate-50 p-4 md:w-auto md:min-w-[140px] md:flex-col md:justify-center">
                    <CalendarIcon className="mb-1 hidden h-5 w-5 text-blue-600 md:block" />
                    <div className="flex-1 text-center md:flex-none md:text-left">
                      <p className="text-sm font-semibold uppercase text-slate-500">
                        {appointmentDate.toLocaleString('default', { month: 'short' })}
                      </p>
                      <p className="text-2xl font-bold text-slate-900">{appointmentDate.getDate()}</p>
                    </div>
                    <div className="text-right md:text-center">
                      <Badge variant={getStatusColor(appointment.status)} className="mb-1 capitalize md:hidden">
                        {getStatusLabel(appointment.status)}
                      </Badge>
                      <p className="flex items-center justify-end text-sm font-medium text-slate-600 md:justify-center">
                        <ClockIcon className="mr-1 h-3 w-3" />
                        {appointmentDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex w-full flex-1 items-start space-x-4">
                    <Avatar name={doctorName} src={appointment.doctor?.avatar} size="lg" />
                    <div className="flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{doctorName}</h3>
                          <p className="text-sm font-medium text-blue-600">{doctorSpecialization}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={getStatusColor(appointment.status)} className="hidden capitalize md:inline-flex">
                            {getStatusLabel(appointment.status)}
                          </Badge>
                          <Badge variant={getPaymentColor(appointment.paymentStatus)} className="capitalize">
                            {appointment.paymentStatus || 'pending'}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                        <span className="flex items-center">
                          <MapPinIcon className="mr-1 h-4 w-4 text-slate-400" />
                          SmartCare Main Hospital, Room 302
                        </span>
                        <span className="flex items-center">
                          <CreditCardIcon className="mr-1 h-4 w-4 text-slate-400" />
                          Paid: {formatPrice(appointment.amountPaid)}
                        </span>
                        <span className="flex items-center">
                          <ShieldCheckIcon className="mr-1 h-4 w-4 text-slate-400" />
                          {String(appointment.paymentCurrency || 'usd').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })
        ) : (
          <Card className="border-dashed p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <CalendarIcon className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No appointments found</h3>
            <p className="mb-6 mt-1 text-slate-500">
              You don't have any {activeTab !== 'All' ? activeTab.toLowerCase() : ''} appointments yet.
            </p>
            <Button onClick={() => navigate('book-appointment')}>Book Appointment</Button>
          </Card>
        )}
      </div>
    </div>
  );
};
