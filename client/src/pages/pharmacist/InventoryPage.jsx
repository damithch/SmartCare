import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  SearchIcon,
  PlusIcon,
  PackageIcon,
  AlertTriangleIcon,
  DollarSignIcon
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { addMedicine, fetchMedicines } from '../../services/auth';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';

const CATEGORY_OPTIONS = [
  'Antibiotic',
  'Antiviral',
  'Painkiller',
  'Antihistamine',
  'Antacid',
  'Vitamin',
  'Supplement',
  'Other'
];

const DOSAGE_OPTIONS = ['Tablet', 'Capsule', 'Liquid', 'Injection', 'Cream', 'Ointment', 'Spray', 'Syrup'];
const UNIT_OPTIONS = ['pieces', 'bottles', 'boxes', 'strips', 'vials'];

const createInitialForm = () => ({
  name: '',
  description: '',
  category: 'Antibiotic',
  dosageForm: 'Tablet',
  strength: '',
  manufacturer: '',
  batchNumber: '',
  manufacturingDate: '',
  expiryDate: '',
  quantity: '',
  unit: 'pieces',
  price: '',
  reorderLevel: ''
});

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

export const InventoryPage = () => {
  const { user, token } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [form, setForm] = useState(createInitialForm());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !token) {
      return;
    }

    let isMounted = true;

    const loadMedicines = async () => {
      setIsLoading(true);
      setError('');

      try {
        const data = await fetchMedicines(token);
        if (isMounted) {
          setMedicines(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load medicines');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadMedicines();

    return () => {
      isMounted = false;
    };
  }, [token, user]);

  const categories = useMemo(
    () => ['All', ...new Set(medicines.map((medicine) => medicine.category).filter(Boolean))],
    [medicines]
  );

  const filteredMedicines = useMemo(
    () => medicines.filter((medicine) => {
      const matchesSearch =
        medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        medicine.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || medicine.category === categoryFilter;
      return matchesSearch && matchesCategory;
    }),
    [categoryFilter, medicines, searchQuery]
  );

  const stats = useMemo(() => {
    const lowStockCount = medicines.filter((medicine) => getMedicineStatus(medicine) === 'low_stock').length;
    const outOfStockCount = medicines.filter((medicine) => getMedicineStatus(medicine) === 'out_of_stock').length;
    const totalValue = medicines.reduce((sum, medicine) => sum + Number(medicine.price || 0) * Number(medicine.quantity || 0), 0);

    return [
      {
        label: 'Total Items',
        value: medicines.length,
        icon: PackageIcon,
        color: 'text-blue-600',
        bg: 'bg-blue-100'
      },
      {
        label: 'Low Stock',
        value: lowStockCount,
        icon: AlertTriangleIcon,
        color: 'text-amber-600',
        bg: 'bg-amber-100'
      },
      {
        label: 'Out of Stock',
        value: outOfStockCount,
        icon: AlertTriangleIcon,
        color: 'text-red-600',
        bg: 'bg-red-100'
      },
      {
        label: 'Total Value',
        value: `$${totalValue.toFixed(2)}`,
        icon: DollarSignIcon,
        color: 'text-emerald-600',
        bg: 'bg-emerald-100'
      }
    ];
  }, [medicines]);

  if (!user) return null;

  const handleFormChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const createdMedicine = await addMedicine(token, {
        ...form,
        quantity: Number(form.quantity),
        price: Number(form.price),
        reorderLevel: Number(form.reorderLevel),
        manufacturingDate: form.manufacturingDate || undefined
      });

      setMedicines((current) => [createdMedicine, ...current]);
      setForm(createInitialForm());
      setIsAddModalOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to add medicine');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="mt-1 text-slate-500">Manage medicines, stock levels, and suppliers.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" /> Add Medicine
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center">
              <div className={`mr-3 rounded-lg p-2 ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                <p className="text-lg font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="flex flex-col gap-4 p-4 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search medicines or suppliers..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Medicine Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Stock Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Unit Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Expiry Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-500">Loading medicines...</td>
                </tr>
              ) : filteredMedicines.map((medicine) => {
                const status = getMedicineStatus(medicine);
                return (
                  <motion.tr key={medicine._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="transition-colors hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="font-medium text-slate-900">{medicine.name}</div>
                      <div className="text-xs text-slate-500">{medicine.manufacturer}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">{medicine.category}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`text-sm font-semibold ${medicine.quantity === 0 ? 'text-red-600' : medicine.quantity <= medicine.reorderLevel ? 'text-amber-600' : 'text-slate-900'}`}>
                        {medicine.quantity} {medicine.unit}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">${Number(medicine.price || 0).toFixed(2)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">{new Date(medicine.expiryDate).toLocaleDateString()}</td>
                    <td className="whitespace-nowrap px-6 py-4">{getStatusBadge(status)}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {!isLoading && filteredMedicines.length === 0 && (
            <div className="p-8 text-center text-slate-500">No medicines found matching your search criteria.</div>
          )}
        </div>
      </Card>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Medicine" maxWidth="2xl">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Medicine Name" value={form.name} onChange={(event) => handleFormChange('name', event.target.value)} required />
            <Input label="Strength" value={form.strength} onChange={(event) => handleFormChange('strength', event.target.value)} placeholder="500mg" required />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 tracking-[0.01em]">Description</label>
            <textarea
              className="w-full min-h-[100px] rounded-2xl border border-slate-300 bg-white/95 px-4 py-3 text-[15px] leading-6 text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              value={form.description}
              onChange={(event) => handleFormChange('description', event.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Select label="Category" options={CATEGORY_OPTIONS.map((value) => ({ value, label: value }))} value={form.category} onChange={(event) => handleFormChange('category', event.target.value)} required />
            <Select label="Dosage Form" options={DOSAGE_OPTIONS.map((value) => ({ value, label: value }))} value={form.dosageForm} onChange={(event) => handleFormChange('dosageForm', event.target.value)} required />
            <Select label="Unit" options={UNIT_OPTIONS.map((value) => ({ value, label: value }))} value={form.unit} onChange={(event) => handleFormChange('unit', event.target.value)} required />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input label="Manufacturer" value={form.manufacturer} onChange={(event) => handleFormChange('manufacturer', event.target.value)} required />
            <Input label="Batch Number" value={form.batchNumber} onChange={(event) => handleFormChange('batchNumber', event.target.value)} required />
            <Input label="Manufacturing Date" type="date" value={form.manufacturingDate} onChange={(event) => handleFormChange('manufacturingDate', event.target.value)} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Input label="Expiry Date" type="date" value={form.expiryDate} onChange={(event) => handleFormChange('expiryDate', event.target.value)} required />
            <Input label="Initial Stock" type="number" value={form.quantity} onChange={(event) => handleFormChange('quantity', event.target.value)} required />
            <Input label="Unit Price ($)" type="number" step="0.01" value={form.price} onChange={(event) => handleFormChange('price', event.target.value)} required />
            <Input label="Reorder Level" type="number" value={form.reorderLevel} onChange={(event) => handleFormChange('reorderLevel', event.target.value)} required />
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSaving}>Add Medicine</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
