import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CameraIcon, SaveIcon, ShieldIcon, UserIcon } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { fetchMyProfile, updateMyProfile } from '../../services/auth';

const getProfileState = (user) => ({
  fullName: user?.fullName || user?.name || '',
  email: user?.email || '',
  phone: user?.phone || '',
  studentId: user?.studentId || '',
  department: user?.department || '',
  level: user?.level || '',
  bio: user?.bio || '',
  avatar: user?.avatar || '',
  coverImage: user?.coverImage || '',
  password: '',
  confirmPassword: ''
});

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });

export const ProfilePage = () => {
  const { user, token, updateUser } = useAppContext();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [formData, setFormData] = useState(getProfileState(user));

  useEffect(() => {
    if (!user || !token) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      setError('');

      try {
        const profile = await fetchMyProfile(token);
        if (!isMounted) {
          return;
        }

        updateUser(profile);
        setFormData((current) => ({
          ...current,
          ...getProfileState(profile)
        }));
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [token]);

  if (!user) return null;

  const displayName = formData.fullName || user.fullName || user.name || 'User';
  const isStudent = user.role === 'student';

  const handleChange = (field) => (e) => {
    setFormData((current) => ({
      ...current,
      [field]: e.target.value
    }));
  };

  const handleImageChange = (field) => async (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError('Image must be 4MB or smaller.');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setFormData((current) => ({
        ...current,
        [field]: dataUrl
      }));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const showSuccessToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        avatar: formData.avatar,
        coverImage: formData.coverImage
      };

      if (isStudent) {
        payload.studentId = formData.studentId.trim();
        payload.department = formData.department.trim();
        payload.level = formData.level.trim();
        payload.bio = formData.bio.trim();
      }

      const updatedProfile = await updateMyProfile(token, payload);
      updateUser(updatedProfile);
      setFormData((current) => ({
        ...current,
        ...getProfileState(updatedProfile)
      }));
      showSuccessToast();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSecurityError('');

    if (!formData.password || !formData.confirmPassword) {
      setSecurityError('Enter and confirm the new password.');
      setIsSaving(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setSecurityError('Passwords do not match.');
      setIsSaving(false);
      return;
    }

    try {
      const updatedProfile = await updateMyProfile(token, {
        password: formData.password
      });
      updateUser(updatedProfile);
      setFormData((current) => ({
        ...current,
        password: '',
        confirmPassword: ''
      }));
      showSuccessToast();
    } catch (err) {
      setSecurityError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {showToast &&
      <motion.div
        initial={{
          opacity: 0,
          y: -50
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        exit={{
          opacity: 0,
          y: -50
        }}
        className="fixed top-20 right-8 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center">

          <SaveIcon className="w-5 h-5 mr-2" />
          Profile updated successfully
        </motion.div>
      }

      <Card className="p-6 sm:p-8 relative overflow-hidden">
        <div
          className="absolute top-0 left-0 w-full h-40 bg-gradient-to-r from-blue-500 to-teal-400 bg-cover bg-center"
          style={formData.coverImage ? { backgroundImage: `url(${formData.coverImage})` } : undefined}
        />
        <label className="absolute top-4 right-4 z-10 cursor-pointer">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange('coverImage')} />
          <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-white">
            <CameraIcon className="mr-2 h-4 w-4" />
            Change Cover
          </span>
        </label>
        <div className="relative mt-12 sm:flex sm:items-end sm:space-x-5">
          <div className="relative group inline-block">
            <Avatar
              name={displayName}
              src={formData.avatar}
              size="xl"
              className="ring-4 ring-white" />

            <label className="absolute bottom-0 right-0 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange('avatar')} />
              <span className="inline-flex bg-white p-2 rounded-full shadow-md text-slate-600 hover:text-blue-600 transition-colors">
                <CameraIcon className="w-4 h-4" />
              </span>
            </label>
          </div>
          <div className="mt-4 sm:mt-0 sm:flex-1 sm:pb-2">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-slate-900 truncate">
                {displayName}
              </h1>
              <Badge variant="info" className="capitalize">
                {user.role}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">{formData.email}</p>
            {isStudent && formData.studentId &&
            <p className="text-sm text-slate-500 mt-1">Student ID: {formData.studentId}</p>}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card className="p-4">
            <nav className="space-y-1">
              <a
                href="#personal"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-50 text-blue-700">

                <UserIcon className="w-5 h-5 mr-3" />
                Personal Information
              </a>
              <a
                href="#security"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-50">

                <ShieldIcon className="w-5 h-5 mr-3 text-slate-400" />
                Security Settings
              </a>
            </nav>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="p-6" id="personal">
            <h2 className="text-lg font-medium text-slate-900 mb-4">
              Personal Information
            </h2>

            {isLoading &&
            <p className="text-sm text-slate-500 mb-4">Loading profile...</p>
            }

            {error &&
            <p className="text-sm text-red-600 mb-4">{error}</p>
            }

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Full Name" value={formData.fullName} onChange={handleChange('fullName')} />
                <Input label="Email Address" type="email" value={formData.email} onChange={handleChange('email')} />
                <Input label="Phone Number" type="tel" value={formData.phone} onChange={handleChange('phone')} />

                {isStudent &&
                <>
                  <Input label="Student ID" value={formData.studentId} onChange={handleChange('studentId')} />
                  <Input label="Department" value={formData.department} onChange={handleChange('department')} />
                  <Input label="Academic Level" value={formData.level} onChange={handleChange('level')} />
                </>}
              </div>

              {isStudent &&
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 tracking-[0.01em]">
                  Bio
                </label>
                <textarea
                  className="w-full min-h-[140px] rounded-2xl border border-slate-300 bg-white/95 px-4 py-3 text-[15px] leading-6 text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  rows={4}
                  value={formData.bio}
                  onChange={handleChange('bio')} />
              </div>}

              <div className="flex justify-end pt-4">
                <Button type="submit" isLoading={isSaving || isLoading}>
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-6" id="security">
            <h2 className="text-lg font-medium text-slate-900 mb-4">
              Security Settings
            </h2>

            {securityError &&
            <p className="text-sm text-red-600 mb-4">{securityError}</p>
            }

            <form className="space-y-4" onSubmit={handlePasswordSave}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="New Password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange('password')} />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange('confirmPassword')} />
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" variant="outline" isLoading={isSaving}>
                  Update Password
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>);

};
