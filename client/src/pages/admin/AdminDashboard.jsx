import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ActivityIcon,
  CheckCircle2Icon,
  ClockIcon,
  SearchIcon,
  ShieldCheckIcon,
  StethoscopeIcon,
  UserCogIcon,
  UserPlusIcon,
  UsersIcon,
  XCircleIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAppContext } from '../../context/AppContext';
import {
  createManagedUser,
  deactivateManagedUser,
  fetchUsers,
  updateManagedUser
} from '../../services/auth';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

const roleOptions = [
  { value: 'patient', label: 'Patient' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'pharmacist', label: 'Pharmacist' },
  { value: 'admin', label: 'Admin' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'staff', label: 'Staff' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'billing_staff', label: 'Billing Staff' }
];

const statusOptions = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' }
];

const roleVisuals = {
  admin: 'bg-purple-50 text-purple-700 border-purple-100',
  system_admin: 'bg-purple-50 text-purple-700 border-purple-100',
  doctor: 'bg-blue-50 text-blue-700 border-blue-100',
  nurse: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  pharmacist: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  patient: 'bg-amber-50 text-amber-700 border-amber-100',
  receptionist: 'bg-pink-50 text-pink-700 border-pink-100',
  billing_staff: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  staff: 'bg-slate-50 text-slate-700 border-slate-100'
};

const emptyForm = {
  fullName: '',
  email: '',
  password: '',
  role: 'patient'
};

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

const roleLabel = (role) => roleOptions.find((option) => option.value === role)?.label || role || 'User';

const getInitials = (name) =>
  String(name || 'User')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';

