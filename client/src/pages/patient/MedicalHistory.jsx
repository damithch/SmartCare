import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileTextIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PillIcon,
  StethoscopeIcon } from
'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { mockConsultations } from '../../data/mockData';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
export const MedicalHistory = () => {
  const { user } = useAppContext();
  const [expandedId, setExpandedId] = useState(null);
  if (!user) return null;
  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Medical History</h1>
        <p className="text-slate-500 mt-1">
          Your past consultations, diagnoses, and prescriptions.
        </p>
      </div>

      <div className="relative border-l-2 border-blue-100 pl-6 ml-4 space-y-8 py-4">
        {mockConsultations.map((record, index) =>
        <motion.div
          key={record.id}
          initial={{
            opacity: 0,
            x: -20
          }}
          animate={{
            opacity: 1,
            x: 0
          }}
          transition={{
            delay: index * 0.1
          }}
          className="relative">

            {/* Timeline Dot */}
            <div className="absolute -left-[35px] top-6 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white" />

            <Card className="overflow-hidden transition-all duration-300">
              {/* Header (Always visible) */}
              <div
              className="p-5 cursor-pointer hover:bg-slate-50 transition-colors flex items-start justify-between"
              onClick={() => toggleExpand(record.id)}>

                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <span className="text-sm font-bold text-blue-600">
                      {new Date(record.date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    </span>
                    <Badge variant="default" className="text-xs">
                      {record.doctorName}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    {record.diagnosis}
                  </h3>
                </div>
                <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                  {expandedId === record.id ?
                <ChevronUpIcon className="w-5 h-5" /> :

                <ChevronDownIcon className="w-5 h-5" />
                }
                </button>
              </div>

              {/* Expanded Content */}
              <AnimatePresence>
                {expandedId === record.id &&
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

                    <div className="p-5 space-y-6">
                      {/* Consultation Notes */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 flex items-center mb-2">
                          <StethoscopeIcon className="w-4 h-4 mr-2 text-slate-500" />
                          Consultation Notes
                        </h4>
                        <p className="text-sm text-slate-600 bg-white p-4 rounded-lg border border-slate-200 leading-relaxed">
                          {record.notes}
                        </p>
                      </div>

                      {/* Prescriptions */}
                      {record.medicines && record.medicines.length > 0 &&
                  <div>
                          <h4 className="text-sm font-semibold text-slate-900 flex items-center mb-2">
                            <PillIcon className="w-4 h-4 mr-2 text-slate-500" />
                            Prescribed Medicines
                          </h4>
                          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
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
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {record.medicines.map((med, i) =>
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
                                  </tr>
                          )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                  }
                    </div>
                  </motion.div>
              }
              </AnimatePresence>
            </Card>
          </motion.div>
        )}
      </div>
    </div>);

};
