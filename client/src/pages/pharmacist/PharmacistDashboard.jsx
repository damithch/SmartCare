import React from 'react';
import { motion } from 'framer-motion';
import {
  PillIcon,
  PackageIcon,
  AlertTriangleIcon,
  ActivityIcon,
  ChevronRightIcon,
  ClockIcon,
  TrendingDownIcon } from
'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { mockPrescriptions, mockMedicines } from '../../data/mockData';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
// Mini Sparkline Component
const Sparkline = ({
  data,
  color,
  className




}) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 30;
  const points = data.
  map((val, i) => {
    const x = i / (data.length - 1) * width;
    const y = height - (val - min) / range * height;
    return `${x},${y}`;
  }).
  join(' ');
  return (
    <svg
      viewBox={`0 -5 ${width} ${height + 10}`}
      className={`w-16 h-8 overflow-visible ${className}`}
      preserveAspectRatio="none">

      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points} />

    </svg>);

};
export const PharmacistDashboard = () => {
  const { user, navigate } = useAppContext();
  if (!user) return null;
  const pendingPrescriptions = mockPrescriptions.filter(
    (p) => p.status === 'pending'
  );
  const lowStockMedicines = mockMedicines.filter(
    (m) => m.status === 'low_stock' || m.status === 'out_of_stock'
  );
  const stats = [
  {
    label: 'Pending Prescriptions',
    value: pendingPrescriptions.length,
    icon: PillIcon,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    trend: '+3',
    trendUp: false,
    sparklineData: [2, 1, 4, 3, 2, 5, pendingPrescriptions.length],
    sparklineColor: '#2563EB'
  },
  {
    label: 'Dispensed Today',
    value: '42',
    icon: ActivityIcon,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
    trend: '+15%',
    trendUp: true,
    sparklineData: [30, 35, 32, 40, 38, 45, 42],
    sparklineColor: '#059669'
  },
  {
    label: 'Low Stock Alerts',
    value: lowStockMedicines.length,
    icon: AlertTriangleIcon,
    color: 'text-amber-600',
    bg: 'bg-amber-100',
    trend: '-1',
    trendUp: true,
    sparklineData: [5, 5, 4, 6, 3, 3, lowStockMedicines.length],
    sparklineColor: '#D97706'
  },
  {
    label: 'Total Medicines',
    value: mockMedicines.length,
    icon: PackageIcon,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
    trend: 'Stable',
    trendUp: true,
    sparklineData: [120, 120, 120, 120, 120, 120, mockMedicines.length],
    sparklineColor: '#9333EA'
  }];

  const containerVariants = {
    hidden: {
      opacity: 0
    },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    show: {
      opacity: 1,
      y: 0
    }
  };
  // Mock data for inventory health
  const topMedicines = mockMedicines.slice(0, 4);
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Pharmacy Operations
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Overview of prescriptions and inventory health.
          </p>
        </div>
        <div className="flex-shrink-0">
          <Button
            onClick={() => navigate('inventory')}
            className="shadow-md shadow-blue-500/20">

            <PackageIcon className="w-4 h-4 mr-2" />
            Manage Inventory
          </Button>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {stats.map((stat, index) =>
        <motion.div key={index} variants={itemVariants}>
            <Card className="p-5 relative overflow-hidden group hover:border-blue-200 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>

              <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div
                className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${stat.trendUp ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>

                  {stat.trend}
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-sm font-medium text-slate-500 mt-1">
                    {stat.label}
                  </p>
                </div>
                <div className="opacity-60 group-hover:opacity-100 transition-opacity pb-1">
                  <Sparkline
                  data={stat.sparklineData}
                  color={stat.sparklineColor} />

                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incoming Prescriptions Queue */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Prescription Queue
            </h2>
            <button
              onClick={() => navigate('prescriptions')}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center transition-colors">

              View Queue <ChevronRightIcon className="w-4 h-4 ml-1" />
            </button>
          </div>

          <div className="space-y-3">
            {pendingPrescriptions.length > 0 ?
            pendingPrescriptions.map((rx, index) => {
              const isUrgent = index === 0; // Mock urgency
              return (
                <Card
                  key={rx.id}
                  className="p-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group relative overflow-hidden"
                  onClick={() => navigate('prescriptions')}>

                    {isUrgent &&
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                  }
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-2">
                      <div className="flex items-start space-x-4">
                        <div
                        className={`p-3 rounded-xl shrink-0 transition-colors ${isUrgent ? 'bg-red-50 text-red-600 group-hover:bg-red-100' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'}`}>

                          <PillIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-slate-900 text-base">
                              {rx.patientName}
                            </h3>
                            {isUrgent &&
                          <Badge
                            variant="danger"
                            className="text-[10px] py-0">

                                Urgent
                              </Badge>
                          }
                          </div>
                          <p className="text-sm font-medium text-slate-600">
                            Dr. {rx.doctorName} • {rx.medicines.length} items
                          </p>
                          <div className="flex items-center mt-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            <ClockIcon className="w-3 h-3 mr-1" />
                            {new Date(rx.date).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 h-full">
                        <Badge
                        variant="warning"
                        className="capitalize font-semibold shadow-sm">

                          Pending
                        </Badge>
                        <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('prescriptions');
                        }}
                        className="shadow-sm">

                          Process Order
                        </Button>
                      </div>
                    </div>
                  </Card>);

            }) :

            <Card className="p-10 text-center border-dashed border-2 bg-slate-50/50">
                <div className="mx-auto w-14 h-14 bg-white shadow-sm rounded-full flex items-center justify-center mb-4">
                  <PillIcon className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  No pending prescriptions
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  All caught up! The queue is empty.
                </p>
              </Card>
            }
          </div>
        </motion.div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Inventory Health */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Inventory Health
            </h2>
            <Card className="p-5">
              <div className="space-y-5">
                {topMedicines.map((med) => {
                  const maxStock = 1000; // Mock max capacity
                  const pct = Math.min(
                    100,
                    Math.max(0, med.stockQty / maxStock * 100)
                  );
                  const isLow =
                  med.status === 'low_stock' || med.status === 'out_of_stock';
                  return (
                    <div key={med.id}>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-bold text-slate-900 truncate pr-2">
                          {med.name}
                        </span>
                        <span
                          className={`text-xs font-bold ${isLow ? 'text-red-600' : 'text-slate-500'}`}>

                          {med.stockQty} units
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${med.stockQty === 0 ? 'bg-red-500' : med.stockQty < 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{
                            width: `${pct}%`
                          }} />

                      </div>
                    </div>);

                })}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  fullWidth
                  size="sm"
                  onClick={() => navigate('inventory')}>

                  View Full Inventory
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Low Stock Alerts */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Action Needed
              </h2>
            </div>

            <Card className="p-0 overflow-hidden border-slate-200 shadow-sm">
              <ul className="divide-y divide-slate-100">
                {lowStockMedicines.map((med) =>
                <li
                  key={med.id}
                  className="p-4 hover:bg-slate-50 transition-colors group">

                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div
                        className={`p-2 rounded-lg ${med.status === 'out_of_stock' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>

                          <AlertTriangleIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                            {med.name}
                          </p>
                          <p className="text-xs font-medium text-slate-500 mt-0.5">
                            {med.stockQty} units remaining
                          </p>
                        </div>
                      </div>
                      <Badge
                      variant={
                      med.status === 'out_of_stock' ? 'danger' : 'warning'
                      }
                      className="text-[10px] capitalize font-bold">

                        {med.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-bold text-blue-600 cursor-pointer hover:underline">
                        Order Restock →
                      </span>
                    </div>
                  </li>
                )}
                {lowStockMedicines.length === 0 &&
                <li className="p-8 text-center flex flex-col items-center justify-center">
                    <PackageIcon className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-sm font-medium text-slate-500">
                      Inventory levels are healthy.
                    </p>
                  </li>
                }
              </ul>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>);

};
