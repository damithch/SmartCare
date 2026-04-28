import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2Icon,
  CreditCardIcon,
  DollarSignIcon,
  FileTextIcon,
  RefreshCwIcon,
  SearchIcon,
  WalletIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAppContext } from '../../context/AppContext';
import { fetchAdminPayments, fetchPaymentReport, reconcilePayments } from '../../services/auth';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';

const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'check', label: 'Check' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' }
];

const paymentStatuses = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' }
];

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

const formatDate = (dateLike) => {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const labelFor = (options, value) => options.find((option) => option.value === value)?.label || value || 'N/A';

const Sparkline = ({ data, color }) => {
  const safeData = Array.isArray(data) && data.length > 1 ? data : [0, 0];
  const max = Math.max(...safeData);
  const min = Math.min(...safeData);
  const range = max - min || 1;
  const points = safeData
    .map((value, index) => {
      const x = (index / (safeData.length - 1)) * 100;
      const y = 30 - ((value - min) / range) * 30;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 -5 100 40" className="h-8 w-16 overflow-visible" preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
};

export const PaymentManagement = () => {
  const { token } = useAppContext();
  const [payments, setPayments] = useState([]);
  const [report, setReport] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [reconciledFilter, setReconciledFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activePaymentId, setActivePaymentId] = useState('');
  const [error, setError] = useState('');

  const loadPayments = async () => {
    if (!token) {
      return;
    }

    try {
      setError('');
      const [paymentData, reportData] = await Promise.all([
        fetchAdminPayments(token, {
          search,
          status: statusFilter,
          paymentMethod: methodFilter,
          reconciled: reconciledFilter
        }),
        fetchPaymentReport(token)
      ]);

      setPayments(Array.isArray(paymentData) ? paymentData : []);
      setReport(reportData || null);
    } catch (err) {
      setError(err.message || 'Failed to load payments');
      setPayments([]);
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    const timeoutId = setTimeout(loadPayments, 250);
    return () => clearTimeout(timeoutId);
  }, [token, search, statusFilter, methodFilter, reconciledFilter]);

  const localTotals = useMemo(() => {
    const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const reconciledAmount = payments
      .filter((payment) => payment.reconciled)
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const unreconciled = payments.filter((payment) => !payment.reconciled);
    const completed = payments.filter((payment) => payment.status === 'completed');

    return {
      totalAmount,
      reconciledAmount,
      unreconciledAmount: totalAmount - reconciledAmount,
      unreconciledCount: unreconciled.length,
      completedCount: completed.length
    };
  }, [payments]);

  const totals = {
    totalTransactions: report?.totalTransactions ?? payments.length,
    totalAmount: report?.totalAmount ?? localTotals.totalAmount,
    totalReconciled: report?.totalReconciled ?? localTotals.reconciledAmount,
    totalUnreconciled: report?.totalUnreconciled ?? localTotals.unreconciledAmount,
    reconciliationRate: report?.reconciliationRate ?? (
      localTotals.totalAmount > 0 ? ((localTotals.reconciledAmount / localTotals.totalAmount) * 100).toFixed(2) : 0
    )
  };

  const stats = [
    {
      label: 'Total Revenue',
      value: formatCurrency(totals.totalAmount),
      icon: DollarSignIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      sparklineData: [0, totals.totalAmount * 0.35, totals.totalAmount * 0.7, totals.totalAmount],
      sparklineColor: '#2563EB'
    },
    {
      label: 'Transactions',
      value: totals.totalTransactions,
      icon: CreditCardIcon,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      sparklineData: [0, Math.max(totals.totalTransactions - 3, 0), totals.totalTransactions],
      sparklineColor: '#059669'
    },
    {
      label: 'Unreconciled',
      value: formatCurrency(totals.totalUnreconciled),
      icon: RefreshCwIcon,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
      sparklineData: [0, totals.totalUnreconciled * 0.4, totals.totalUnreconciled],
      sparklineColor: '#D97706'
    },
    {
      label: 'Reconciliation',
      value: `${Number(totals.reconciliationRate || 0).toFixed(0)}%`,
      icon: CheckCircle2Icon,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      sparklineData: [0, Number(totals.reconciliationRate || 0) / 2, Number(totals.reconciliationRate || 0)],
      sparklineColor: '#9333EA'
    }
  ];

  const methodBreakdown = useMemo(
    () => Object.entries(report?.paymentsByMethod || {}).map(([method, amount]) => ({
      method,
      amount: Number(amount || 0)
    })),
    [report]
  );

  const reconcilePayment = async (payment) => {
    const id = payment._id || payment.id;
    if (!token || !id || payment.reconciled) {
      return;
    }

    setActivePaymentId(id);
    setError('');

    try {
      await reconcilePayments(token, [id], `Reconciled from admin payment management for ${payment.transactionReference || id}`);
      toast.success('Payment reconciled successfully');
      await loadPayments();
    } catch (err) {
      setError(err.message || 'Failed to reconcile payment');
      toast.error(err.message || 'Failed to reconcile payment');
    } finally {
      setActivePaymentId('');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Payment Management</h1>
          <p className="mt-1 font-medium text-slate-500">Monitor revenue, audit transactions, and reconcile payments.</p>
        </div>
        <Badge variant={localTotals.unreconciledCount > 0 ? 'warning' : 'success'} className="px-3 py-1 text-sm font-bold">
          {localTotals.unreconciledCount} unreconciled
        </Badge>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card className="group relative overflow-hidden p-5 transition-colors hover:border-blue-200">
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white to-slate-50 opacity-0 transition-opacity group-hover:opacity-100"></div>
              <div className="mb-4 flex items-start justify-between">
                <div className={`rounded-xl p-2.5 ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <Badge variant="info" className="font-semibold">Live</Badge>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-extrabold tracking-tight text-slate-900">{isLoading ? '--' : stat.value}</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">{stat.label}</p>
                </div>
                <div className="pb-1 opacity-60 transition-opacity group-hover:opacity-100">
                  <Sparkline data={stat.sparklineData} color={stat.sparklineColor} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div variants={itemVariants} className="space-y-4 lg:col-span-2">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Transactions</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                icon={<SearchIcon className="h-4 w-4" />}
                placeholder="Search payments"
                className="min-h-[40px] rounded-lg text-sm"
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                <option value="">All status</option>
                {paymentStatuses.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <select
                value={methodFilter}
                onChange={(event) => setMethodFilter(event.target.value)}
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                <option value="">All methods</option>
                {paymentMethods.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <select
                value={reconciledFilter}
                onChange={(event) => setReconciledFilter(event.target.value)}
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                <option value="">All reconciliation</option>
                <option value="true">Reconciled</option>
                <option value="false">Unreconciled</option>
              </select>
            </div>
          </div>

          <Card className="overflow-hidden p-0 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-[860px] w-full table-fixed divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="w-[26%] px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Reference</th>
                    <th className="w-[24%] px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Patient</th>
                    <th className="w-[14%] px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Amount</th>
                    <th className="w-[14%] px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Method</th>
                    <th className="w-[12%] px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="w-[10%] px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {payments.map((payment) => {
                    const id = payment._id || payment.id;

                    return (
                      <tr key={id} className="transition-colors hover:bg-slate-50">
                        <td className="px-5 py-4 align-middle">
                          <p className="truncate text-sm font-bold text-slate-900">{payment.transactionReference || id}</p>
                          <p className="mt-0.5 text-xs font-medium text-slate-500">{formatDate(payment.createdAt)}</p>
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <p className="truncate text-sm font-bold text-slate-900">{payment.patient?.fullName || 'Patient'}</p>
                          <p className="truncate text-xs font-medium text-slate-500">{payment.patient?.email || payment.bill?.billNumber || 'No email'}</p>
                        </td>
                        <td className="px-5 py-4 align-middle text-sm font-black text-slate-900">{formatCurrency(payment.amount)}</td>
                        <td className="px-5 py-4 align-middle">
                          <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                            {labelFor(paymentMethods, payment.paymentMethod)}
                          </span>
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <div className="space-y-1">
                            <Badge variant={payment.status === 'completed' ? 'success' : payment.status === 'refunded' ? 'warning' : payment.status === 'failed' ? 'danger' : 'info'} className="capitalize font-semibold">
                              {payment.status}
                            </Badge>
                            <div>
                              <Badge variant={payment.reconciled ? 'success' : 'warning'} className="text-[10px] font-bold">
                                {payment.reconciled ? 'Reconciled' : 'Open'}
                              </Badge>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              variant={payment.reconciled ? 'outline' : 'secondary'}
                              disabled={payment.reconciled}
                              isLoading={activePaymentId === id}
                              onClick={() => reconcilePayment(payment)}
                            >
                              <CheckCircle2Icon className="mr-1.5 h-4 w-4" />
                              {payment.reconciled ? 'Done' : 'Reconcile'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {!isLoading && payments.length === 0 && (
              <div className="p-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
                  <FileTextIcon className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No payments found</h3>
                <p className="mt-1 text-sm text-slate-500">Try another filter or wait for new payment activity.</p>
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Payment Overview</h2>
          <Card className="p-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Completed Payments</p>
                  <p className="mt-1 text-2xl font-black text-slate-900">{localTotals.completedCount}</p>
                </div>
                <WalletIcon className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Reconciled Amount</p>
                  <p className="mt-1 text-2xl font-black text-slate-900">{formatCurrency(totals.totalReconciled)}</p>
                </div>
                <CheckCircle2Icon className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">Methods</h3>
              <CreditCardIcon className="h-4 w-4 text-slate-400" />
            </div>
            <div className="space-y-4">
              {methodBreakdown.length > 0 ? methodBreakdown.map((item) => {
                const pct = totals.totalAmount ? Math.round((item.amount / totals.totalAmount) * 100) : 0;

                return (
                  <div key={item.method}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800">{labelFor(paymentMethods, item.method)}</span>
                      <span className="text-xs font-bold text-slate-500">{formatCurrency(item.amount)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-blue-600 transition-all duration-700" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-sm font-medium text-slate-500">No payment method data available.</p>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
