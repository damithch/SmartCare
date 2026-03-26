import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  HeartPulseIcon,
  MailIcon,
  LockIcon,
  UserIcon,
  CameraIcon,
  ActivityIcon,
  ShieldCheckIcon,
  StethoscopeIcon
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useAppContext } from '../../context/AppContext';
import { registerUser } from '../../services/auth';

const roleOptions = [
  { value: 'patient', label: 'Patient' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'pharmacist', label: 'Pharmacist' }
];

export const RegisterPage = () => {
  const { login, navigate } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'patient',
    password: ''
  });

  const handleChange = (field) => (e) => {
    setFormData((current) => ({
      ...current,
      [field]: e.target.value
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const session = await registerUser({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role
      });
      login(session);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const floatVariants = {
    animate: (custom) => ({
      y: [0, -20, 0],
      transition: {
        duration: 4 + custom,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: custom * 0.5
      }
    })
  };

  return (
    <div className="min-h-screen flex w-full bg-white">
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 flex-col justify-between p-12">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }}
        />

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            custom={1}
            variants={floatVariants}
            animate="animate"
            className="absolute top-[20%] left-[15%] opacity-20"
          >
            <HeartPulseIcon className="w-24 h-24 text-teal-400" />
          </motion.div>
          <motion.div
            custom={2}
            variants={floatVariants}
            animate="animate"
            className="absolute top-[60%] left-[10%] opacity-10"
          >
            <ActivityIcon className="w-32 h-32 text-blue-400" />
          </motion.div>
          <motion.div
            custom={3}
            variants={floatVariants}
            animate="animate"
            className="absolute top-[30%] right-[20%] opacity-15"
          >
            <ShieldCheckIcon className="w-20 h-20 text-teal-300" />
          </motion.div>
          <motion.div
            custom={1.5}
            variants={floatVariants}
            animate="animate"
            className="absolute bottom-[20%] right-[15%] opacity-20"
          >
            <StethoscopeIcon className="w-28 h-28 text-blue-300" />
          </motion.div>

          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 flex items-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 mr-3">
            <HeartPulseIcon className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">
            SmartCare
          </span>
        </div>

        <div className="relative z-10 max-w-xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6"
          >
            Join the Future of
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-blue-400">
              Healthcare.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-teal-100/80 leading-relaxed mb-10 max-w-md"
          >
            Create a patient, doctor, or pharmacist account and start using the
            SmartCare platform with real authentication.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-3"
          >
            <div className="flex items-center text-teal-100/90">
              <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center mr-3">
                <div className="w-2 h-2 rounded-full bg-teal-400" />
              </div>
              Choose the right role from the start
            </div>
            <div className="flex items-center text-teal-100/90">
              <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center mr-3">
                <div className="w-2 h-2 rounded-full bg-teal-400" />
              </div>
              Sign in immediately after registration
            </div>
            <div className="flex items-center text-teal-100/90">
              <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center mr-3">
                <div className="w-2 h-2 rounded-full bg-teal-400" />
              </div>
              Move straight into your dashboard
            </div>
          </motion.div>
        </div>

        <div className="h-10" />
      </div>

      <div className="w-full md:w-1/2 lg:w-[45%] flex flex-col justify-center items-center p-6 sm:p-12 bg-slate-50 relative overflow-y-auto">
        <div className="md:hidden absolute top-8 left-6 flex items-center">
          <HeartPulseIcon className="h-8 w-8 text-blue-600 mr-2" />
          <span className="text-xl font-bold text-slate-900">SmartCare</span>
        </div>

        <div className="w-full max-w-md py-12 md:py-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8 text-center md:text-left">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                Create Account
              </h2>
              <p className="text-slate-500">
                Register as a patient, doctor, or pharmacist.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleRegister}>
              <div className="flex justify-center md:justify-start mb-6">
                <div className="relative h-20 w-20 rounded-full bg-white border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group shadow-sm">
                  <CameraIcon className="h-6 w-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <div className="absolute -bottom-2 bg-white px-2 text-[10px] font-medium text-slate-500 rounded-full border border-slate-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    Upload
                  </div>
                </div>
              </div>

              <Input
                label="Full Name"
                required
                value={formData.fullName}
                onChange={handleChange('fullName')}
                icon={<UserIcon className="h-5 w-5" />}
                placeholder="John Doe"
                className="h-11 bg-white"
              />

              <Input
                label="Email address"
                type="email"
                required
                value={formData.email}
                onChange={handleChange('email')}
                icon={<MailIcon className="h-5 w-5" />}
                placeholder="john@example.com"
                className="h-11 bg-white"
              />

              <Select
                label="Account Type"
                value={formData.role}
                onChange={handleChange('role')}
                options={roleOptions}
                className="h-11 bg-white"
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange('password')}
                  icon={<LockIcon className="h-5 w-5" />}
                  placeholder="........"
                  className="h-11 bg-white"
                />

                <button
                  type="button"
                  className="absolute right-3 top-[32px] text-slate-400 hover:text-slate-600 text-sm font-medium"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
                className="h-12 text-base mt-4 shadow-md shadow-blue-500/20"
              >
                Create Account
              </Button>

              {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-600">
                Already have an account?{' '}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('login');
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Sign in
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
