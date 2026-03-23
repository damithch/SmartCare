import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from 'lucide-react';
import { Card } from '../../components/ui/Card';
export const MySchedule = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from(
    {
      length: 11
    },
    (_, i) => i + 8
  ); // 8 AM to 6 PM
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Schedule</h1>
          <p className="text-slate-500 mt-1">
            Weekly overview of your appointments.
          </p>
        </div>
        <div className="flex items-center space-x-4 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
          <button className="p-1 hover:bg-slate-100 rounded">
            <ChevronLeftIcon className="w-5 h-5 text-slate-600" />
          </button>
          <span className="font-semibold text-slate-900 min-w-[120px] text-center">
            Oct 16 - Oct 22
          </span>
          <button className="p-1 hover:bg-slate-100 rounded">
            <ChevronRightIcon className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header Row */}
            <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50">
              <div className="p-4 border-r border-slate-200 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-slate-400" />
              </div>
              {days.map((day, i) =>
              <div
                key={day}
                className="p-4 text-center border-r border-slate-200 last:border-r-0">

                  <p className="text-sm font-bold text-slate-900">{day}</p>
                  <p className="text-xs text-slate-500">{16 + i}</p>
                </div>
              )}
            </div>

            {/* Time Grid */}
            <div className="relative bg-white">
              {hours.map((hour) =>
              <div
                key={hour}
                className="grid grid-cols-8 border-b border-slate-100 h-20">

                  <div className="p-2 border-r border-slate-200 text-xs font-medium text-slate-500 text-right pr-4 relative">
                    <span className="absolute -top-2 right-4 bg-white px-1">
                      {hour > 12 ?
                    `${hour - 12} PM` :
                    hour === 12 ?
                    '12 PM' :
                    `${hour} AM`}
                    </span>
                  </div>
                  {days.map((day) =>
                <div
                  key={`${day}-${hour}`}
                  className="border-r border-slate-100 last:border-r-0 relative group">

                      {/* Mock Appointment Block */}
                      {day === 'Tue' && hour === 10 &&
                  <div className="absolute top-1 left-1 right-1 h-18 bg-blue-100 border-l-4 border-blue-600 rounded p-2 overflow-hidden cursor-pointer hover:shadow-md transition-shadow z-10">
                          <p className="text-xs font-bold text-blue-900 truncate">
                            Sarah Johnson
                          </p>
                          <p className="text-[10px] text-blue-700 truncate">
                            10:00 - 10:30 AM
                          </p>
                        </div>
                  }
                      {day === 'Thu' && hour === 14 &&
                  <div className="absolute top-1 left-1 right-1 h-18 bg-emerald-100 border-l-4 border-emerald-600 rounded p-2 overflow-hidden cursor-pointer hover:shadow-md transition-shadow z-10">
                          <p className="text-xs font-bold text-emerald-900 truncate">
                            Mike Davis
                          </p>
                          <p className="text-[10px] text-emerald-700 truncate">
                            2:00 - 2:30 PM
                          </p>
                        </div>
                  }
                    </div>
                )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>);

};