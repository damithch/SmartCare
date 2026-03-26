import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  HeartPulseIcon,
  MailIcon,
  LockIcon,
  ActivityIcon,
  ShieldCheckIcon,
  StethoscopeIcon
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAppContext } from '../../context/AppContext';
import { loginUser } from '../../services/auth';

export const LoginPage = () => {
  const { login, navigate } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const session = await loginUser({
        email: email.trim(),
        password
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
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex-col justify-between p-12">
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
            <HeartPulseIcon className="w-24 h-24 text-blue-400" />
          </motion.div>
          <motion.div
            custom={2}
            variants={floatVariants}
            animate="animate"
            className="absolute top-[60%] left-[10%] opacity-10"
          >
            <ActivityIcon className="w-32 h-32 text-teal-400" />
          </motion.div>
          <motion.div
            custom={3}
            variants={floatVariants}
            animate="animate"
            className="absolute top-[30%] right-[20%] opacity-15"
          >
            <ShieldCheckIcon className="w-20 h-20 text-blue-300" />
          </motion.div>
          <motion.div
            custom={1.5}
            variants={floatVariants}
            animate="animate"
            className="absolute bottom-[20%] right-[15%] opacity-20"
          >
            <StethoscopeIcon className="w-28 h-28 text-teal-300" />
          </motion.div>

          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-[100px]" />
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
            Transforming Healthcare,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
              One Click at a Time.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-blue-100/80 leading-relaxed mb-10 max-w-md"
          >
            The premium platform connecting patients, doctors, and pharmacies in
            one seamless, intelligent ecosystem.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center space-x-4"
          >
            <div className="flex -space-x-3">
              <img
                className="w-10 h-10 rounded-full border-2 border-slate-900 object-cover"
                src="https://i.pravatar.cc/150?img=32"
                alt="User"
              />
              <img
                className="w-10 h-10 rounded-full border-2 border-slate-900 object-cover"
                src="https://i.pravatar.cc/150?img=12"
                alt="User"
              />
              <img
                className="w-10 h-10 rounded-full border-2 border-slate-900 object-cover"
                src="https://i.pravatar.cc/150?img=68"
                alt="User"
              />
            </div>
            <div className="text-sm">
              <p className="text-white font-medium">Trusted by 500+ hospitals</p>
              <p className="text-blue-200/70">
                Join 2,400+ healthcare professionals
              </p>
            </div>
          </motion.div>
        </div>

        <div className="h-10" />
      </div>

      <div className="w-full md:w-1/2 lg:w-[45%] flex flex-col justify-center items-center p-6 sm:p-12 bg-slate-50 relative">
        <div className="md:hidden absolute top-8 left-6 flex items-center">
          <HeartPulseIcon className="h-8 w-8 text-blue-600 mr-2" />
          <span className="text-xl font-bold text-slate-900">SmartCare</span>
        </div>

        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-10 text-center md:text-left">
              <div className="hidden md:inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600 mb-6">
                <LockIcon className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                Welcome back
              </h2>
              <p className="text-slate-500">
                Sign in to your SmartCare account to continue.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleLogin}>
              <Input
                label="Email address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<MailIcon className="h-5 w-5" />}
                placeholder="name@example.com"
                className="h-12 bg-white"
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<LockIcon className="h-5 w-5" />}
                  placeholder="........"
                  className="h-12 bg-white"
                />

                <button
                  type="button"
                  className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 text-sm font-medium"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded transition-colors cursor-pointer"
                  />

                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-slate-600 cursor-pointer"
                  >
                    Remember me
                  </label>
                </div>

                <a
                  href="#"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
                className="h-12 text-base mt-2 shadow-md shadow-blue-500/20"
              >
                Sign In
              </Button>

              {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-slate-50 text-slate-500 font-medium">
                    New to SmartCare?
                  </span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('register');
                  }}
                  className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                >
                  Create an account
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
