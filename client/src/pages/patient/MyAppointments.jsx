import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  MoreVerticalIcon } from
'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { mockAppointments } from '../../data/mockData';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
export const MyAppointments = () => {
  const { user } = useAppContext();
  const [activeTab, setActiveTab] = useState('All');
  if (!user) return null;
  const tabs = ['All', 'Upcoming', 'Completed', 'Cancelled'];
  const filteredAppointments = mockAppointments.filter((apt) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Upcoming')
    return apt.status === 'confirmed' || apt.status === 'pending';
    return apt.status === activeTab.toLowerCase();
  });
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'completed':
        return 'info';
      case 'cancelled':
        return 'danger';
      default:
        return 'default';
    }
  };
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>

        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg self-start">
          {tabs.map((tab) =>
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>

              {tab}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredAppointments.length > 0 ?
        filteredAppointments.map((apt, index) =>
        <motion.div
          key={apt.id}
          initial={{
            opacity: 0,
            y: 10
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: index * 0.05
          }}>

              <Card className="p-5 flex flex-col md:flex-row gap-6 items-start md:items-center">
                {/* Date/Time Block */}
                <div className="flex items-center md:flex-col md:justify-center bg-slate-50 rounded-xl p-4 min-w-[120px] shrink-0 w-full md:w-auto">
                  <CalendarIcon className="w-5 h-5 text-blue-600 mb-1 hidden md:block" />
                  <div className="text-center md:text-left flex-1 md:flex-none">
                    <p className="text-sm font-semibold text-slate-500 uppercase">
                      {new Date(apt.date).toLocaleString('default', {
                    month: 'short'
                  })}
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {new Date(apt.date).getDate()}
                    </p>
                  </div>
                  <div className="text-right md:text-center">
                    <Badge
                  variant={getStatusColor(apt.status)}
                  className="capitalize mb-1 md:hidden">

                      {apt.status}
                    </Badge>
                    <p className="text-sm font-medium text-slate-600 flex items-center justify-end md:justify-center">
                      <ClockIcon className="w-3 h-3 mr-1" /> {apt.time}
                    </p>
                  </div>
                </div>

                {/* Doctor Info */}
                <div className="flex-1 flex items-start space-x-4 w-full">
                  <Avatar name={apt.doctorName || ''} size="lg" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {apt.doctorName}
                        </h3>
                        <p className="text-blue-600 font-medium text-sm">
                          {apt.doctorSpecialization}
                        </p>
                      </div>
                      <Badge
                    variant={getStatusColor(apt.status)}
                    className="capitalize hidden md:inline-flex">

                        {apt.status}
                      </Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                      <span className="flex items-center">
                        <MapPinIcon className="w-4 h-4 mr-1 text-slate-400" />
                        SmartCare Main Hospital, Room 302
                      </span>
                      <span className="flex items-center">
                        <span className="font-medium text-slate-700 mr-1">
                          Fee:
                        </span>{' '}
                        ${apt.fee}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex md:flex-col gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                  {(apt.status === 'confirmed' || apt.status === 'pending') &&
              <>
                      <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 md:w-full">

                        Reschedule
                      </Button>
                      <Button
                  variant="danger"
                  size="sm"
                  className="flex-1 md:w-full bg-red-50 text-red-600 hover:bg-red-100 border-none">

                        Cancel
                      </Button>
                    </>
              }
                  {apt.status === 'completed' &&
              <Button variant="outline" size="sm" className="w-full">
                      View Notes
                    </Button>
              }
                </div>
              </Card>
            </motion.div>
        ) :

        <Card className="p-12 text-center border-dashed">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <CalendarIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">
              No appointments found
            </h3>
            <p className="text-slate-500 mt-1 mb-6">
              You don't have any{' '}
              {activeTab !== 'All' ? activeTab.toLowerCase() : ''} appointments.
            </p>
          </Card>
        }
      </div>
    </div>);

};