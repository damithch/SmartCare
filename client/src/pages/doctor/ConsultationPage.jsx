import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserIcon,
  FileTextIcon,
  PlusIcon,
  Trash2Icon,
  SearchIcon,
  StethoscopeIcon,
  CalendarIcon,
  ClockIcon,
  PillIcon,
  MailIcon,
  PhoneIcon,
  BadgeInfoIcon,
  ImageIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ActivityIcon
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import {
  fetchAppointmentMedicalRecord,
  fetchMedicines,
  fetchMyAppointments,
  fetchPatientUpcomingAppointments,
  fetchPatientMedicalRecords,
  fetchUserById,
  saveConsultation
} from '../../services/auth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';

const frequencyOptions = [
  { value: 'Once daily', label: 'Once daily' },
  { value: 'Twice daily', label: 'Twice daily' },
  { value: 'Three times daily', label: 'Three times daily' },
  { value: 'Four times daily', label: 'Four times daily' },
  { value: 'As needed', label: 'As needed' }
];

const emptyDiagnosis = () => ({ id: `${Date.now()}-${Math.random()}`, title: '', description: '', additionalNotes: '' });
const emptyPrescription = () => ({ id: `${Date.now()}-${Math.random()}`, medicineName: '', dosage: '', frequency: 'Once daily', duration: '', instructions: '' });

const normalizeRecordToForm = (record) => ({
  visitReason: record?.visitReason || '',
  symptoms: record?.symptoms || '',
  notes: record?.notes || '',
  followUpRequired: Boolean(record?.followUpRequired),
  followUpDate: record?.followUpDate ? new Date(record.followUpDate).toISOString().split('T')[0] : '',
  vitals: {
    bloodPressure: record?.vitals?.bloodPressure || '',
    temperature: record?.vitals?.temperature || '',
    heartRate: record?.vitals?.heartRate || '',
    respiratoryRate: record?.vitals?.respiratoryRate || '',
    weight: record?.vitals?.weight || '',
    height: record?.vitals?.height || ''
  },
  diagnoses: record?.diagnoses?.length
    ? record.diagnoses.map((diagnosis, index) => ({ id: diagnosis._id || `${index}`, title: diagnosis.title || '', description: diagnosis.description || '', additionalNotes: diagnosis.additionalNotes || '' }))
    : [emptyDiagnosis()],
  prescriptions: record?.prescriptions?.length
    ? record.prescriptions.map((prescription, index) => ({ id: prescription._id || `${index}`, medicineName: prescription.medicineName || '', dosage: prescription.dosage || '', frequency: prescription.frequency || 'Once daily', duration: prescription.duration || '', instructions: prescription.instructions || '' }))
    : [emptyPrescription()]
});

const formatAppointmentDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const formatJoinedDate = (value) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString();
};

const getDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

const getPatientDisplayName = (profile, appointment) => profile?.fullName || appointment?.patient?.fullName || 'Patient';
const getPatientEmail = (profile, appointment) => profile?.email || appointment?.patient?.email || 'No email';
const getPatientPhone = (profile, appointment) => profile?.phone || appointment?.patient?.phone || 'Not provided';

