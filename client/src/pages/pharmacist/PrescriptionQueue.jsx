import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PillIcon,
  CheckCircleIcon,
  XCircleIcon,
  SearchIcon,
  ChevronDownIcon,
  ChevronUpIcon } from
'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { mockPrescriptions } from '../../data/mockData';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
export const PrescriptionQueue = () => {
  const { user } = useAppContext();
  const [activeTab, setActiveTab] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  // Dispense Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRx, setSelectedRx] = useState(null);
  const [isDispensing, setIsDispensing] = useState(false);
  if (!user) return null;
  const tabs = ['Pending', 'Processing', 'Dispensed'];
  const filteredPrescriptions = mockPrescriptions.filter((rx) => {
    const matchesTab = rx.status.toLowerCase() === activeTab.toLowerCase();
    const matchesSearch =
    rx.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rx.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });
  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };
  const handleDispenseClick = (rx) => {
    setSelectedRx(rx);
    setIsModalOpen(true);
  };
  const confirmDispense = () => {
    setIsDispensing(true);
    setTimeout(() => {
      setIsDispensing(false);
      setIsModalOpen(false);
      // In a real app, update state/API here
    }, 1500);
  };
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">
          Prescription Queue
        </h1>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />

          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-lg self-start inline-flex">
        {tabs.map((tab) =>
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>

            {tab}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {filteredPrescriptions.length > 0 ?
        filteredPrescriptions.map((rx, index) =>
        <motion.div
          key={rx.id}
          initial={{
            opacity: 0,
            y: 10
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: index * 0.05
          }}>

              <Card className="overflow-hidden">
                {/* Header */}
                <div
              className="p-5 cursor-pointer hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              onClick={() => toggleExpand(rx.id)}>

                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-50 p-3 rounded-xl text-blue-600 shrink-0">
                      <PillIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-bold text-slate-900">
                          {rx.patientName}
                        </h3>
                        <span className="text-xs text-slate-400 font-mono">
                          #{rx.id}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">
                        Dr. {rx.doctorName} •{' '}
                        {new Date(rx.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                    <Badge
                  variant={
                  rx.status === 'pending' ?
                  'warning' :
                  rx.status === 'dispensed' ?
                  'success' :
                  'info'
                  }
                  className="capitalize">

                      {rx.status}
                    </Badge>
                    <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                      {expandedId === rx.id ?
                  <ChevronUpIcon className="w-5 h-5" /> :

                  <ChevronDownIcon className="w-5 h-5" />
                  }
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedId === rx.id &&
              <motion.div
                initial={{
                  height: 0,
                  opacity: 0
                }}
                animate={{
                  height: 'auto',
                  opacity: 1
                }}
                exit={{
                  height: 0,
                  opacity: 0
                }}
                className="border-t border-slate-100 bg-slate-50/50">

                      <div className="p-5">
                        <h4 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider">
                          Prescribed Medicines
                        </h4>
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-4">
                          <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                  Medicine
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                  Dosage
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                  Duration
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                  Notes
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {rx.medicines.map((med, i) =>
                        <tr key={i}>
                                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                    {med.name}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-500">
                                    {med.dosage} - {med.frequency}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-500">
                                    {med.duration}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-500">
                                    {med.notes || '-'}
                                  </td>
                                </tr>
                        )}
                            </tbody>
                          </table>
                        </div>

                        {rx.status !== 'dispensed' &&
                  <div className="flex justify-end gap-3 pt-2">
                            <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:border-red-200">

                              <XCircleIcon className="w-4 h-4 mr-2" /> Mark
                              Unavailable
                            </Button>
                            <Button
                      size="sm"
                      onClick={() => handleDispenseClick(rx)}>

                              <CheckCircleIcon className="w-4 h-4 mr-2" />{' '}
                              Verify & Dispense
                            </Button>
                          </div>
                  }
                      </div>
                    </motion.div>
              }
                </AnimatePresence>
              </Card>
            </motion.div>
        ) :

        <Card className="p-12 text-center border-dashed">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <PillIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">
              No prescriptions found
            </h3>
            <p className="text-slate-500 mt-1">
              There are no {activeTab.toLowerCase()} prescriptions matching your
              criteria.
            </p>
          </Card>
        }
      </div>

      {/* Dispense Confirmation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isDispensing && setIsModalOpen(false)}
        title="Confirm Dispense"
        maxWidth="md">

        {selectedRx &&
        <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">
                You are about to dispense medicines for:
              </p>
              <p className="font-bold text-blue-900">
                {selectedRx.patientName}
              </p>
              <p className="text-sm text-blue-700">
                Prescription #{selectedRx.id}
              </p>
            </div>
            <p className="text-sm text-slate-600">
              Please confirm that you have verified the prescription details and
              prepared the correct medicines. This action will update the
              inventory stock levels.
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isDispensing}>

                Cancel
              </Button>
              <Button onClick={confirmDispense} isLoading={isDispensing}>
                Confirm Dispense
              </Button>
            </div>
          </div>
        }
      </Modal>
    </div>);

};
