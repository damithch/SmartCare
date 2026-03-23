import React from 'react';
import { motion } from 'framer-motion';
import { StarIcon, ArrowRightIcon } from 'lucide-react';
const doctors = [
{
  name: 'Dr. Sarah Johnson',
  specialty: 'Cardiologist',
  rating: 4.9,
  reviews: 124,
  initials: 'SJ',
  color: 'from-blue-400 to-blue-600'
},
{
  name: 'Dr. Michael Chen',
  specialty: 'Neurologist',
  rating: 4.8,
  reviews: 98,
  initials: 'MC',
  color: 'from-teal-400 to-teal-600'
},
{
  name: 'Dr. Emily Williams',
  specialty: 'Pediatrician',
  rating: 4.9,
  reviews: 156,
  initials: 'EW',
  color: 'from-purple-400 to-purple-600'
},
{
  name: 'Dr. James Anderson',
  specialty: 'Orthopedic Surgeon',
  rating: 4.7,
  reviews: 112,
  initials: 'JA',
  color: 'from-indigo-400 to-indigo-600'
}];

export function DoctorShowcase() {
  return (
    <section id="doctors" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <motion.h2
              initial={{
                opacity: 0,
                y: 20
              }}
              whileInView={{
                opacity: 1,
                y: 0
              }}
              viewport={{
                once: true
              }}
              className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">

              Meet Our Expert Doctors
            </motion.h2>
            <motion.p
              initial={{
                opacity: 0,
                y: 20
              }}
              whileInView={{
                opacity: 1,
                y: 0
              }}
              viewport={{
                once: true
              }}
              transition={{
                delay: 0.1
              }}
              className="text-lg text-slate-600">

              Our hospital is staffed by highly qualified medical professionals
              dedicated to providing the best possible care.
            </motion.p>
          </div>
          <motion.button
            initial={{
              opacity: 0,
              x: 20
            }}
            whileInView={{
              opacity: 1,
              x: 0
            }}
            viewport={{
              once: true
            }}
            className="flex items-center gap-2 text-[#0B3D91] font-semibold hover:text-[#1E56B0] transition-colors whitespace-nowrap">

            View All Doctors <ArrowRightIcon className="w-5 h-5" />
          </motion.button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {doctors.map((doctor, index) =>
          <motion.div
            key={doctor.name}
            initial={{
              opacity: 0,
              y: 20
            }}
            whileInView={{
              opacity: 1,
              y: 0
            }}
            viewport={{
              once: true
            }}
            transition={{
              delay: index * 0.1
            }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group cursor-pointer flex flex-col h-full">

              <div className="mb-6 flex justify-center">
                <div
                className={`w-32 h-32 rounded-full bg-gradient-to-br ${doctor.color} flex items-center justify-center text-white text-4xl font-bold shadow-inner border-4 border-white ring-4 ring-slate-50 group-hover:scale-105 transition-transform duration-300`}>

                  {doctor.initials}
                </div>
              </div>

              <div className="text-center flex-grow">
                <h3 className="text-xl font-bold text-slate-900 mb-1">
                  {doctor.name}
                </h3>
                <p className="text-[#0D9488] font-medium mb-4">
                  {doctor.specialty}
                </p>

                <div className="flex items-center justify-center gap-1 mb-6">
                  <StarIcon className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-slate-700">
                    {doctor.rating}
                  </span>
                  <span className="text-slate-400 text-sm">
                    ({doctor.reviews} reviews)
                  </span>
                </div>
              </div>

              <button className="w-full py-3 rounded-xl border-2 border-slate-100 text-slate-700 font-semibold group-hover:bg-[#0B3D91] group-hover:border-[#0B3D91] group-hover:text-white transition-colors mt-auto">
                View Profile
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </section>);

}