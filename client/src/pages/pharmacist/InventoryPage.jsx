import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  SearchIcon,
  PlusIcon,
  EditIcon,
  Trash2Icon,
  PackageIcon,
  AlertTriangleIcon,
  DollarSignIcon } from
'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { mockMedicines } from '../../data/mockData';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';

export const InventoryPage = () => {
  const { user } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  if (!user) return null;
  const categories = [
  'All',
  ...Array.from(new Set(mockMedicines.map((m) => m.category)))];

  const filteredMedicines = mockMedicines.filter((m) => {
    const matchesSearch =
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
    categoryFilter === 'All' || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });
  const getStatusBadge = (status) => {
    switch (status) {
      case 'in_stock':
        return <Badge variant="success">In Stock</Badge>;
      case 'low_stock':
        return <Badge variant="warning">Low Stock</Badge>;
      case 'out_of_stock':
        return <Badge variant="danger">Out of Stock</Badge>;
      case 'expiring_soon':
        return <Badge variant="warning">Expiring Soon</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };
  const stats = [
  {
    label: 'Total Items',
    value: mockMedicines.length,
    icon: PackageIcon,
    color: 'text-blue-600',
    bg: 'bg-blue-100'
  },
  {
    label: 'Low Stock',
    value: mockMedicines.filter((m) => m.status === 'low_stock').length,
    icon: AlertTriangleIcon,
    color: 'text-amber-600',
    bg: 'bg-amber-100'
  },
  {
    label: 'Out of Stock',
    value: mockMedicines.filter((m) => m.status === 'out_of_stock').length,
    icon: AlertTriangleIcon,
    color: 'text-red-600',
    bg: 'bg-red-100'
  },
  {
    label: 'Total Value',
    value: '$12,450',
    icon: DollarSignIcon,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100'
  }];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Inventory Management
          </h1>
          <p className="text-slate-500 mt-1">
            Manage medicines, stock levels, and suppliers.
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <PlusIcon className="w-4 h-4 mr-2" /> Add Medicine
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) =>
        <Card key={index} className="p-4">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color} mr-3`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">
                  {stat.label}
                </p>
                <p className="text-lg font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Filters & Search */}
      <Card className="p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search medicines or suppliers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />

        </div>
        <div className="w-full sm:w-48">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full py-2 px-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white">

            {categories.map((cat) =>
            <option key={cat} value={cat}>
                {cat}
              </option>
            )}
          </select>
        </div>
      </Card>

      {/* Inventory Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Medicine Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Stock Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredMedicines.map((med) =>
              <motion.tr
                key={med.id}
                initial={{
                  opacity: 0
                }}
                animate={{
                  opacity: 1
                }}
                className="hover:bg-slate-50 transition-colors">

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-slate-900">{med.name}</div>
                    <div className="text-xs text-slate-500">{med.supplier}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {med.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                    className={`text-sm font-semibold ${med.stockQty === 0 ? 'text-red-600' : med.stockQty < 50 ? 'text-amber-600' : 'text-slate-900'}`}>

                      {med.stockQty}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    ${med.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(med.expiryDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(med.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3 p-1 rounded hover:bg-blue-50">
                      <EditIcon className="w-4 h-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50">
                      <Trash2Icon className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              )}
            </tbody>
          </table>
          {filteredMedicines.length === 0 &&
          <div className="p-8 text-center text-slate-500">
              No medicines found matching your search criteria.
            </div>
          }
        </div>
      </Card>

      {/* Add Medicine Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Medicine"
        maxWidth="lg">

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setIsAddModalOpen(false);
          }}>

          <Input
            label="Medicine Name"
            required
            placeholder="e.g., Amoxicillin 500mg" />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              options={categories.
              filter((c) => c !== 'All').
              map((c) => ({
                value: c,
                label: c
              }))}
              required />

            <Input label="Supplier" required placeholder="e.g., PharmaCorp" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Initial Stock"
              type="number"
              required
              placeholder="0" />

            <Input
              label="Unit Price ($)"
              type="number"
              step="0.01"
              required
              placeholder="0.00" />

            <Input label="Expiry Date" type="date" required />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsAddModalOpen(false)}>

              Cancel
            </Button>
            <Button type="submit">Add Medicine</Button>
          </div>
        </form>
      </Modal>
    </div>);

};