const formatDate = (dateLike) => {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

export const AdminDashboard = () => {
  const { currentPage, user, token } = useAppContext();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeUserId, setActiveUserId] = useState('');
  const [error, setError] = useState('');

  const loadUsers = async () => {
    if (!token) {
      return;
    }

    try {
      setError('');
      const data = await fetchUsers(token, { search, role: roleFilter, isActive: statusFilter });
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    const timeoutId = setTimeout(loadUsers, 250);
    return () => clearTimeout(timeoutId);
  }, [token, search, roleFilter, statusFilter]);

  const counts = useMemo(() => {
    const active = users.filter((item) => item.isActive).length;
    const inactive = users.length - active;
    const admins = users.filter((item) => item.role === 'admin').length;
    const clinical = users.filter((item) => ['doctor', 'nurse', 'pharmacist'].includes(item.role)).length;
    return { active, inactive, admins, clinical };
  }, [users]);

  const roleBreakdown = useMemo(
    () => roleOptions
      .map((option) => ({
        ...option,
        count: users.filter((item) => item.role === option.value).length
      }))
      .filter((option) => option.count > 0),
    [users]
  );

  const recentUsers = useMemo(
    () => [...users]
      .sort((left, right) => new Date(right.createdAt || right.updatedAt || 0) - new Date(left.createdAt || left.updatedAt || 0))
      .slice(0, 4),
    [users]
  );
  const isUserManagementPage = currentPage === 'user-management';

  const stats = [
    {
      label: 'Total Users',
      value: users.length,
      icon: UsersIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      sparklineData: [0, Math.max(users.length - 3, 0), Math.max(users.length - 1, 0), users.length],
      sparklineColor: '#2563EB'
    },
    {
      label: 'Active Accounts',
      value: counts.active,
      icon: CheckCircle2Icon,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      sparklineData: [0, Math.max(counts.active - 2, 0), counts.active],
      sparklineColor: '#059669'
    },
    {
      label: 'Clinical Staff',
      value: counts.clinical,
      icon: UserCogIcon,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
      sparklineData: [0, Math.max(counts.clinical - 1, 0), counts.clinical],
      sparklineColor: '#D97706'
    },
    {
      label: 'Admins',
      value: counts.admins,
      icon: ShieldCheckIcon,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      sparklineData: [0, counts.admins, counts.admins],
      sparklineColor: '#9333EA'
    }
  ];

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token) {
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      if (editingId) {
        const payload = {
          fullName: form.fullName,
          email: form.email,
          role: form.role
        };

        if (form.password) {
          payload.password = form.password;
        }

        await updateManagedUser(token, editingId, payload);
        toast.success('User updated successfully');
      } else {
        await createManagedUser(token, form);
        toast.success('User created successfully');
      }

      resetForm();
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to save user');
      toast.error(err.message || 'Failed to save user');
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id || item.id);
    setForm({
      fullName: item.fullName || item.name || '',
      email: item.email || '',
      password: '',
      role: item.role || 'patient'
    });
  };

  const toggleStatus = async (item) => {
    const id = item._id || item.id;
    if (!token || !id || id === user?.id) {
      return;
    }

    setActiveUserId(id);
    setError('');

    try {
      if (item.isActive) {
        await deactivateManagedUser(token, id);
        toast.success('User deactivated');
      } else {
        await updateManagedUser(token, id, { isActive: true });
        toast.success('User activated');
      }

      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to update user status');
      toast.error(err.message || 'Failed to update user status');
    } finally {
      setActiveUserId('');
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
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-950 p-6 shadow-sm">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'linear-gradient(rgba(148,163,184,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.16) 1px, transparent 1px)',
            backgroundSize: '28px 28px'
          }}
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-200">
              <ShieldCheckIcon className="h-4 w-4" />
              SmartCare Access Control
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              {isUserManagementPage ? 'User Management' : 'Admin Dashboard'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-300 sm:text-base">
              {isUserManagementPage
                ? 'Create, update, activate, and deactivate SmartCare user accounts.'
                : 'Manage SmartCare users, roles, and account access from one operational command center.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active</p>
              <p className="mt-1 text-2xl font-black text-white">{isLoading ? '--' : counts.active}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Inactive</p>
              <p className="mt-1 text-2xl font-black text-white">{isLoading ? '--' : counts.inactive}</p>
            </div>
            <Button onClick={() => document.getElementById('admin-user-form')?.scrollIntoView({ behavior: 'smooth' })} className="col-span-2 h-12 shadow-md shadow-blue-500/20 sm:col-span-1">
              <UserPlusIcon className="mr-2 h-4 w-4" />
              New User
            </Button>
          </div>
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold tracking-tight text-slate-900">User Management</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                icon={<SearchIcon className="h-4 w-4" />}
                placeholder="Search users"
                className="min-h-[40px] rounded-lg text-sm"
              />
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                <option value="">All roles</option>
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                <option value="">All status</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <Card className="overflow-hidden p-0 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full table-fixed divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="w-[42%] px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">User</th>
                    <th className="w-[18%] px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Role</th>
                    <th className="w-[16%] px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="w-[24%] px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {users.map((item) => {
                    const id = item._id || item.id;
                    const isSelf = id === user?.id;
                    return (
                      <tr key={id} className="transition-colors hover:bg-slate-50">
                        <td className="px-5 py-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-black ${roleVisuals[item.role] || roleVisuals.staff}`}>
                              {getInitials(item.fullName)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-900">{item.fullName || 'User'}</p>
                              <p className="truncate text-xs font-medium text-slate-500">{item.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${roleVisuals[item.role] || roleVisuals.staff}`}>
                            {roleLabel(item.role)}
                          </span>
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <Badge variant={item.isActive ? 'success' : 'danger'} className="font-semibold">
                            {item.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <div className="flex justify-end gap-2 whitespace-nowrap">
                            <Button variant="outline" size="sm" onClick={() => startEdit(item)}>Edit</Button>
                            <Button
                              variant={item.isActive ? 'danger' : 'secondary'}
                              size="sm"
                              disabled={isSelf}
                              isLoading={activeUserId === id}
                              onClick={() => toggleStatus(item)}
                            >
                              {item.isActive ? <XCircleIcon className="mr-1.5 h-4 w-4" /> : <CheckCircle2Icon className="mr-1.5 h-4 w-4" />}
                              <span className="hidden xl:inline">{item.isActive ? 'Deactivate' : 'Activate'}</span>
                              <span className="xl:hidden">{item.isActive ? 'Off' : 'On'}</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {!isLoading && users.length === 0 && (
              <div className="p-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
                  <UsersIcon className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No users found</h3>
                <p className="mt-1 text-sm text-slate-500">Try another search or create a new user.</p>
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Access Overview</h2>
          <Card className="p-5">
            <div className="space-y-5">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Clinical Coverage</p>
                  <p className="mt-1 text-2xl font-black text-slate-900">{counts.clinical}</p>
                </div>
                <StethoscopeIcon className="h-5 w-5 text-blue-500" />
              </div>

              <div className="space-y-3">
                {roleBreakdown.length > 0 ? roleBreakdown.map((item) => {
                  const pct = users.length ? Math.round((item.count / users.length) * 100) : 0;

                  return (
                    <div key={item.value}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-800">{item.label}</span>
                        <span className="text-xs font-bold text-slate-500">{item.count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-blue-600 transition-all duration-700" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-sm font-medium text-slate-500">No role data available yet.</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">Recent Accounts</h3>
                <ActivityIcon className="h-4 w-4 text-slate-400" />
              </div>
            </div>
            <ul className="divide-y divide-slate-100">
              {recentUsers.map((item) => (
                <li key={item._id || item.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xs font-black ${roleVisuals[item.role] || roleVisuals.staff}`}>
                      {getInitials(item.fullName)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{item.fullName || 'User'}</p>
                      <p className="truncate text-xs font-medium text-slate-500">{roleLabel(item.role)}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-slate-400">
                    <ClockIcon className="h-3.5 w-3.5" />
                    {formatDate(item.createdAt || item.updatedAt)}
                  </div>
                </li>
              ))}
              {!isLoading && recentUsers.length === 0 && (
                <li className="p-5 text-sm font-medium text-slate-500">No recent account activity.</li>
              )}
            </ul>
          </Card>

          <h2 className="text-lg font-bold tracking-tight text-slate-900">{editingId ? 'Edit User' : 'Create User'}</h2>
          <Card className="p-5">
            <form id="admin-user-form" className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Full name"
                required
                value={form.fullName}
                onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                placeholder="Enter full name"
              />
              <Input
                label="Email address"
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="name@example.com"
              />
              <Input
                label={editingId ? 'New password' : 'Password'}
                type="password"
                required={!editingId}
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder={editingId ? 'Leave blank to keep current' : 'Minimum 6 characters'}
              />
              <Select
                label="Role"
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                options={roleOptions}
              />

              <div className="flex gap-3 pt-2">
                <Button type="submit" fullWidth isLoading={isSaving}>
                  {editingId ? 'Save Changes' : 'Create User'}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
