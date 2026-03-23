import React from 'react';
import { motion } from 'framer-motion';
import {
  CalendarIcon,
  FileTextIcon,
  CreditCardIcon,
  PillIcon,
  BuildingIcon,
  ActivityIcon } from
'lucide-react';
const services = [
{
  title: 'Appointment Scheduling',
  description:
  'Book and manage doctor appointments with real-time availability and automated reminders.',
  icon: CalendarIcon,
  color: 'text-blue-600',
  bgColor: 'bg-blue-100'
},
{
  title: 'Patient Medical Records',
  description:
  'Secure digital storage of complete patient health history accessible instantly by authorized staff.',
  icon: FileTextIcon,
  color: 'text-teal-600',
  bgColor: 'bg-teal-100'
},
{
  title: 'Billing & Payments',
  description:
  'Transparent billing with integrated payment processing for consultations and pharmacy.',
  icon: CreditCardIcon,
  color: 'text-indigo-600',
  bgColor: 'bg-indigo-100'
},
{
  title: 'Pharmacy Management',
  description:
  'Digital prescription processing, medicine inventory tracking, and automated stock alerts.',
  icon: PillIcon,
  color: 'text-emerald-600',
  bgColor: 'bg-emerald-100'
},
{
  title: 'Hospital Administration',
  description:
  'Comprehensive tools for hospital operations management, analytics, and staff coordination.',
  icon: BuildingIcon,
  color: 'text-purple-600',
  bgColor: 'bg-purple-100'
},
{
  title: 'Emergency Services',
  description:
  'Quick access to emergency care workflows and critical patient management protocols.',
  icon: ActivityIcon,
  color: 'text-rose-600',
  bgColor: 'bg-rose-100'
}];

export function ServicesSection() {
  return (
    <section id="services" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
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

            Our Core Services
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

            SmartCare provides a comprehensive suite of digital tools designed
            to streamline hospital operations and enhance patient care.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) =>
          <motion.div
            key={service.title}
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
            className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer">

              <div
              className={`w-14 h-14 rounded-xl ${service.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>

                <service.icon className={`h-7 w-7 ${service.color}`} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-[#0B3D91] transition-colors">
                {service.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {service.description}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </section>);

}