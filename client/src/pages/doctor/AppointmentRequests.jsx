import React, { useEffect, useMemo, useState } from 'react';
import { CalendarIcon, CheckCircle2Icon, ClockIcon, XCircleIcon } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { fetchMyAppointments, updateAppointment } from '../../services/auth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';

const formatDateTime = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

export const AppointmentRequests = () => {
  const { user, token, navigate } = useAppContext();
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAppointmentId, setActiveAppointmentId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !token) {
      return undefined;
    }

    let isMounted = true;

    const loadAppointments = async () => {
      try {
        if (isMounted) {
          setIsLoading(true);
          setError('');
        }

        const data = await fetchMyAppointments(token);

        if (isMounted) {
          setAppointments(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load appointment requests');
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

  const pendingAppointments = useMemo(
    () => appointments
      .filter((appointment) => appointment.status === 'pending')
      .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate)),
    [appointments]
  );

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
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointment Requests</h1>
          <p className="mt-1 text-sm text-slate-500">Review pending bookings and accept or reject them directly.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="warning" className="px-3 py-1 text-sm">
            {pendingAppointments.length} pending
          </Badge>
          <Button variant="outline" onClick={() => navigate('my-schedule')}>
            Open Full Schedule
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {isLoading ? (
        <Card className="p-12 text-center">
          <CalendarIcon className="mx-auto mb-4 h-8 w-8 text-slate-300" />
          <h2 className="text-lg font-semibold text-slate-900">Loading requests</h2>
          <p className="mt-1 text-sm text-slate-500">Fetching pending doctor approvals.</p>
        </Card>
      ) : pendingAppointments.length > 0 ? (
        <div className="space-y-4">
          {pendingAppointments.map((appointment) => (
            <Card key={appointment._id} className="p-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <Avatar name={appointment.patient?.fullName || 'Patient'} src={appointment.patient?.avatar} size="lg" />
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900">{appointment.patient?.fullName || 'Patient'}</h2>
                      <Badge variant="warning">Pending approval</Badge>
                      {appointment.paymentStatus === 'paid' && <Badge variant="success">Paid</Badge>}
                    </div>
                    <p className="text-sm text-slate-500">{appointment.patient?.email || 'No email provided'}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                      <span className="flex items-center">
                        <CalendarIcon className="mr-1.5 h-4 w-4 text-slate-400" />
                        {formatDateTime(appointment.appointmentDate)}
                      </span>
                      <span className="flex items-center">
                        <ClockIcon className="mr-1.5 h-4 w-4 text-slate-400" />
                        30 minute slot
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    className="min-w-[120px]"
                    isLoading={activeAppointmentId === appointment._id}
                    onClick={() => updateAppointmentState(appointment._id, 'approved')}
                  >
                    <CheckCircle2Icon className="mr-2 h-4 w-4" />
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    className="min-w-[120px]"
                    isLoading={activeAppointmentId === appointment._id}
                    onClick={() => updateAppointmentState(appointment._id, 'rejected')}
                  >
                    <XCircleIcon className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <CheckCircle2Icon className="mx-auto mb-4 h-9 w-9 text-emerald-400" />
          <h2 className="text-lg font-semibold text-slate-900">No pending requests</h2>
          <p className="mt-1 text-sm text-slate-500">All appointment approvals are up to date.</p>
        </Card>
      )}
    </div>
  );
};
