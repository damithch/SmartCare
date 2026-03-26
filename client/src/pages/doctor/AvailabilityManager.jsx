import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  Trash2Icon,
  SunIcon,
  MoonIcon,
  CloudIcon,
  BadgeDollarSignIcon,
  UsersIcon
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import {
  createMyAvailability,
  deleteMyAvailability,
  fetchMyAvailability
} from '../../services/auth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

const getToday = () => new Date().toISOString().split('T')[0];

const toDisplayTime = (time24) => {
  const [hours = '00', minutes = '00'] = String(time24 || '').split(':');
  const hour = Number.parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};

const formatPrice = (value) => `$${Number(value || 0).toFixed(2)}`;

export const AvailabilityManager = () => {
  const { user, token } = useAppContext();
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [slots, setSlots] = useState([]);
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('09:30');
  const [newPrice, setNewPrice] = useState('25');
  const [newMaxPatients, setNewMaxPatients] = useState('1');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !token) {
      return;
    }

    let isMounted = true;

    const loadSlots = async () => {
      setIsLoading(true);
      setError('');

      try {
        const data = await fetchMyAvailability(token, selectedDate);
        if (isMounted) {
          setSlots(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load availability');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSlots();

    return () => {
      isMounted = false;
    };
  }, [selectedDate, token, user]);

  const currentDaySlots = useMemo(() => [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime)), [slots]);

  if (!user) {
    return null;
  }

  const handleAddSlot = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const createdSlot = await createMyAvailability(token, {
        date: selectedDate,
        startTime: newStartTime,
        endTime: newEndTime,
        price: Number(newPrice),
        maxPatients: Number(newMaxPatients)
      });

      setSlots((current) => [...current, createdSlot]);
    } catch (err) {
      setError(err.message || 'Failed to create slot');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSlot = async (id) => {
    setError('');

    try {
      await deleteMyAvailability(token, id);
      setSlots((current) => current.filter((slot) => slot._id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete slot');
    }
  };

  const getSlotIcon = (time) => {
    if (time.includes('AM')) {
      return <SunIcon className="h-4 w-4 text-amber-500" />;
    }

    const hour = Number.parseInt(time.split(':')[0], 10);

    if (time.includes('PM') && (hour === 12 || hour < 5)) {
      return <CloudIcon className="h-4 w-4 text-orange-500" />;
    }

    return <MoonIcon className="h-4 w-4 text-indigo-500" />;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Availability Manager</h1>
        <p className="mt-1 text-slate-500">Set consultation hours, price, and person count per slot so patients see real booking capacity.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card className="p-5">
            <h3 className="mb-4 flex items-center font-semibold text-slate-900">
              <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
              Select Date
            </h3>
            <Input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} min={getToday()} />
          </Card>

          <Card className="border-blue-100 bg-blue-50/70 p-5">
            <h3 className="mb-3 flex items-center font-semibold text-slate-900">
              <UsersIcon className="mr-2 h-4 w-4 text-blue-600" />
              Capacity Notice
            </h3>
            <p className="text-sm leading-6 text-slate-600">
              Each slot can now accept multiple patients. The slot stays open until the person count is fully booked.
            </p>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6">
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Time Slots</h2>
                <p className="text-sm text-slate-500">
                  {new Date(selectedDate).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <Badge variant="info">{currentDaySlots.length} Slots</Badge>
            </div>

            <form onSubmit={handleAddSlot} className="mb-8 grid grid-cols-1 gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-5">
              <div>
                <Input label="Start Time" type="time" value={newStartTime} onChange={(event) => setNewStartTime(event.target.value)} required />
              </div>
              <div>
                <Input label="End Time" type="time" value={newEndTime} onChange={(event) => setNewEndTime(event.target.value)} required />
              </div>
              <div>
                <Input label="Price" type="number" min="0" step="0.01" value={newPrice} onChange={(event) => setNewPrice(event.target.value)} required />
              </div>
              <div>
                <Input label="Person Count" type="number" min="1" step="1" value={newMaxPatients} onChange={(event) => setNewMaxPatients(event.target.value)} required />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full" isLoading={isSaving}>
                  <PlusIcon className="mr-2 h-4 w-4" /> Add Slot
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              {isLoading ? (
                <div className="py-8 text-center text-slate-500">
                  <ClockIcon className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                  <p>Loading availability...</p>
                </div>
              ) : currentDaySlots.length > 0 ? (
                currentDaySlots.map((slot) => {
                  const startTime = toDisplayTime(slot.startTime);
                  const endTime = toDisplayTime(slot.endTime);

                  return (
                    <motion.div
                      key={slot._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${slot.isBooked ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-white hover:border-blue-300'}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`rounded-lg p-2 ${slot.isBooked ? 'bg-slate-200' : 'bg-blue-50'}`}>
                          {getSlotIcon(startTime)}
                        </div>
                        <div>
                          <p className={`font-semibold ${slot.isBooked ? 'text-slate-500' : 'text-slate-900'}`}>{startTime} - {endTime}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center text-xs font-medium text-emerald-600">
                              <BadgeDollarSignIcon className="mr-1 h-3 w-3" /> {formatPrice(slot.price)}
                            </span>
                            <span className="inline-flex items-center text-xs font-medium text-blue-600">
                              <UsersIcon className="mr-1 h-3 w-3" /> {slot.bookedCount || 0}/{slot.maxPatients || 1} booked
                            </span>
                            {slot.isBooked ? (
                              <span className="inline-flex items-center text-xs font-medium text-amber-600">
                                <ClockIcon className="mr-1 h-3 w-3" /> Full
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-emerald-600">{slot.availableSpots || ((slot.maxPatients || 1) - (slot.bookedCount || 0))} spots left</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button type="button" onClick={() => handleDeleteSlot(slot._id)} disabled={slot.bookedCount > 0 || slot.isBooked} className={`rounded-lg p-2 transition-colors ${slot.bookedCount > 0 || slot.isBooked ? 'cursor-not-allowed text-slate-300' : 'text-slate-400 hover:bg-red-50 hover:text-red-600'}`} title={slot.bookedCount > 0 || slot.isBooked ? 'Cannot delete booked slot' : 'Delete slot'}>
                        <Trash2Icon className="h-5 w-5" />
                      </button>
                    </motion.div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-slate-500">
                  <ClockIcon className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                  <p>No slots configured for this date.</p>
                  <p className="mt-1 text-sm">Add slots using the form above.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
