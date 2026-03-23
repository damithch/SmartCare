import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserIcon,
  FileTextIcon,
  PlusIcon,
  Trash2Icon,
  CheckCircleIcon,
  SearchIcon } from
'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { mockAppointments, mockMedicines } from '../../data/mockData';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Avatar } from '../../components/ui/Avatar';

export const ConsultationPage = () => {
  const { user, navigate } = useAppContext();
  // Mock active appointment
  const activeAppointment = mockAppointments[0];
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [prescriptions, setPrescriptions] = useState([
  {
    id: '1',
    medicineId: '',
    dosage: '',
    frequency: '',
    duration: ''
  }]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  if (!user) return null;
  const handleAddPrescription = () => {
    setPrescriptions([
    ...prescriptions,
    {
      id: Date.now().toString(),
      medicineId: '',
      dosage: '',
      frequency: '',
      duration: ''
    }]
    );
  };
  const handleRemovePrescription = (id) => {
    setPrescriptions(prescriptions.filter((p) => p.id !== id));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('doctor-dashboard');
      }, 2000);
    }, 1500);
  };
  if (isSuccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{
            scale: 0.9,
            opacity: 0
          }}
          animate={{
            scale: 1,
            opacity: 1
          }}
          className="text-center">

          <CheckCircleIcon className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Consultation Completed
          </h2>
          <p className="text-slate-500">
            Notes and prescriptions have been saved successfully.
          </p>
        </motion.div>
      </div>);

  }
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Active Consultation
        </h1>
        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full flex items-center">
          <span className="w-2 h-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
          In Progress
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Patient Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6">
            <div className="flex flex-col items-center text-center border-b border-slate-100 pb-6 mb-6">
              <Avatar
                name={activeAppointment.patientName || 'Patient'}
                size="xl"
                className="mb-4" />

              <h2 className="text-xl font-bold text-slate-900">
                {activeAppointment.patientName}
              </h2>
              <p className="text-slate-500">
                {activeAppointment.patientAge} years old • Female
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 flex items-center">
                <UserIcon className="w-4 h-4 mr-2 text-blue-600" />
                Patient Details
              </h3>
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <p className="text-slate-500">Blood Group</p>
                  <p className="font-medium text-slate-900">O+</p>
                </div>
                <div>
                  <p className="text-slate-500">Height/Weight</p>
                  <p className="font-medium text-slate-900">165cm / 62kg</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500">Allergies</p>
                  <p className="font-medium text-red-600 bg-red-50 px-2 py-1 rounded inline-block mt-1">
                    Penicillin
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-slate-900 flex items-center mb-4">
              <FileTextIcon className="w-4 h-4 mr-2 text-blue-600" />
              Previous Visits
            </h3>
            <div className="space-y-4">
              <div className="border-l-2 border-slate-200 pl-4 py-1">
                <p className="text-xs font-bold text-slate-500 uppercase">
                  Oct 15, 2023
                </p>
                <p className="text-sm font-medium text-slate-900 mt-1">
                  Mild respiratory infection
                </p>
                <p className="text-xs text-slate-500 mt-1">Dr. Sarah Davis</p>
              </div>
              <div className="border-l-2 border-slate-200 pl-4 py-1">
                <p className="text-xs font-bold text-slate-500 uppercase">
                  Aug 02, 2023
                </p>
                <p className="text-sm font-medium text-slate-900 mt-1">
                  Annual Checkup
                </p>
                <p className="text-xs text-slate-500 mt-1">Dr. James Wilson</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Panel: Consultation Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit}>
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Clinical Notes
              </h2>
              <div className="space-y-4">
                <Input
                  label="Primary Diagnosis"
                  placeholder="e.g., Acute Bronchitis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  required />

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Detailed Notes
                  </label>
                  <textarea
                    className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 min-h-[150px]"
                    placeholder="Enter patient symptoms, observations, and treatment plan..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    required />

                </div>
              </div>
            </Card>

            <Card className="p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Prescription
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddPrescription}>

                  <PlusIcon className="w-4 h-4 mr-2" /> Add Medicine
                </Button>
              </div>

              <div className="space-y-4">
                {prescriptions.map((presc, index) =>
                <div
                  key={presc.id}
                  className="flex flex-col sm:flex-row gap-4 items-start bg-slate-50 p-4 rounded-xl border border-slate-100 relative">

                    <div className="w-full sm:w-1/3">
                      <Select
                      label="Medicine"
                      options={mockMedicines.map((m) => ({
                        value: m.id,
                        label: m.name
                      }))}
                      required />

                    </div>
                    <div className="w-full sm:w-1/4">
                      <Input
                      label="Dosage"
                      placeholder="e.g., 500mg"
                      required />

                    </div>
                    <div className="w-full sm:w-1/4">
                      <Select
                      label="Frequency"
                      options={[
                      {
                        value: '1',
                        label: 'Once daily'
                      },
                      {
                        value: '2',
                        label: 'Twice daily'
                      },
                      {
                        value: '3',
                        label: 'Thrice daily'
                      },
                      {
                        value: 'prn',
                        label: 'As needed'
                      }]
                      }
                      required />

                    </div>
                    <div className="w-full sm:w-1/4">
                      <Input
                      label="Duration"
                      placeholder="e.g., 5 days"
                      required />

                    </div>
                    {prescriptions.length > 1 &&
                  <button
                    type="button"
                    onClick={() => handleRemovePrescription(presc.id)}
                    className="absolute -top-2 -right-2 bg-white text-red-500 hover:text-red-700 p-1.5 rounded-full shadow-sm border border-slate-100">

                        <Trash2Icon className="w-4 h-4" />
                      </button>
                  }
                  </div>
                )}
              </div>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('doctor-dashboard')}>

                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting} size="lg">
                Submit Consultation
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>);

};
