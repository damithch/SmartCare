import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PillIcon,
  CheckCircleIcon,
  XCircleIcon,
  SearchIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { fetchPrescriptionQueue, updatePrescriptionQueueStatus } from '../../services/auth';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

export const PrescriptionQueue = () => {
  const { user, token } = useAppContext();
  const [activeTab, setActiveTab] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRx, setSelectedRx] = useState(null);
  const [isDispensing, setIsDispensing] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  if (!user) {
    return null;
  }

  const tabs = ['Pending', 'Processing', 'Dispensed'];

  const loadQueue = async () => {
    if (!token) {
      return [];
    }

    const data = await fetchPrescriptionQueue(token);
    const nextQueue = Array.isArray(data) ? data : [];
    setPrescriptions(nextQueue);
    return nextQueue;
  };

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    let isMounted = true;

    const loadInitialQueue = async () => {
      try {
        if (isMounted) {
          setIsLoading(true);
          setError('');
        }

        const nextQueue = await fetchPrescriptionQueue(token);

        if (isMounted) {
          setPrescriptions(Array.isArray(nextQueue) ? nextQueue : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load prescription queue');
          setPrescriptions([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadInitialQueue();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const filteredPrescriptions = useMemo(() => prescriptions.filter((rx) => {
    const matchesTab = rx.status.toLowerCase() === activeTab.toLowerCase();
    const matchesSearch =
      rx.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.patientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  }), [activeTab, prescriptions, searchQuery]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDispenseClick = (rx) => {
    if (!rx.isPaid) {
      setError('Patient has not paid the medicine bill yet');
      return;
    }

    setSelectedRx(rx);
    setIsModalOpen(true);
  };

  const updateStatus = async (rx, status) => {
    if (!token) {
      return;
    }

    if (status === 'dispensed') {
      setIsDispensing(true);
    }

    try {
      let updatedRx;

      try {
        updatedRx = await updatePrescriptionQueueStatus(token, rx.recordId, rx.prescriptionId, status);
      } catch (err) {
        if (!(err.message || '').toLowerCase().includes('not found')) {
          throw err;
        }

        const latestQueue = await loadQueue();
        const refreshedRx = latestQueue.find((item) =>
          item.patientName === rx.patientName &&
          item.doctorName === rx.doctorName &&
          item.medicines?.[0]?.name === rx.medicines?.[0]?.name &&
          item.status === rx.status
        );

        if (!refreshedRx) {
          throw err;
        }

        updatedRx = await updatePrescriptionQueueStatus(token, refreshedRx.recordId, refreshedRx.prescriptionId, status);
      }

      setPrescriptions((current) => current.map((item) => (item.id === updatedRx.id ? updatedRx : item)));
      if (status === 'dispensed') {
        setIsModalOpen(false);
        setSelectedRx(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to update prescription');
    } finally {
      if (status === 'dispensed') {
        setIsDispensing(false);
      }
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold text-slate-900">Prescription Queue</h1>

        <div className="flex w-full items-center gap-4 sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="inline-flex self-start rounded-lg bg-slate-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <Card className="border-dashed p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <PillIcon className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">Loading prescriptions</h3>
            <p className="mt-1 text-slate-500">Fetching doctor-saved prescriptions for the pharmacist queue.</p>
          </Card>
        ) : filteredPrescriptions.length > 0 ? (
          filteredPrescriptions.map((rx, index) => (
            <motion.div
              key={rx.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden">
                <div
                  className="flex cursor-pointer flex-col justify-between gap-4 p-5 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center"
                  onClick={() => toggleExpand(rx.id)}
                >
                  <div className="flex items-start space-x-4">
                    <div className="shrink-0 rounded-xl bg-blue-50 p-3 text-blue-600">
                      <PillIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center space-x-2">
                        <h3 className="text-lg font-bold text-slate-900">{rx.patientName}</h3>
                        <span className="font-mono text-xs text-slate-400">#{rx.id}</span>
                      </div>
                      <p className="text-sm text-slate-500">
                        {rx.doctorName} {rx.doctorSpecialization ? `• ${rx.doctorSpecialization}` : ''} • {new Date(rx.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={rx.isPaid ? 'success' : 'warning'}
                        className="capitalize"
                      >
                        {rx.isPaid ? 'paid' : 'unpaid'}
                      </Badge>
                      <Badge
                        variant={rx.status === 'pending' ? 'warning' : rx.status === 'dispensed' ? 'success' : 'info'}
                        className="capitalize"
                      >
                        {rx.status}
                      </Badge>
                    </div>
                    <button className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                      {expandedId === rx.id ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === rx.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100 bg-slate-50/50"
                    >
                      <div className="p-5">
                        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="rounded-lg border border-slate-200 bg-white p-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Patient Email</p>
                            <p className="mt-1 text-sm text-slate-900">{rx.patientEmail || 'No email'}</p>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-white p-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Patient Phone</p>
                            <p className="mt-1 text-sm text-slate-900">{rx.patientPhone || 'Not provided'}</p>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-white p-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Medicine Bill</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">{rx.billNumber || 'Not generated'}</p>
                            <p className="mt-1 text-sm capitalize text-slate-500">{rx.billStatus || 'pending'}</p>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-white p-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Amount Due</p>
                            <p className={`mt-1 text-sm font-semibold ${rx.isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                              LKR {Number(rx.amountDue || 0).toFixed(2)}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {rx.isPaid ? 'Patient payment verified' : 'Wait for patient payment before dispensing'}
                            </p>
                          </div>
                        </div>

                        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-900">Prescribed Medicines</h4>
                        <div className="mb-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
                          <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Medicine</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Dosage</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Duration</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Notes</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {rx.medicines.map((med, index) => (
                                <tr key={`${rx.id}-${index}`}>
                                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{med.name}</td>
                                  <td className="px-4 py-3 text-sm text-slate-500">{med.dosage} - {med.frequency}</td>
                                  <td className="px-4 py-3 text-sm text-slate-500">{med.duration}</td>
                                  <td className="px-4 py-3 text-sm text-slate-500">{med.notes || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {rx.status !== 'dispensed' && (
                          <div className="flex justify-end gap-3 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:border-red-200 hover:bg-red-50"
                              onClick={() => updateStatus(rx, 'unavailable')}
                            >
                              <XCircleIcon className="mr-2 h-4 w-4" /> Mark Unavailable
                            </Button>
                            <Button size="sm" onClick={() => handleDispenseClick(rx)} disabled={!rx.isPaid}>
                              <CheckCircleIcon className="mr-2 h-4 w-4" /> Verify & Dispense
                            </Button>
                          </div>
                        )}
                        {!rx.isPaid && rx.status !== 'dispensed' && (
                          <p className="pt-3 text-sm font-medium text-amber-600">
                            Patient has not paid for this medicine yet. Dispense is locked.
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))
        ) : (
          <Card className="border-dashed p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <PillIcon className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No prescriptions found</h3>
            <p className="mt-1 text-slate-500">Doctor-saved prescriptions will appear here for the pharmacist.</p>
          </Card>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => !isDispensing && setIsModalOpen(false)}
        title="Confirm Dispense"
        maxWidth="md"
      >
        {selectedRx && (
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="mb-2 text-sm text-blue-800">You are about to dispense medicines for:</p>
              <p className="font-bold text-blue-900">{selectedRx.patientName}</p>
              <p className="text-sm text-blue-700">Prescription #{selectedRx.id}</p>
            </div>
            <p className="text-sm text-slate-600">
              Please confirm that you have verified the prescription details and prepared the correct medicines.
            </p>
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isDispensing}>
                Cancel
              </Button>
              <Button onClick={() => updateStatus(selectedRx, 'dispensed')} isLoading={isDispensing}>
                Confirm Dispense
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
