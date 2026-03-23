import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, ClockIcon } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useAppContext } from '../../context/AppContext';
import { fetchMyAppointments } from '../../services/auth';

const startOfWeek = (date) => {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const endOfWeek = (date) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + 6);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

const formatHour = (hour) => {
  if (hour === 12) return '12 PM';
  if (hour > 12) return `${hour - 12} PM`;
  return `${hour} AM`;
};

const formatTimeRange = (date) => {
  const start = new Date(date);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  return `${start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
};

export const MySchedule = () => {
  const { user, token } = useAppContext();
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
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
          setAppointments(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
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

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      return date;
    });
  }, [weekStart]);

  const weekEnd = useMemo(() => endOfWeek(weekStart), [weekStart]);

  const weeklyAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.appointmentDate);
      return appointmentDate >= weekStart && appointmentDate <= weekEnd;
    });
  }, [appointments, weekEnd, weekStart]);

  const appointmentsByDayAndHour = useMemo(() => {
    const map = new Map();

    weeklyAppointments.forEach((appointment) => {
      const date = new Date(appointment.appointmentDate);
      const key = `${date.toDateString()}-${date.getHours()}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(appointment);
    });

    return map;
  }, [weeklyAppointments]);

  const hours = Array.from({ length: 11 }, (_, index) => index + 8);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Schedule</h1>
          <p className="text-slate-500 mt-1">
            Weekly overview of your real appointments.
          </p>
        </div>
        <div className="flex items-center space-x-4 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
          <button
            type="button"
            className="p-1 hover:bg-slate-100 rounded"
            onClick={() => setWeekStart((current) => {
              const next = new Date(current);
              next.setDate(current.getDate() - 7);
              return next;
            })}>
            <ChevronLeftIcon className="w-5 h-5 text-slate-600" />
          </button>
          <span className="font-semibold text-slate-900 min-w-[180px] text-center">
            {weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            {' - '}
            {weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
          <button
            type="button"
            className="p-1 hover:bg-slate-100 rounded"
            onClick={() => setWeekStart((current) => {
              const next = new Date(current);
              next.setDate(current.getDate() + 7);
              return next;
            })}>
            <ChevronRightIcon className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50">
              <div className="p-4 border-r border-slate-200 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-slate-400" />
              </div>
              {weekDays.map((date) => (
                <div
                  key={date.toISOString()}
                  className="p-4 text-center border-r border-slate-200 last:border-r-0">
                  <p className="text-sm font-bold text-slate-900">
                    {date.toLocaleDateString(undefined, { weekday: 'short' })}
                  </p>
                  <p className="text-xs text-slate-500">
                    {date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              ))}
            </div>

            <div className="relative bg-white">
              {isLoading ? (
                <div className="py-16 text-center text-slate-500">
                  <ClockIcon className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                  Loading schedule...
                </div>
              ) : (
                hours.map((hour) => (
                  <div
                    key={hour}
                    className="grid grid-cols-8 border-b border-slate-100 min-h-24">
                    <div className="p-2 border-r border-slate-200 text-xs font-medium text-slate-500 text-right pr-4 relative">
                      <span className="absolute -top-2 right-4 bg-white px-1">
                        {formatHour(hour)}
                      </span>
                    </div>
                    {weekDays.map((date) => {
                      const key = `${date.toDateString()}-${hour}`;
                      const slotAppointments = appointmentsByDayAndHour.get(key) || [];

                      return (
                        <div
                          key={key}
                          className="border-r border-slate-100 last:border-r-0 relative p-1 space-y-1">
                          {slotAppointments.map((appointment) => (
                            <div
                              key={appointment._id}
                              className={`rounded-xl border-l-4 p-2 shadow-sm ${appointment.status === 'completed' ? 'bg-emerald-50 border-emerald-500' : appointment.status === 'cancelled' ? 'bg-rose-50 border-rose-500' : 'bg-blue-50 border-blue-600'}`}>
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {appointment.patient?.fullName || 'Patient'}
                              </p>
                              <p className="text-[11px] text-slate-600 truncate">
                                {formatTimeRange(appointment.appointmentDate)}
                              </p>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mt-1">
                                {appointment.status}
                              </p>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
