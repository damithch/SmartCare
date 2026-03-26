import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import {
  SearchIcon,
  StarIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  StethoscopeIcon,
  UserRoundIcon,
  BadgeDollarSignIcon,
  CreditCardIcon,
  ShieldCheckIcon
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import {
  createAppointmentCheckout,
  confirmAppointmentPayment,
  fetchDoctorAvailability,
  fetchDoctors
} from '../../services/auth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

const getToday = () => new Date().toISOString().split('T')[0];
const safeLoadStripe = (publishableKey) => {
  if (!publishableKey) {
    return Promise.resolve(null);
  }

  return loadStripe(publishableKey).catch(() => null);
};

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#0f172a',
      '::placeholder': {
        color: '#94a3b8'
      }
    },
    invalid: {
      color: '#dc2626'
    }
  }
};

const formatDisplayTime = (time24) => {
  const [hours = '00', minutes = '00'] = String(time24 || '').split(':');
  const hour = Number.parseInt(hours, 10);

  if (Number.isNaN(hour)) {
    return time24;
  }

  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};

const formatAppointmentDate = (appointmentDate) => {
  const date = new Date(appointmentDate);

  if (Number.isNaN(date.getTime())) {
    return appointmentDate;
  }

  return date.toLocaleString([], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const formatPrice = (value) => `$${Number(value || 0).toFixed(2)}`;
const getDoctorName = (doctor) => doctor?.fullName || doctor?.name || 'Doctor';
const getDoctorSpecialization = (doctor) => doctor?.specialization || 'General Practice';
const getDoctorFee = (doctor) => Number(doctor?.consultationFee || 0);
const getSlotPrice = (slot, doctor) => Number(slot?.price ?? getDoctorFee(doctor));
const getSlotAvailableSpots = (slot) => Number(slot?.availableSpots ?? Math.max((slot?.maxPatients || 1) - (slot?.bookedCount || 0), 0));

const AppointmentPaymentForm = ({
  checkout,
  selectedDoctor,
  selectedSlot,
  user,
  token,
  onBack,
  onSuccess
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      return;
    }

    setIsSubmitting(true);
    setPaymentError('');

    try {
      const result = await stripe.confirmCardPayment(checkout.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: user.fullName || user.name,
            email: user.email
          }
        }
      });

      if (result.error) {
        throw new Error(result.error.message || 'Payment failed');
      }

      if (!result.paymentIntent || result.paymentIntent.status !== 'succeeded') {
        throw new Error('Stripe payment was not completed');
      }

      const appointment = await confirmAppointmentPayment(token, {
        patientId: user.id,
        doctorId: selectedDoctor._id,
        availabilityId: selectedSlot._id,
        paymentIntentId: result.paymentIntent.id
      });

      onSuccess(appointment);
    } catch (error) {
      setPaymentError(error.message || 'Payment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_1.35fr]">
      <Card className="p-6">
        <div className="mb-5 flex items-center gap-3">
          <Avatar name={getDoctorName(selectedDoctor)} src={selectedDoctor.avatar} size="lg" />
          <div>
            <h3 className="font-semibold text-slate-900">{getDoctorName(selectedDoctor)}</h3>
            <p className="text-sm text-blue-600">{getDoctorSpecialization(selectedDoctor)}</p>
          </div>
        </div>

        <Card className="border-blue-100 bg-blue-50/70 p-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Appointment Date</span>
              <span className="font-medium text-slate-900">{selectedSlot.date}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Appointment Time</span>
              <span className="font-medium text-slate-900">
                {formatDisplayTime(selectedSlot.startTime)} - {formatDisplayTime(selectedSlot.endTime)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Patient</span>
              <span className="font-medium text-slate-900">{user.fullName || user.name}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Charge</span>
              <span className="font-medium text-slate-900">{formatPrice(getSlotPrice(selectedSlot, selectedDoctor))}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Capacity</span>
              <span className="font-medium text-slate-900">
                {selectedSlot.bookedCount || 0}/{selectedSlot.maxPatients || 1} booked
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Spots Left</span>
              <span className="font-medium text-emerald-600">{getSlotAvailableSpots(selectedSlot)}</span>
            </div>
          </div>
        </Card>

        <div className="mt-5 rounded-2xl bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheckIcon className="mt-0.5 h-5 w-5 text-emerald-600" />
            <div>
              <p className="font-medium text-slate-900">Secure Stripe payment</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Use a Stripe test card like <span className="font-medium">4242 4242 4242 4242</span>, any future date, any CVC, and any ZIP.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <CreditCardIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Pay and Confirm</h3>
            <p className="text-sm text-slate-500">Your appointment is created only after Stripe confirms the payment.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <CardElement options={cardElementOptions} />
          </div>

          {paymentError && <p className="text-sm text-red-600">{paymentError}</p>}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" variant="outline" className="sm:flex-1" onClick={onBack}>
              Back
            </Button>
            <Button type="submit" className="sm:flex-1" isLoading={isSubmitting} disabled={!stripe}>
              Pay {formatPrice(checkout.amount)}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export const AppointmentBooking = () => {
  const { user, token, navigate } = useAppContext();
  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);
  const [error, setError] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [slots, setSlots] = useState([]);
  const [checkout, setCheckout] = useState(null);
  const [stripeLoadError, setStripeLoadError] = useState('');

  useEffect(() => {
    if (!user || !token) {
      return;
    }

    let isMounted = true;

    const loadDoctors = async () => {
      setIsLoadingDoctors(true);
      setError('');

      try {
        const data = await fetchDoctors(token, searchQuery.trim());
        if (!isMounted) {
          return;
        }

        setDoctors(Array.isArray(data) ? data : []);
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load doctors');
          setDoctors([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingDoctors(false);
        }
      }
    };

    const timeoutId = setTimeout(loadDoctors, 250);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [searchQuery, token, user]);

  useEffect(() => {
    if (!selectedDoctor || !token) {
      setSlots([]);
      setSelectedSlot(null);
      return;
    }

    let isMounted = true;

    const loadSlots = async () => {
      setIsLoadingSlots(true);
      setBookingError('');
      setCheckout(null);

      try {
        const data = await fetchDoctorAvailability(token, selectedDoctor._id, selectedDate);
        if (!isMounted) {
          return;
        }

        setSlots(Array.isArray(data) ? data : []);
        setSelectedSlot(null);
      } catch (err) {
        if (isMounted) {
          setSlots([]);
          setSelectedSlot(null);
          setBookingError(err.message || 'Failed to load availability');
        }
      } finally {
        if (isMounted) {
          setIsLoadingSlots(false);
        }
      }
    };

    loadSlots();

    return () => {
      isMounted = false;
    };
  }, [selectedDate, selectedDoctor, token]);

  const stripePromise = useMemo(
    () => (checkout?.publishableKey ? safeLoadStripe(checkout.publishableKey) : null),
    [checkout?.publishableKey]
  );

  useEffect(() => {
    let isMounted = true;

    if (!stripePromise) {
      setStripeLoadError('');
      return undefined;
    }

    stripePromise.then((stripeInstance) => {
      if (!isMounted) {
        return;
      }

      setStripeLoadError(stripeInstance ? '' : 'Stripe payment form could not be loaded. Check your internet connection or Stripe key and try again.');
    });

    return () => {
      isMounted = false;
    };
  }, [stripePromise]);

  const specializations = useMemo(
    () => ['All', ...new Set(doctors.map((doctor) => getDoctorSpecialization(doctor)))],
    [doctors]
  );

  const filteredDoctors = useMemo(
    () => doctors.filter((doctor) => activeTab === 'All' || getDoctorSpecialization(doctor) === activeTab),
    [activeTab, doctors]
  );

  const morningSlots = useMemo(
    () => slots.filter((slot) => Number.parseInt(String(slot.startTime).split(':')[0], 10) < 12),
    [slots]
  );

  const afternoonSlots = useMemo(
    () => slots.filter((slot) => Number.parseInt(String(slot.startTime).split(':')[0], 10) >= 12),
    [slots]
  );

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setSelectedSlot(null);
    setCheckout(null);
    setBookingError('');
    setStep(2);
  };

  const handlePreparePayment = async () => {
    if (!selectedDoctor || !selectedSlot || !user?.id || !token) {
      return;
    }

    setIsPreparingPayment(true);
    setBookingError('');

    try {
      const nextCheckout = await createAppointmentCheckout(token, {
        patientId: user.id,
        doctorId: selectedDoctor._id,
        availabilityId: selectedSlot._id
      });

      setCheckout(nextCheckout);
      setStep(3);
    } catch (err) {
      setBookingError(err.message || 'Failed to initialize payment');
    } finally {
      setIsPreparingPayment(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 top-1/2 -z-10 h-1 w-full -translate-y-1/2 rounded-full bg-slate-200"></div>
        <div
          className="absolute left-0 top-1/2 -z-10 h-1 -translate-y-1/2 rounded-full bg-blue-600 transition-all duration-500"
          style={{ width: `${((step - 1) / 3) * 100}%` }}
        ></div>

        {['Select Doctor', 'Choose Time', 'Payment', 'Confirmation'].map((label, index) => {
          const stepNumber = index + 1;
          const isActive = step >= stepNumber;
          const isCurrent = step === stepNumber;

          return (
            <div key={label} className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                } ${isCurrent ? 'ring-4 ring-blue-100' : ''}`}
              >
                {isActive && step > stepNumber ? <CheckCircleIcon className="h-5 w-5" /> : stepNumber}
              </div>
              <span
                className={`mt-2 hidden text-xs font-medium sm:block ${
                  isActive ? 'text-blue-600' : 'text-slate-500'
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl">
      {renderStepIndicator()}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Book With a Real Doctor</h2>
                <p className="mt-1 text-sm text-slate-500">Browse live doctor accounts and continue to Stripe payment for confirmation.</p>
              </div>

              <div className="relative w-full sm:w-80">
                <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search doctor name or specialization"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 py-3.5 pl-11 pr-4 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="flex space-x-2 overflow-x-auto pb-2 hide-scrollbar">
              {specializations.map((specialization) => (
                <button
                  key={specialization}
                  onClick={() => setActiveTab(specialization)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === specialization
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {specialization}
                </button>
              ))}
            </div>

            {isLoadingDoctors ? (
              <div className="py-16 text-center text-slate-500">Loading doctors...</div>
            ) : filteredDoctors.length === 0 ? (
              <Card className="p-12 text-center">
                <StethoscopeIcon className="mx-auto mb-4 h-9 w-9 text-slate-300" />
                <p className="text-slate-500">No real doctor accounts matched your search.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {filteredDoctors.map((doctor) => (
                  <Card
                    key={doctor._id}
                    hoverable
                    onClick={() => handleDoctorSelect(doctor)}
                    className="p-6"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row">
                      <Avatar name={getDoctorName(doctor)} src={doctor.avatar} size="lg" className="mx-auto sm:mx-0" />

                      <div className="flex-1 text-center sm:text-left">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">{getDoctorName(doctor)}</h3>
                            <p className="text-sm font-medium text-blue-600">{getDoctorSpecialization(doctor)}</p>
                          </div>
                          <Badge variant="info" className="self-center sm:self-start">Available</Badge>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500 sm:justify-start">
                          <span className="inline-flex items-center">
                            <StarIcon className="mr-1 h-4 w-4 fill-current text-amber-400" />
                            Real account
                          </span>
                          <span className="inline-flex items-center">
                            <BadgeDollarSignIcon className="mr-1 h-4 w-4 text-emerald-500" />
                            {formatPrice(getDoctorFee(doctor))} base fee
                          </span>
                        </div>

                        <p className="mt-4 text-sm leading-6 text-slate-500">
                          {doctor.bio || 'This doctor can now be booked through live availability managed from the doctor dashboard.'}
                        </p>

                        <div className="mt-5 flex justify-center sm:justify-start">
                          <Button
                            variant="outline"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDoctorSelect(doctor);
                            }}
                          >
                            Select Doctor
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {step === 2 && selectedDoctor && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <button onClick={() => setStep(1)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
                <ChevronLeftIcon className="h-5 w-5" />
              </button>

              <div>
                <h2 className="text-2xl font-bold text-slate-900">Choose Date and Time</h2>
                <p className="text-sm text-slate-500">Booking with {getDoctorName(selectedDoctor)}</p>
              </div>
            </div>

            {bookingError && <p className="text-sm text-red-600">{bookingError}</p>}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_1.4fr]">
              <Card className="p-6">
                <div className="mb-5 flex items-center gap-3">
                  <Avatar name={getDoctorName(selectedDoctor)} src={selectedDoctor.avatar} size="lg" />
                  <div>
                    <h3 className="font-semibold text-slate-900">{getDoctorName(selectedDoctor)}</h3>
                    <p className="text-sm text-blue-600">{getDoctorSpecialization(selectedDoctor)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="mb-3 flex items-center text-sm font-semibold text-slate-900">
                      <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                      Select Date
                    </h4>
                    <Input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} min={getToday()} />
                  </div>

                  <Card className="border-blue-100 bg-blue-50/70 p-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">Doctor</span>
                        <span className="font-medium text-slate-900">{getDoctorName(selectedDoctor)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">Specialization</span>
                        <span className="font-medium text-slate-900">{getDoctorSpecialization(selectedDoctor)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">Price</span>
                        <span className="font-medium text-slate-900">
                          {selectedSlot ? formatPrice(getSlotPrice(selectedSlot, selectedDoctor)) : formatPrice(getDoctorFee(selectedDoctor))}
                        </span>
                      </div>
                      {selectedSlot && (
                        <>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-slate-500">Chosen Slot</span>
                            <span className="font-medium text-slate-900">{selectedDate} at {formatDisplayTime(selectedSlot.startTime)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-slate-500">Capacity</span>
                            <span className="font-medium text-slate-900">
                              {selectedSlot.bookedCount || 0}/{selectedSlot.maxPatients || 1} booked
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-slate-500">Spots Left</span>
                            <span className="font-medium text-emerald-600">{getSlotAvailableSpots(selectedSlot)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="mb-4 flex items-center text-lg font-semibold text-slate-900">
                  <ClockIcon className="mr-2 h-4 w-4 text-blue-600" />
                  Real Available Slots
                </h3>

                {isLoadingSlots ? (
                  <div className="py-16 text-center text-slate-500">Loading doctor availability...</div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Morning</h4>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {morningSlots.map((slot) => (
                          <button
                            key={slot._id}
                            onClick={() => {
                              setSelectedSlot(slot);
                              setCheckout(null);
                            }}
                            className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                              selectedSlot?._id === slot._id
                                ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-100'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/40'
                            }`}
                          >
                            <div>{formatDisplayTime(slot.startTime)}</div>
                            <div className="mt-1 text-xs text-slate-400">to {formatDisplayTime(slot.endTime)}</div>
                            <div className="mt-2 text-xs font-semibold text-emerald-600">{formatPrice(getSlotPrice(slot, selectedDoctor))}</div>
                            <div className="mt-1 text-xs text-blue-600">{slot.bookedCount || 0}/{slot.maxPatients || 1} booked</div>
                            <div className="mt-1 text-xs text-slate-500">{getSlotAvailableSpots(slot)} spots left</div>
                          </button>
                        ))}
                        {morningSlots.length === 0 && <p className="col-span-full text-sm text-slate-500">No morning slots available for this date.</p>}
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Afternoon</h4>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {afternoonSlots.map((slot) => (
                          <button
                            key={slot._id}
                            onClick={() => {
                              setSelectedSlot(slot);
                              setCheckout(null);
                            }}
                            className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                              selectedSlot?._id === slot._id
                                ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-100'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/40'
                            }`}
                          >
                            <div>{formatDisplayTime(slot.startTime)}</div>
                            <div className="mt-1 text-xs text-slate-400">to {formatDisplayTime(slot.endTime)}</div>
                            <div className="mt-2 text-xs font-semibold text-emerald-600">{formatPrice(getSlotPrice(slot, selectedDoctor))}</div>
                            <div className="mt-1 text-xs text-blue-600">{slot.bookedCount || 0}/{slot.maxPatients || 1} booked</div>
                            <div className="mt-1 text-xs text-slate-500">{getSlotAvailableSpots(slot)} spots left</div>
                          </button>
                        ))}
                        {afternoonSlots.length === 0 && <p className="col-span-full text-sm text-slate-500">No afternoon slots available for this date.</p>}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-8 border-t border-slate-100 pt-6">
                  <Button fullWidth disabled={!selectedSlot} isLoading={isPreparingPayment} onClick={handlePreparePayment}>
                    Continue to Payment
                  </Button>
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {step === 3 && selectedDoctor && selectedSlot && checkout && stripePromise && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <button onClick={() => setStep(2)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Stripe Payment</h2>
                <p className="text-sm text-slate-500">Pay first, then your appointment is confirmed automatically.</p>
              </div>
            </div>

            {stripeLoadError ? (
              <Card className="p-6">
                <p className="text-sm text-red-600">{stripeLoadError}</p>
                <div className="mt-4">
                  <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                </div>
              </Card>
            ) : (
              <Elements stripe={stripePromise} options={{ clientSecret: checkout.clientSecret }}>
                <AppointmentPaymentForm
                  checkout={checkout}
                  selectedDoctor={selectedDoctor}
                  selectedSlot={selectedSlot}
                  user={user}
                  token={token}
                  onBack={() => setStep(2)}
                  onSuccess={(appointment) => {
                    setConfirmation(appointment);
                    setStep(4);
                  }}
                />
              </Elements>
            )}
          </motion.div>
        )}

        {step === 4 && confirmation && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto max-w-xl py-12 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.15 }}
              className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100"
            >
              <CheckCircleIcon className="h-12 w-12 text-emerald-500" />
            </motion.div>

            <h2 className="text-3xl font-bold text-slate-900">Payment Successful</h2>
            <p className="mx-auto mt-3 max-w-lg text-slate-500">
              Your booking with {confirmation.doctor?.fullName || getDoctorName(selectedDoctor)} is pending doctor approval for{' '}
              {formatAppointmentDate(confirmation.appointmentDate)}.
            </p>

            <Card className="mt-8 p-6 text-left">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Doctor</p>
                  <div className="flex items-center gap-3">
                    <Avatar name={confirmation.doctor?.fullName || getDoctorName(selectedDoctor)} src={selectedDoctor?.avatar} size="md" />
                    <div>
                      <p className="font-semibold text-slate-900">{confirmation.doctor?.fullName || getDoctorName(selectedDoctor)}</p>
                      <p className="text-sm text-slate-500">{getDoctorSpecialization(selectedDoctor)}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Patient</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <UserRoundIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{user.fullName || user.name}</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Paid Amount</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{formatPrice(confirmation.amountPaid || getSlotPrice(selectedSlot, selectedDoctor))}</p>
                <p className="mt-1 text-sm text-slate-500">Stripe payment status: {confirmation.paymentStatus || 'paid'}</p>
                {confirmation.availabilitySlot && (
                  <p className="mt-1 text-sm text-slate-500">
                    Slot capacity: {confirmation.availabilitySlot.bookedCount || 0}/{confirmation.availabilitySlot.maxPatients || 1} booked
                  </p>
                )}
              </div>
            </Card>

            <div className="mt-8 space-y-3">
              <Button fullWidth onClick={() => navigate('my-appointments')}>View My Appointments</Button>
              <Button fullWidth variant="outline" onClick={() => navigate('patient-dashboard')}>Return to Dashboard</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
