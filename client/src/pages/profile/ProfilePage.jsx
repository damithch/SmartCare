import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CameraIcon, SaveIcon, ShieldIcon, UserIcon } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
export const ProfilePage = () => {
  const { user } = useAppContext();
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  if (!user) return null;
  const displayName = user.fullName || user.name || 'User';
  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 1000);
  };
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast Notification */}
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

      {/* Profile Header */}
      <Card className="p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-500 to-teal-400" />
        <div className="relative mt-12 sm:flex sm:items-end sm:space-x-5">
          <div className="relative group inline-block">
            <Avatar
              name={displayName}
              src={user.avatar}
              size="xl"
              className="ring-4 ring-white" />

            <button className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md text-slate-600 hover:text-blue-600 transition-colors">
              <CameraIcon className="w-4 h-4" />
            </button>
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
            <p className="text-sm text-slate-500 mt-1">{user.email}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Nav/Summary */}
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

        {/* Right Column - Forms */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6" id="personal">
            <h2 className="text-lg font-medium text-slate-900 mb-4">
              Personal Information
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Full Name" defaultValue={displayName} />
                <Input
                  label="Email Address"
                  type="email"
                  defaultValue={user.email} />

                <Input
                  label="Phone Number"
                  type="tel"
                  defaultValue={user.phone || ''} />

                {user.role === 'doctor' &&
                <>
                    <Input
                    label="Specialization"
                    defaultValue={user.specialization || ''} />

                    <Input
                    label="Consultation Fee ($)"
                    type="number"
                    defaultValue={user.consultationFee?.toString() || ''} />

                  </>
                }
              </div>
              {user.role === 'doctor' &&
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Bio
                  </label>
                  <textarea
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  rows={4}
                  defaultValue={user.bio || ''} />

                </div>
              }
              <div className="flex justify-end pt-4">
                <Button type="submit" isLoading={isSaving}>
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-6" id="security">
            <h2 className="text-lg font-medium text-slate-900 mb-4">
              Security Settings
            </h2>
            <form className="space-y-4">
              <Input label="Current Password" type="password" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="New Password" type="password" />
                <Input label="Confirm New Password" type="password" />
              </div>
              <div className="flex justify-end pt-4">
                <Button variant="outline">Update Password</Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>);

};
