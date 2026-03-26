import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  PackageIcon,
  AlertTriangleIcon,
  ChevronRightIcon,
  TrendingDownIcon,
  DollarSignIcon,
  ActivityIcon
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { fetchLowStockMedicines, fetchMedicines } from '../../services/auth';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const Sparkline = ({ data, color, className }) => {
  const safeData = Array.isArray(data) && data.length > 1 ? data : [0, 0];
  const max = Math.max(...safeData);
  const min = Math.min(...safeData);
  const range = max - min || 1;
  const width = 100;
  const height = 30;
  const points = safeData
    .map((value, index) => {
      const x = (index / (safeData.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 -5 ${width} ${height + 10}`} className={`h-8 w-16 overflow-visible ${className || ''}`} preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
};

const getMedicineStatus = (medicine) => {
  const expiryDate = medicine.expiryDate ? new Date(medicine.expiryDate) : null;
  const now = new Date();
  const soon = new Date();
  soon.setDate(now.getDate() + 30);

  if ((medicine.quantity || 0) <= 0) {
    return 'out_of_stock';
  }
  if (expiryDate && expiryDate <= soon && expiryDate >= now) {
    return 'expiring_soon';
  }
  if ((medicine.quantity || 0) <= (medicine.reorderLevel || 0)) {
    return 'low_stock';
  }
  return 'in_stock';
};

export const PharmacistDashboard = () => {
  const { user, token, navigate } = useAppContext();
  const [medicines, setMedicines] = useState([]);
  const [lowStockMedicines, setLowStockMedicines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !token) {
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      setError('');

      try {
        const [medicineData, lowStockData] = await Promise.all([
          fetchMedicines(token),
          fetchLowStockMedicines(token)
        ]);

        if (!isMounted) {
          return;
        }

        setMedicines(Array.isArray(medicineData) ? medicineData : []);
        setLowStockMedicines(Array.isArray(lowStockData) ? lowStockData : []);
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load pharmacist dashboard');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [token, user]);

  if (!user) return null;

  const totalValue = medicines.reduce((sum, medicine) => sum + Number(medicine.price || 0) * Number(medicine.quantity || 0), 0);
  const expiringSoonCount = medicines.filter((medicine) => getMedicineStatus(medicine) === 'expiring_soon').length;
  const topMedicines = medicines.slice(0, 4);

  const stats = [
    {
      label: 'Total Medicines',
      value: medicines.length,
      icon: PackageIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      trend: 'Live',
      trendUp: true,
      sparklineData: [0, 1, Math.max(medicines.length - 2, 0), Math.max(medicines.length - 1, 0), medicines.length],
      sparklineColor: '#2563EB'
    },
    {
      label: 'Inventory Value',
      value: `$${totalValue.toFixed(2)}`,
      icon: DollarSignIcon,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      trend: 'Current',
      trendUp: true,
      sparklineData: [0, totalValue * 0.4, totalValue * 0.6, totalValue * 0.8, totalValue],
      sparklineColor: '#059669'
    },
    {
      label: 'Low Stock Alerts',
      value: lowStockMedicines.length,
      icon: AlertTriangleIcon,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
      trend: `${lowStockMedicines.length}`,
      trendUp: lowStockMedicines.length === 0,
      sparklineData: [0, Math.max(lowStockMedicines.length - 1, 0), lowStockMedicines.length, lowStockMedicines.length],
      sparklineColor: '#D97706'
    },
    {
      label: 'Expiring Soon',
      value: expiringSoonCount,
      icon: ActivityIcon,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      trend: `${expiringSoonCount}`,
      trendUp: expiringSoonCount === 0,
      sparklineData: [0, Math.max(expiringSoonCount - 1, 0), expiringSoonCount, expiringSoonCount],
      sparklineColor: '#9333EA'
    }
  ];

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl tracking-tight text-slate-900 sm:text-3xl font-bold">Pharmacy Operations</h1>
          <p className="mt-1 font-medium text-slate-500">Overview of medicine uploads and inventory health.</p>
        </div>
        <div className="flex-shrink-0">
          <Button onClick={() => navigate('inventory')} className="shadow-md shadow-blue-500/20">
            <PackageIcon className="mr-2 h-4 w-4" />
            Manage Inventory
          </Button>
        </div>
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
                <div className={`flex items-center rounded-full px-2 py-1 text-xs font-bold ${stat.trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {stat.trend}
                </div>
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Recently Uploaded Medicines</h2>
            <button onClick={() => navigate('inventory')} className="flex items-center text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700">
              View Inventory <ChevronRightIcon className="ml-1 h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {topMedicines.length > 0 ? (
              topMedicines.map((medicine) => (
                <Card key={medicine._id} className="group relative cursor-pointer overflow-hidden p-4 transition-all hover:border-blue-200 hover:shadow-md" onClick={() => navigate('inventory')}>
                  <div className="flex flex-col gap-4 pl-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="shrink-0 rounded-xl bg-blue-50 p-3 text-blue-600 transition-colors group-hover:bg-blue-100">
                        <PackageIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{medicine.name}</h3>
                        <p className="text-sm font-medium text-slate-600">{medicine.category} • {medicine.manufacturer}</p>
                        <div className="mt-2 flex items-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                          {medicine.strength} • {medicine.quantity} {medicine.unit}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                      {(() => {
                        const status = getMedicineStatus(medicine);
                        return <Badge variant={status === 'in_stock' ? 'success' : status === 'out_of_stock' ? 'danger' : 'warning'} className="capitalize font-semibold">{status.replace('_', ' ')}</Badge>;
                      })()}
                      <span className="text-sm font-semibold text-slate-700">${Number(medicine.price || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="border-dashed border-2 bg-slate-50/50 p-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                  <PackageIcon className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No medicines uploaded yet</h3>
                <p className="mt-1 text-sm text-slate-500">Add medicine records from Inventory Management.</p>
              </Card>
            )}
          </div>
        </motion.div>

        <div className="space-y-6">
          <motion.div variants={itemVariants} className="space-y-4">
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Inventory Health</h2>
            <Card className="p-5">
              <div className="space-y-5">
                {topMedicines.length > 0 ? topMedicines.map((medicine) => {
                  const maxStock = Math.max(medicine.reorderLevel * 4, medicine.quantity || 1, 1);
                  const pct = Math.min(100, Math.max(0, (medicine.quantity / maxStock) * 100));
                  const status = getMedicineStatus(medicine);
                  const isLow = status === 'low_stock' || status === 'out_of_stock';

                  return (
                    <div key={medicine._id}>
                      <div className="mb-2 flex items-end justify-between">
                        <span className="truncate pr-2 text-sm font-bold text-slate-900">{medicine.name}</span>
                        <span className={`text-xs font-bold ${isLow ? 'text-red-600' : 'text-slate-500'}`}>{medicine.quantity} units</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full transition-all duration-1000 ${status === 'out_of_stock' ? 'bg-red-500' : status === 'low_stock' ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                }) : <p className="text-sm text-slate-500">No inventory data yet.</p>}
              </div>
              <div className="mt-6 border-t border-slate-100 pt-4">
                <Button variant="outline" fullWidth size="sm" onClick={() => navigate('inventory')}>View Full Inventory</Button>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight text-slate-900">Action Needed</h2>
            </div>

            <Card className="overflow-hidden border-slate-200 p-0 shadow-sm">
              <ul className="divide-y divide-slate-100">
                {lowStockMedicines.map((medicine) => {
                  const status = getMedicineStatus(medicine);
                  return (
                    <li key={medicine._id} className="group p-4 transition-colors hover:bg-slate-50">
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`rounded-lg p-2 ${status === 'out_of_stock' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                            <AlertTriangleIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-blue-600">{medicine.name}</p>
                            <p className="mt-0.5 text-xs font-medium text-slate-500">{medicine.quantity} units remaining</p>
                          </div>
                        </div>
                        <Badge variant={status === 'out_of_stock' ? 'danger' : 'warning'} className="text-[10px] font-bold capitalize">{status.replace('_', ' ')}</Badge>
                      </div>
                      <div className="mt-2 flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="cursor-pointer text-xs font-bold text-blue-600 hover:underline" onClick={() => navigate('inventory')}>
                          Update Stock ?
                        </span>
                      </div>
                    </li>
                  );
                })}
                {lowStockMedicines.length === 0 && (
                  <li className="flex flex-col items-center justify-center p-8 text-center">
                    <PackageIcon className="mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">Inventory levels are healthy.</p>
                  </li>
                )}
              </ul>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
