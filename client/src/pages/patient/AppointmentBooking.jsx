import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SearchIcon,
  StarIcon,
  CalendarIcon,
  ClockIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon } from
'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { mockDoctors, mockTimeSlots } from '../../data/mockData';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
export const AppointmentBooking = () => {
  const { navigate } = useAppContext();
  const [step, setStep] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  // Step 1 State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const specializations = [
  'All',
  'Cardiology',
  'Dermatology',
  'Orthopedics',
  'General'];

  const filteredDoctors = mockDoctors.filter((doc) => {
    const matchesSearch =
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'All' || doc.specialization === activeTab;
    return matchesSearch && matchesTab;
  });
  // Step 2 State
  const availableSlots = mockTimeSlots.filter(
    (ts) => ts.doctorId === selectedDoctor?.id && ts.date === selectedDate
  );
  const morningSlots = availableSlots.filter((ts) =>
  ts.startTime.includes('AM')
  );
  const afternoonSlots = availableSlots.filter((ts) =>
  ts.startTime.includes('PM')
  );
  const handleNext = () => setStep((s) => Math.min(s + 1, 4));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));
  const handlePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      handleNext(); // Go to confirmation
    }, 1500);
  };
  const renderStepIndicator = () =>
  <div className="mb-8">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 rounded-full -z-10"></div>
        <div
        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-full -z-10 transition-all duration-500"
        style={{
          width: `${(step - 1) / 3 * 100}%`
        }}>
      </div>

        {['Select Doctor', 'Choose Time', 'Payment', 'Confirmation'].map(
        (label, i) => {
          const stepNum = i + 1;
          const isActive = step >= stepNum;
          const isCurrent = step === stepNum;
          return (
            <div key={label} className="flex flex-col items-center">
                <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'} ${isCurrent ? 'ring-4 ring-blue-100' : ''}`}>

                  {isActive && step > stepNum ?
                <CheckCircleIcon className="w-5 h-5" /> :

                stepNum
                }
                </div>
                <span
                className={`text-xs mt-2 font-medium hidden sm:block ${isActive ? 'text-blue-600' : 'text-slate-500'}`}>

                  {label}
                </span>
              </div>);

        }
      )}
      </div>
    </div>;

  return (
    <div className="max-w-4xl mx-auto">
      {renderStepIndicator()}

      <AnimatePresence mode="wait">
        {/* STEP 1: Select Doctor */}
        {step === 1 &&
        <motion.div
          key="step1"
          initial={{
            opacity: 0,
            x: 20
          }}
          animate={{
            opacity: 1,
            x: 0
          }}
          exit={{
            opacity: 0,
            x: -20
          }}
          className="space-y-6">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-900">
                Select a Doctor
              </h2>
              <div className="relative w-full sm:w-64">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                type="text"
                placeholder="Search doctors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />

              </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto pb-2 hide-scrollbar space-x-2">
              {specializations.map((spec) =>
            <button
              key={spec}
              onClick={() => setActiveTab(spec)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === spec ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>

                  {spec}
                </button>
            )}
            </div>

            {/* Doctor Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDoctors.map((doc) =>
            <Card
              key={doc.id}
              className="p-4 flex flex-col sm:flex-row gap-4 hoverable"
              onClick={() => {
                setSelectedDoctor(doc);
                handleNext();
              }}>

                  <Avatar
                name={doc.name}
                src={doc.avatar}
                size="lg"
                className="shrink-0 mx-auto sm:mx-0" />

                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-bold text-slate-900">{doc.name}</h3>
                    <p className="text-sm text-blue-600 font-medium">
                      {doc.specialization}
                    </p>
                    <div className="flex items-center justify-center sm:justify-start mt-1 space-x-3 text-sm text-slate-500">
                      <span className="flex items-center">
                        <StarIcon className="w-4 h-4 text-amber-400 mr-1 fill-current" />{' '}
                        {doc.rating}
                      </span>
                      <span>•</span>
                      <span>${doc.consultationFee} / visit</span>
                    </div>
                    <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full sm:w-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDoctor(doc);
                    handleNext();
                  }}>

                      Select Doctor
                    </Button>
                  </div>
                </Card>
            )}
            </div>
          </motion.div>
        }

        {/* STEP 2: Choose Time */}
        {step === 2 && selectedDoctor &&
        <motion.div
          key="step2"
          initial={{
            opacity: 0,
            x: 20
          }}
          animate={{
            opacity: 1,
            x: 0
          }}
          exit={{
            opacity: 0,
            x: -20
          }}
          className="space-y-6">

            <div className="flex items-center space-x-4 mb-6">
              <button
              onClick={handleBack}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-500">

                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Choose Date & Time
                </h2>
                <p className="text-sm text-slate-500">
                  Booking with {selectedDoctor.name}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Calendar Mock */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-2 text-blue-600" />
                    October 2023
                  </h3>
                  <div className="flex space-x-2">
                    <button className="p-1 rounded hover:bg-slate-100">
                      <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                    <button className="p-1 rounded hover:bg-slate-100">
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500 mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) =>
                <div key={d}>{d}</div>
                )}
                </div>
                <div className="grid grid-cols-7 gap-1 text-sm">
                  {/* Mock calendar days */}
                  {Array.from({
                  length: 31
                }).map((_, i) => {
                  const day = i + 1;
                  const isToday = day === new Date().getDate();
                  const isSelected = selectedDate.endsWith(
                    `-${day.toString().padStart(2, '0')}`
                  );
                  const isAvailable = [15, 16, 18, 20, 22].includes(day); // Mock available days
                  return (
                    <button
                      key={i}
                      disabled={!isAvailable}
                      onClick={() =>
                      setSelectedDate(
                        `2023-10-${day.toString().padStart(2, '0')}`
                      )
                      }
                      className={`aspect-square rounded-full flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 text-white font-bold shadow-md' : isToday ? 'bg-blue-50 text-blue-600 font-bold' : isAvailable ? 'hover:bg-slate-100 text-slate-700' : 'text-slate-300 cursor-not-allowed'}`}>

                        {day}
                      </button>);

                })}
                </div>
              </Card>

              {/* Time Slots */}
              <Card className="p-4 flex flex-col">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
                  <ClockIcon className="w-4 h-4 mr-2 text-blue-600" />
                  Available Slots
                </h3>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Morning
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {morningSlots.map((slot) =>
                    <button
                      key={slot.id}
                      disabled={slot.isBooked}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${slot.isBooked ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed' : selectedSlot?.id === slot.id ? 'bg-blue-50 border-blue-600 text-blue-700 ring-1 ring-blue-600' : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/50'}`}>

                          {slot.startTime}
                        </button>
                    )}
                      {morningSlots.length === 0 &&
                    <p className="text-sm text-slate-500 col-span-2">
                          No morning slots available.
                        </p>
                    }
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Afternoon
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {afternoonSlots.map((slot) =>
                    <button
                      key={slot.id}
                      disabled={slot.isBooked}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${slot.isBooked ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed' : selectedSlot?.id === slot.id ? 'bg-blue-50 border-blue-600 text-blue-700 ring-1 ring-blue-600' : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/50'}`}>

                          {slot.startTime}
                        </button>
                    )}
                      {afternoonSlots.length === 0 &&
                    <p className="text-sm text-slate-500 col-span-2">
                          No afternoon slots available.
                        </p>
                    }
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <Button
                  fullWidth
                  disabled={!selectedSlot}
                  onClick={handleNext}>

                    Continue to Payment
                  </Button>
                </div>
              </Card>
            </div>
          </motion.div>
        }

        {/* STEP 3: Payment */}
        {step === 3 && selectedDoctor && selectedSlot &&
        <motion.div
          key="step3"
          initial={{
            opacity: 0,
            x: 20
          }}
          animate={{
            opacity: 1,
            x: 0
          }}
          exit={{
            opacity: 0,
            x: -20
          }}
          className="space-y-6 max-w-2xl mx-auto">

            <div className="flex items-center space-x-4 mb-6">
              <button
              onClick={handleBack}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-500">

                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-slate-900">
                Payment Details
              </h2>
            </div>

            <Card className="p-6 bg-blue-50/50 border-blue-100">
              <h3 className="font-semibold text-slate-900 mb-4">
                Appointment Summary
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Doctor</span>
                  <span className="font-medium text-slate-900">
                    {selectedDoctor.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Specialization</span>
                  <span className="font-medium text-slate-900">
                    {selectedDoctor.specialization}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Time</span>
                  <span className="font-medium text-slate-900">
                    {selectedDate} at {selectedSlot.startTime}
                  </span>
                </div>
                <div className="pt-3 border-t border-blue-200 flex justify-between items-center">
                  <span className="font-semibold text-slate-900">
                    Total Consultation Fee
                  </span>
                  <span className="text-xl font-bold text-blue-600">
                    ${selectedDoctor.consultationFee}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-6">
                <CreditCardIcon className="w-5 h-5 text-slate-400" />
                <h3 className="font-semibold text-slate-900">
                  Card Information
                </h3>
              </div>
              <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handlePayment();
              }}>

                <Input
                label="Cardholder Name"
                placeholder="John Doe"
                required />

                <Input
                label="Card Number"
                placeholder="0000 0000 0000 0000"
                required />

                <div className="grid grid-cols-2 gap-4">
                  <Input label="Expiry Date" placeholder="MM/YY" required />
                  <Input
                  label="CVV"
                  placeholder="123"
                  type="password"
                  required />

                </div>
                <Button
                type="submit"
                fullWidth
                size="lg"
                className="mt-6"
                isLoading={isProcessing}>

                  Pay ${selectedDoctor.consultationFee} & Confirm
                </Button>
              </form>
            </Card>
          </motion.div>
        }

        {/* STEP 4: Confirmation */}
        {step === 4 &&
        <motion.div
          key="step4"
          initial={{
            opacity: 0,
            scale: 0.95
          }}
          animate={{
            opacity: 1,
            scale: 1
          }}
          className="max-w-md mx-auto text-center py-12">

            <motion.div
            initial={{
              scale: 0
            }}
            animate={{
              scale: 1
            }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.2
            }}
            className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">

              <CheckCircleIcon className="w-12 h-12 text-emerald-500" />
            </motion.div>

            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Booking Confirmed!
            </h2>
            <p className="text-slate-500 mb-8">
              Your appointment with {selectedDoctor?.name} has been successfully
              scheduled for {selectedDate} at {selectedSlot?.startTime}.
            </p>

            <div className="space-y-3">
              <Button fullWidth onClick={() => navigate('my-appointments')}>
                View My Appointments
              </Button>
              <Button
              fullWidth
              variant="outline"
              onClick={() => navigate('patient-dashboard')}>

                Return to Dashboard
              </Button>
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

};
