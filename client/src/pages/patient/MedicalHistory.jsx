import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileTextIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PillIcon,
  StethoscopeIcon
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { fetchPatientMedicalRecords } from '../../services/auth';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

const formatRecordDate = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getDiagnosisLabel = (record) => {
  if (record.diagnoses?.length) {
    return record.diagnoses[0].title;
  }

  if (record.visitReason) {
    return record.visitReason;
  }

  return 'Medical consultation';
};

export const MedicalHistory = () => {
  const { user, token } = useAppContext();
  const [expandedId, setExpandedId] = useState(null);
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !token) {
      return undefined;
    }

    let isMounted = true;

    const loadRecords = async () => {
      try {
        if (isMounted) {
          setIsLoading(true);
          setError('');
        }

        const data = await fetchPatientMedicalRecords(token, user.id);

        if (isMounted) {
          setRecords(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load medical history');
          setRecords([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRecords();

    return () => {
      isMounted = false;
    };
  }, [token, user]);

  const orderedRecords = useMemo(
    () => [...records].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [records]
  );

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Medical History</h1>
        <p className="mt-1 text-slate-500">Your past consultations, diagnoses, and prescriptions.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {isLoading ? (
        <Card className="p-10 text-center">
          <FileTextIcon className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <h2 className="text-lg font-semibold text-slate-900">Loading medical history</h2>
          <p className="mt-1 text-sm text-slate-500">Fetching your completed records.</p>
        </Card>
      ) : orderedRecords.length > 0 ? (
        <div className="relative ml-4 space-y-8 border-l-2 border-blue-100 py-4 pl-6">
          {orderedRecords.map((record, index) => (
            <motion.div
              key={record._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative"
            >
              <div className="absolute -left-[35px] top-6 h-4 w-4 rounded-full bg-blue-600 ring-4 ring-white" />

              <Card className="overflow-hidden transition-all duration-300">
                <div
                  className="flex cursor-pointer items-start justify-between p-5 transition-colors hover:bg-slate-50"
                  onClick={() => setExpandedId(expandedId === record._id ? null : record._id)}
                >
                  <div>
                    <div className="mb-1 flex items-center space-x-3">
                      <span className="text-sm font-bold text-blue-600">{formatRecordDate(record.createdAt)}</span>
                      <Badge variant="default" className="text-xs">
                        {record.doctor?.fullName || 'Doctor'}
                      </Badge>
                    </div>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">{getDiagnosisLabel(record)}</h3>
                  </div>
                  <button className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                    {expandedId === record._id ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                  </button>
                </div>

                <AnimatePresence>
                  {expandedId === record._id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100 bg-slate-50/50"
                    >
                      <div className="space-y-6 p-5">
                        <div>
                          <h4 className="mb-2 flex items-center text-sm font-semibold text-slate-900">
                            <StethoscopeIcon className="mr-2 h-4 w-4 text-slate-500" />
                            Consultation Notes
                          </h4>
                          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
                            {record.symptoms && (
                              <p>
                                <span className="font-semibold text-slate-900">Symptoms:</span> {record.symptoms}
                              </p>
                            )}
                            {record.notes && (
                              <p>
                                <span className="font-semibold text-slate-900">Notes:</span> {record.notes}
                              </p>
                            )}
                            {record.diagnoses?.length > 0 && (
                              <div>
                                <p className="font-semibold text-slate-900">Diagnoses:</p>
                                <ul className="mt-2 space-y-2">
                                  {record.diagnoses.map((diagnosis, diagnosisIndex) => (
                                    <li key={`${record._id}-diagnosis-${diagnosisIndex}`}>
                                      <span className="font-medium text-slate-900">{diagnosis.title}</span>
                                      {diagnosis.description ? `: ${diagnosis.description}` : ''}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>

                        {record.prescriptions?.length > 0 && (
                          <div>
                            <h4 className="mb-2 flex items-center text-sm font-semibold text-slate-900">
                              <PillIcon className="mr-2 h-4 w-4 text-slate-500" />
                              Prescribed Medicines
                            </h4>
                            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                              <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                                      Medicine
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                                      Dosage
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                                      Duration
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                  {record.prescriptions.map((prescription, prescriptionIndex) => (
                                    <tr key={`${record._id}-prescription-${prescriptionIndex}`}>
                                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{prescription.medicineName}</td>
                                      <td className="px-4 py-3 text-sm text-slate-500">
                                        {prescription.dosage} - {prescription.frequency}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-slate-500">{prescription.duration}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="p-10 text-center">
          <FileTextIcon className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <h2 className="text-lg font-semibold text-slate-900">No medical history yet</h2>
          <p className="mt-1 text-sm text-slate-500">Completed consultation records will appear here.</p>
        </Card>
      )}
    </div>
  );
};