export const ConsultationPage = () => {
  const { user, token, navigate } = useAppContext();
  const [appointments, setAppointments] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [selectedPatientProfile, setSelectedPatientProfile] = useState(null);
  const [form, setForm] = useState(normalizeRecordToForm(null));
  const [historyRecords, setHistoryRecords] = useState([]);
  const [upcomingPatientAppointments, setUpcomingPatientAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHistoryDate, setSelectedHistoryDate] = useState('');

  useEffect(() => {
    if (!user || !token) return;

    let isMounted = true;
    const loadInitialData = async () => {
      setIsLoading(true);
      setError('');

      try {
        const [appointmentData, medicineData] = await Promise.all([fetchMyAppointments(token), fetchMedicines(token)]);
        if (!isMounted) return;

        const nextAppointments = Array.isArray(appointmentData) ? appointmentData.filter((appointment) => appointment.status === 'approved') : [];
        setAppointments(nextAppointments);
        setMedicines(Array.isArray(medicineData) ? medicineData : []);
        if (nextAppointments.length > 0) {
          setSelectedAppointmentId((current) => current || nextAppointments[0]._id);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load consultations');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [token, user]);

  const selectedAppointment = useMemo(
    () => appointments.find((appointment) => appointment._id === selectedAppointmentId) || null,
    [appointments, selectedAppointmentId]
  );

  useEffect(() => {
    if (!selectedAppointment || !token) return;

    let isMounted = true;
    const loadAppointmentContext = async () => {
      setError('');
      setSuccessMessage('');

      try {
        const [patientRecords, consultationRecord, patientProfile] = await Promise.all([
          fetchPatientMedicalRecords(token, selectedAppointment.patient?._id),
          fetchAppointmentMedicalRecord(token, selectedAppointment._id),
          fetchUserById(token, selectedAppointment.patient?._id)
        ]);
        const upcomingAppointments = await fetchPatientUpcomingAppointments(token, selectedAppointment.patient?._id);

        if (!isMounted) return;

        const records = Array.isArray(patientRecords) ? patientRecords : [];
        setHistoryRecords(records.filter((record) => record.appointment?._id !== selectedAppointment._id));
        setUpcomingPatientAppointments(
          (Array.isArray(upcomingAppointments) ? upcomingAppointments : []).filter(
            (appointment) => appointment._id !== selectedAppointment._id
          )
        );
        setForm(normalizeRecordToForm(consultationRecord));
        setSelectedPatientProfile(patientProfile);
        setSelectedHistoryDate('');
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load patient profile');
      }
    };

    loadAppointmentContext();
    return () => {
      isMounted = false;
    };
  }, [selectedAppointment, token]);

  const filteredAppointments = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    const sorted = [...appointments].sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
    if (!term) return sorted;
    return sorted.filter((appointment) => {
      const patientName = appointment.patient?.fullName || '';
      const patientEmail = appointment.patient?.email || '';
      return patientName.toLowerCase().includes(term) || patientEmail.toLowerCase().includes(term);
    });
  }, [appointments, searchQuery]);

  const medicineOptions = useMemo(
    () => medicines.map((medicine) => ({ value: medicine.name, label: `${medicine.name}${medicine.strength ? ` (${medicine.strength})` : ''}` })),
    [medicines]
  );

  const historyDates = useMemo(
    () => [...new Set(historyRecords.map((record) => getDateKey(record.createdAt)).filter(Boolean))],
    [historyRecords]
  );

  useEffect(() => {
    if (!selectedHistoryDate && historyDates.length > 0) {
      setSelectedHistoryDate(historyDates[0]);
    }
  }, [historyDates, selectedHistoryDate]);

  const filteredHistoryRecords = useMemo(() => {
    if (!selectedHistoryDate) return historyRecords;
    return historyRecords.filter((record) => getDateKey(record.createdAt) === selectedHistoryDate);
  }, [historyRecords, selectedHistoryDate]);

  if (!user) return null;

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateVitals = (key, value) => setForm((current) => ({ ...current, vitals: { ...current.vitals, [key]: value } }));
  const updateDiagnosis = (id, key, value) => setForm((current) => ({ ...current, diagnoses: current.diagnoses.map((diagnosis) => (diagnosis.id === id ? { ...diagnosis, [key]: value } : diagnosis)) }));
  const updatePrescription = (id, key, value) => setForm((current) => ({ ...current, prescriptions: current.prescriptions.map((prescription) => (prescription.id === id ? { ...prescription, [key]: value } : prescription)) }));
  const addDiagnosis = () => setForm((current) => ({ ...current, diagnoses: [...current.diagnoses, emptyDiagnosis()] }));
  const removeDiagnosis = (id) => setForm((current) => ({ ...current, diagnoses: current.diagnoses.length > 1 ? current.diagnoses.filter((diagnosis) => diagnosis.id !== id) : current.diagnoses }));
  const addPrescription = () => setForm((current) => ({ ...current, prescriptions: [...current.prescriptions, emptyPrescription()] }));
  const removePrescription = (id) => setForm((current) => ({ ...current, prescriptions: current.prescriptions.length > 1 ? current.prescriptions.filter((prescription) => prescription.id !== id) : current.prescriptions }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedAppointment) return;

    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      await saveConsultation(token, {
        patientId: selectedAppointment.patient._id,
        appointmentId: selectedAppointment._id,
        visitReason: form.visitReason,
        symptoms: form.symptoms,
        vitals: form.vitals,
        diagnoses: form.diagnoses.map(({ id, title, description, additionalNotes }) => ({ id, title, description, additionalNotes })),
        prescriptions: form.prescriptions
          .filter((prescription) => prescription.medicineName && prescription.dosage && prescription.frequency && prescription.duration)
          .map(({ id, medicineName, dosage, frequency, duration, instructions }) => ({ id, medicineName, dosage, frequency, duration, instructions })),
        notes: form.notes,
        followUpRequired: form.followUpRequired,
        followUpDate: form.followUpRequired && form.followUpDate ? form.followUpDate : undefined
      });

      setAppointments((current) => {
        const remainingAppointments = current.filter((appointment) => appointment._id !== selectedAppointment._id);
        setSelectedAppointmentId(remainingAppointments[0]?._id || '');
        return remainingAppointments;
      });
      setSuccessMessage('Consultation saved and appointment marked as completed.');
    } catch (err) {
      setError(err.message || 'Failed to save consultation');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl py-16 text-center text-slate-500">
        <StethoscopeIcon className="mx-auto mb-4 h-10 w-10 text-slate-300" />
        Loading consultation workspace...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Doctor Consultations</h1>
          <p className="mt-1 text-slate-500">Open a patient like a real profile, then review history and complete the consultation.</p>
        </div>
        <Button variant="outline" onClick={() => navigate('doctor-dashboard')}>Back to Dashboard</Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {successMessage && <p className="text-sm text-emerald-600">{successMessage}</p>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_1.2fr_0.95fr]">
        <div className="space-y-4">
          <Card className="p-5">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search booked patients"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 py-3.5 pl-11 pr-4 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold text-slate-900">Booked Patients</h2>
            </div>
            <div className="max-h-[720px] overflow-y-auto">
              {filteredAppointments.length > 0 ? filteredAppointments.map((appointment) => {
                const isActive = appointment._id === selectedAppointmentId;
                return (
                  <button
                    key={appointment._id}
                    type="button"
                    onClick={() => setSelectedAppointmentId(appointment._id)}
                    className={`flex w-full items-start gap-3 border-b border-slate-100 px-5 py-4 text-left transition-colors ${isActive ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                  >
                    <Avatar name={appointment.patient?.fullName || 'Patient'} src={appointment.patient?.avatar} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="truncate font-semibold text-slate-900">{appointment.patient?.fullName || 'Patient'}</p>
                          <p className="truncate text-xs text-slate-500">{appointment.patient?.email || 'No email'}</p>
                        </div>
                        <Badge variant={appointment.status === 'completed' ? 'success' : appointment.status === 'approved' ? 'info' : 'warning'} className="capitalize">{appointment.status}</Badge>
                      </div>
                      <p className="mt-2 flex items-center text-xs text-slate-500"><CalendarIcon className="mr-1 h-3 w-3" /> {formatAppointmentDate(appointment.appointmentDate)}</p>
                    </div>
                  </button>
                );
              }) : <div className="p-5 text-sm text-slate-500">No booked appointments found.</div>}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {selectedAppointment ? (
            <>
              <Card className="overflow-hidden border-slate-200 p-0 shadow-sm">
                <div className="relative">
                  <div
                    className="h-52 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.25),_transparent_35%),linear-gradient(135deg,#0f4c81_0%,#168aad_52%,#99d98c_100%)] bg-cover bg-center"
                    style={selectedPatientProfile?.coverImage ? { backgroundImage: `linear-gradient(135deg, rgba(15,76,129,0.58), rgba(22,138,173,0.45), rgba(153,217,140,0.32)), url(${selectedPatientProfile.coverImage})` } : undefined}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(15,23,42,0.45),transparent_55%)]" />
                  <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-sm">
                    <SparklesIcon className="h-3.5 w-3.5" /> Patient Profile
                  </div>
                  <div className="absolute right-6 top-6">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-white/30 bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
                      onClick={() => {
                        setSelectedAppointmentId('');
                        setSelectedPatientProfile(null);
                        setHistoryRecords([]);
                        setUpcomingPatientAppointments([]);
                        setSelectedHistoryDate('');
                        setForm(normalizeRecordToForm(null));
                        setSuccessMessage('');
                        setError('');
                      }}
                    >
                      Close
                    </Button>
                  </div>
                  <div className="absolute bottom-6 right-6">
                    <Badge variant={selectedAppointment.status === 'completed' ? 'success' : 'warning'} className="capitalize border border-white/30 bg-white/90 text-slate-800 shadow-sm">
                      {selectedAppointment.status}
                    </Badge>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-0">
                  <div className="-mt-16 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="flex items-end gap-4">
                      <Avatar
                        name={getPatientDisplayName(selectedPatientProfile, selectedAppointment)}
                        src={selectedPatientProfile?.avatar || selectedAppointment.patient?.avatar}
                        size="xl"
                        className="ring-4 ring-white shadow-xl"
                      />
                      <div className="pb-2">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">{getPatientDisplayName(selectedPatientProfile, selectedAppointment)}</h2>
                        <p className="mt-1 text-sm font-medium text-slate-500">{selectedPatientProfile?.role || 'patient'} profile opened for consultation</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant="info">Appointment {formatAppointmentDate(selectedAppointment.appointmentDate)}</Badge>
                          <Badge variant={selectedAppointment.paymentStatus === 'paid' ? 'success' : 'warning'} className="capitalize">
                            Payment {selectedAppointment.paymentStatus || 'pending'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 lg:min-w-[280px]">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Joined</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">{formatJoinedDate(selectedPatientProfile?.createdAt)}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Role</p>
                        <p className="mt-2 text-sm font-semibold capitalize text-slate-900">{selectedPatientProfile?.role || 'patient'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-3xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Contact</p>
                      <div className="mt-3 space-y-2.5 text-sm text-slate-700">
                        <p className="flex items-center"><MailIcon className="mr-2 h-4 w-4 text-blue-500" /> {getPatientEmail(selectedPatientProfile, selectedAppointment)}</p>
                        <p className="flex items-center"><PhoneIcon className="mr-2 h-4 w-4 text-emerald-500" /> {getPatientPhone(selectedPatientProfile, selectedAppointment)}</p>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Profile State</p>
                      <div className="mt-3 space-y-2.5 text-sm text-slate-700">
                        <p className="flex items-center"><ShieldCheckIcon className="mr-2 h-4 w-4 text-teal-500" /> {selectedPatientProfile?.isActive === false ? 'Inactive account' : 'Active account'}</p>
                        <p className="flex items-center"><BadgeInfoIcon className="mr-2 h-4 w-4 text-slate-400" /> Ready for doctor review</p>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Session</p>
                      <div className="mt-3 space-y-2.5 text-sm text-slate-700">
                        <p className="flex items-center"><ActivityIcon className="mr-2 h-4 w-4 text-amber-500" /> Consultation workspace open</p>
                        <p className="flex items-center"><ClockIcon className="mr-2 h-4 w-4 text-blue-500" /> {formatAppointmentDate(selectedAppointment.appointmentDate)}</p>
                      </div>
                    </div>
                  </div>

                  {selectedPatientProfile?.bio && (
                    <div className="mt-5 rounded-3xl border border-blue-100 bg-[linear-gradient(135deg,rgba(239,246,255,0.9),rgba(240,253,250,0.9))] px-5 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">Patient Bio</p>
                      <p className="mt-3 text-sm leading-6 text-slate-700">{selectedPatientProfile.bio}</p>
                    </div>
                  )}
                </div>
              </Card>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">Consultation Notes</h2>
                    <Button type="submit" size="sm" isLoading={isSaving}>Save Notes</Button>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input label="Visit Reason" value={form.visitReason} onChange={(event) => updateForm('visitReason', event.target.value)} required />
                    <Input label="Symptoms" value={form.symptoms} onChange={(event) => updateForm('symptoms', event.target.value)} required />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Input label="Blood Pressure" value={form.vitals.bloodPressure} onChange={(event) => updateVitals('bloodPressure', event.target.value)} placeholder="120/80" />
                    <Input label="Temperature" value={form.vitals.temperature} onChange={(event) => updateVitals('temperature', event.target.value)} placeholder="98.6 F" />
                    <Input label="Heart Rate" value={form.vitals.heartRate} onChange={(event) => updateVitals('heartRate', event.target.value)} placeholder="72 bpm" />
                    <Input label="Respiratory Rate" value={form.vitals.respiratoryRate} onChange={(event) => updateVitals('respiratoryRate', event.target.value)} placeholder="16/min" />
                    <Input label="Weight" value={form.vitals.weight} onChange={(event) => updateVitals('weight', event.target.value)} placeholder="70 kg" />
                    <Input label="Height" value={form.vitals.height} onChange={(event) => updateVitals('height', event.target.value)} placeholder="170 cm" />
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Clinical Notes</label>
                    <textarea className="w-full min-h-[150px] rounded-2xl border border-slate-300 bg-white/95 px-4 py-3 text-[15px] leading-6 text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus:border-blue-500 focus:ring-4 focus:ring-blue-100" value={form.notes} onChange={(event) => updateForm('notes', event.target.value)} placeholder="Enter patient observations, treatment plan, and extra notes..." />
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Diagnoses</h2>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={addDiagnosis}><PlusIcon className="mr-2 h-4 w-4" /> Add Diagnosis</Button>
                      <Button type="submit" size="sm" isLoading={isSaving}>Save Diagnoses</Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {form.diagnoses.map((diagnosis) => (
                      <div key={diagnosis.id} className="relative rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <Input label="Diagnosis Title" value={diagnosis.title} onChange={(event) => updateDiagnosis(diagnosis.id, 'title', event.target.value)} required />
                          <Input label="Additional Notes" value={diagnosis.additionalNotes} onChange={(event) => updateDiagnosis(diagnosis.id, 'additionalNotes', event.target.value)} />
                        </div>
                        <div className="mt-4">
                          <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
                          <textarea className="w-full min-h-[120px] rounded-2xl border border-slate-300 bg-white/95 px-4 py-3 text-[15px] leading-6 text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus:border-blue-500 focus:ring-4 focus:ring-blue-100" value={diagnosis.description} onChange={(event) => updateDiagnosis(diagnosis.id, 'description', event.target.value)} required />
                        </div>
                        {form.diagnoses.length > 1 && <button type="button" onClick={() => removeDiagnosis(diagnosis.id)} className="absolute right-3 top-3 rounded-full p-2 text-red-500 hover:bg-red-50 hover:text-red-700"><Trash2Icon className="h-4 w-4" /></button>}
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Prescriptions</h2>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={addPrescription}><PlusIcon className="mr-2 h-4 w-4" /> Add Medicine</Button>
                      <Button type="submit" size="sm" isLoading={isSaving}>Save Prescriptions</Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {form.prescriptions.map((prescription) => (
                      <div key={prescription.id} className="relative rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                          <Select label="Medicine" options={medicineOptions} value={prescription.medicineName} onChange={(event) => updatePrescription(prescription.id, 'medicineName', event.target.value)} required />
                          <Input label="Dosage" value={prescription.dosage} onChange={(event) => updatePrescription(prescription.id, 'dosage', event.target.value)} placeholder="500mg" required />
                          <Select label="Frequency" options={frequencyOptions} value={prescription.frequency} onChange={(event) => updatePrescription(prescription.id, 'frequency', event.target.value)} required />
                          <Input label="Duration" value={prescription.duration} onChange={(event) => updatePrescription(prescription.id, 'duration', event.target.value)} placeholder="5 days" required />
                        </div>
                        <div className="mt-4">
                          <Input label="Instructions" value={prescription.instructions} onChange={(event) => updatePrescription(prescription.id, 'instructions', event.target.value)} placeholder="Take after meals" />
                        </div>
                        {form.prescriptions.length > 1 && <button type="button" onClick={() => removePrescription(prescription.id)} className="absolute right-3 top-3 rounded-full p-2 text-red-500 hover:bg-red-50 hover:text-red-700"><Trash2Icon className="h-4 w-4" /></button>}
                      </div>
                    ))}
                  </div>
                </Card>

                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline" onClick={() => navigate('doctor-dashboard')}>Cancel</Button>
                  <Button type="submit" isLoading={isSaving} size="lg">Save Consultation</Button>
                </div>
              </form>
            </>
          ) : <Card className="p-12 text-center text-slate-500">Select a booked patient to start a consultation.</Card>}
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden p-0">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="font-semibold text-slate-900">Patient Profile Snapshot</h3>
            </div>
            {selectedPatientProfile ? (
              <div className="space-y-4 p-6">
                <div className="rounded-3xl bg-slate-50 p-5">
                  <div className="flex items-center gap-4">
                    <Avatar name={getPatientDisplayName(selectedPatientProfile, selectedAppointment)} src={selectedPatientProfile?.avatar || selectedAppointment?.patient?.avatar} size="lg" />
                    <div>
                      <p className="text-lg font-bold text-slate-900">{getPatientDisplayName(selectedPatientProfile, selectedAppointment)}</p>
                      <p className="text-sm text-slate-500">Live patient identity loaded from profile</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Email</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">{getPatientEmail(selectedPatientProfile, selectedAppointment)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Phone</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">{getPatientPhone(selectedPatientProfile, selectedAppointment)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Profile Created</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">{formatJoinedDate(selectedPatientProfile.createdAt)}</p>
                  </div>
                </div>
              </div>
            ) : <div className="p-6 text-sm text-slate-500">No patient selected.</div>}
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 flex items-center font-semibold text-slate-900"><FileTextIcon className="mr-2 h-4 w-4 text-blue-600" /> Previous Visits</h3>
            {historyRecords.length > 0 ? (
              <div className="space-y-4">
                <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <CalendarIcon className="h-4 w-4 text-blue-600" />
                    Select visit day
                  </div>
                  <Input
                    type="date"
                    value={selectedHistoryDate}
                    onChange={(event) => setSelectedHistoryDate(event.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    {historyDates.slice(0, 6).map((date) => (
                      <button
                        key={date}
                        type="button"
                        onClick={() => setSelectedHistoryDate(date)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                          selectedHistoryDate === date
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {new Date(date).toLocaleDateString()}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredHistoryRecords.map((record) => (
                  <div key={record._id} className="border-l-2 border-slate-200 pl-4 py-1">
                    <p className="text-xs font-bold uppercase text-slate-500">{new Date(record.createdAt).toLocaleDateString()}</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{record.visitReason}</p>
                    <div className="mt-3 space-y-3 rounded-2xl border border-slate-100 bg-white p-4">
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-500">Patient Data</p>
                        <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="rounded-xl bg-slate-50 px-3 py-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Patient</p>
                            <p className="mt-1 text-sm font-medium text-slate-900">{record.patient?.fullName || selectedAppointment?.patient?.fullName || 'Patient'}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 px-3 py-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Doctor</p>
                            <p className="mt-1 text-sm font-medium text-slate-900">{record.doctor?.fullName || 'Doctor'}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 px-3 py-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Email</p>
                            <p className="mt-1 text-sm font-medium text-slate-900">{record.patient?.email || selectedAppointment?.patient?.email || 'No email'}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 px-3 py-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Phone</p>
                            <p className="mt-1 text-sm font-medium text-slate-900">{record.patient?.phone || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-500">Consultation Notes</p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">{record.notes || record.symptoms || 'No notes recorded.'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-500">Diagnoses</p>
                        {record.diagnoses?.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {record.diagnoses.map((diagnosis) => (
                              <Badge key={diagnosis._id || diagnosis.title} variant="info">{diagnosis.title}</Badge>
                            ))}
                          </div>
                        ) : <p className="mt-1 text-xs text-slate-500">No diagnoses recorded.</p>}
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-500">Prescriptions</p>
                        {record.prescriptions?.length > 0 ? (
                          <div className="mt-2 space-y-1">
                            {record.prescriptions.map((prescription, index) => (
                              <p key={`${record._id}-rx-${index}`} className="text-xs text-slate-600">
                                {prescription.medicineName} | {prescription.dosage} | {prescription.frequency} | {prescription.duration}
                              </p>
                            ))}
                          </div>
                        ) : <p className="mt-1 text-xs text-slate-500">No prescriptions recorded.</p>}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredHistoryRecords.length === 0 && (
                  <p className="text-sm text-slate-500">No visit records found for the selected day.</p>
                )}
              </div>
            ) : <p className="text-sm text-slate-500">No previous medical records found for this patient.</p>}
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 flex items-center font-semibold text-slate-900"><CalendarIcon className="mr-2 h-4 w-4 text-blue-600" /> Next Bookings</h3>
            {upcomingPatientAppointments.length > 0 ? (
              <div className="space-y-3">
                {upcomingPatientAppointments.map((appointment) => (
                  <div key={appointment._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{appointment.doctor?.fullName || 'Doctor'}</p>
                        <p className="mt-1 text-xs text-slate-500">{appointment.doctor?.specialization || 'General Practice'}</p>
                      </div>
                      <Badge variant={appointment.status === 'approved' ? 'success' : 'warning'} className="capitalize">
                        {appointment.status}
                      </Badge>
                    </div>
                    <div className="mt-3 space-y-1 text-xs text-slate-600">
                      <p><span className="font-semibold text-slate-800">Date:</span> {formatAppointmentDate(appointment.appointmentDate)}</p>
                      <p><span className="font-semibold text-slate-800">Doctor Email:</span> {appointment.doctor?.email || 'No email'}</p>
                      <p><span className="font-semibold text-slate-800">Payment:</span> {appointment.paymentStatus || 'pending'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-slate-500">No future bookings found for this patient.</p>}
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 flex items-center font-semibold text-slate-900"><PillIcon className="mr-2 h-4 w-4 text-blue-600" /> Medicine Directory</h3>
            {medicines.length > 0 ? (
              <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                {medicines.slice(0, 20).map((medicine) => (
                  <div key={medicine._id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="font-medium text-slate-900">{medicine.name}</p>
                    <p className="text-xs text-slate-500">{medicine.strength || medicine.category || 'Medicine'}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-slate-500">No medicines available.</p>}
          </Card>
        </div>
      </div>
    </div>
  );
};
