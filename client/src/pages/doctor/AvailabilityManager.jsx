import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  Trash2Icon,
  SunIcon,
  MoonIcon,
  CloudIcon } from
'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { mockTimeSlots } from '../../data/mockData';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

export const AvailabilityManager = () => {
  const { user } = useAppContext();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [slots, setSlots] = useState(
    mockTimeSlots.filter((ts) => ts.doctorId === user?.id)
  );
  // New slot form state
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('09:30');
  if (!user) return null;
  const currentDaySlots = slots.filter((ts) => ts.date === selectedDate);
  const handleAddSlot = (e) => {
    e.preventDefault();
    const newSlot = {
      id: `ts-${Date.now()}`,
      doctorId: user.id,
      date: selectedDate,
      startTime: formatTime(newStartTime),
      endTime: formatTime(newEndTime),
      isBooked: false
    };
    setSlots([...slots, newSlot]);
  };
  const handleDeleteSlot = (id) => {
    setSlots(slots.filter((s) => s.id !== id));
  };
  const formatTime = (time24) => {
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };
  const getSlotIcon = (time) => {
    if (time.includes('AM'))
    return <SunIcon className="w-4 h-4 text-amber-500" />;
    const hour = parseInt(time.split(':')[0]);
    if (time.includes('PM') && (hour === 12 || hour < 5))
    return <CloudIcon className="w-4 h-4 text-orange-500" />;
    return <MoonIcon className="w-4 h-4 text-indigo-500" />;
  };
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Availability Manager
        </h1>
        <p className="text-slate-500 mt-1">
          Set your consultation hours for patients to book.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Column */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2 text-blue-600" />
                October 2023
              </h3>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) =>
              <div key={d}>{d}</div>
              )}
            </div>
            <div className="grid grid-cols-7 gap-1 text-sm">
              {Array.from({
                length: 31
              }).map((_, i) => {
                const day = i + 1;
                const dateStr = `2023-10-${day.toString().padStart(2, '0')}`;
                const isSelected = selectedDate === dateStr;
                const hasSlots = slots.some((s) => s.date === dateStr);
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`aspect-square rounded-full flex flex-col items-center justify-center relative transition-colors ${isSelected ? 'bg-blue-600 text-white font-bold shadow-md' : 'hover:bg-slate-100 text-slate-700'}`}>

                    <span>{day}</span>
                    {hasSlots && !isSelected &&
                    <span className="absolute bottom-1 w-1 h-1 bg-blue-500 rounded-full"></span>
                    }
                  </button>);

              })}
            </div>
          </Card>
        </div>

        {/* Slots Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Time Slots
                </h2>
                <p className="text-sm text-slate-500">
                  {new Date(selectedDate).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <Badge variant="info">{currentDaySlots.length} Slots</Badge>
            </div>

            {/* Add Slot Form */}
            <form
              onSubmit={handleAddSlot}
              className="flex items-end gap-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">

              <div className="flex-1">
                <Input
                  label="Start Time"
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  required />

              </div>
              <div className="flex-1">
                <Input
                  label="End Time"
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  required />

              </div>
              <Button type="submit" className="shrink-0">
                <PlusIcon className="w-4 h-4 mr-2" /> Add Slot
              </Button>
            </form>

            {/* Existing Slots List */}
            <div className="space-y-3">
              {currentDaySlots.length > 0 ?
              currentDaySlots.
              sort((a, b) => a.startTime.localeCompare(b.startTime)).
              map((slot) =>
              <motion.div
                key={slot.id}
                initial={{
                  opacity: 0,
                  y: 10
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                exit={{
                  opacity: 0,
                  scale: 0.95
                }}
                className={`flex items-center justify-between p-4 rounded-xl border ${slot.isBooked ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 hover:border-blue-300'}`}>

                      <div className="flex items-center space-x-4">
                        <div
                    className={`p-2 rounded-lg ${slot.isBooked ? 'bg-slate-200' : 'bg-blue-50'}`}>

                          {getSlotIcon(slot.startTime)}
                        </div>
                        <div>
                          <p
                      className={`font-semibold ${slot.isBooked ? 'text-slate-500' : 'text-slate-900'}`}>

                            {slot.startTime} - {slot.endTime}
                          </p>
                          {slot.isBooked ?
                    <span className="text-xs font-medium text-amber-600 flex items-center mt-1">
                              <ClockIcon className="w-3 h-3 mr-1" /> Booked
                            </span> :

                    <span className="text-xs font-medium text-emerald-600 flex items-center mt-1">
                              Available
                            </span>
                    }
                        </div>
                      </div>

                      <button
                  onClick={() => handleDeleteSlot(slot.id)}
                  disabled={slot.isBooked}
                  className={`p-2 rounded-lg transition-colors ${slot.isBooked ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                  title={
                  slot.isBooked ?
                  'Cannot delete booked slot' :
                  'Delete slot'
                  }>

                        <Trash2Icon className="w-5 h-5" />
                      </button>
                    </motion.div>
              ) :

              <div className="text-center py-8 text-slate-500">
                  <ClockIcon className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                  <p>No slots configured for this date.</p>
                  <p className="text-sm mt-1">
                    Add slots using the form above.
                  </p>
                </div>
              }
            </div>
          </Card>
        </div>
      </div>
    </div>);

};
