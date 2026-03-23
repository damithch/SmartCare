import React from 'react';
import { motion } from 'framer-motion';
import { StarIcon } from 'lucide-react';
const testimonials = [
{
  quote:
  'SmartCare made booking appointments so easy. I no longer have to wait in long queues at the reception. The reminders are also very helpful.',
  name: 'Maria Santos',
  context: 'Regular Patient',
  rating: 5
},
{
  quote:
  'The digital prescription system is amazing. My medicines are always ready when I arrive at the pharmacy, and I can view my history anytime.',
  name: 'Robert Kim',
  context: 'Chronic Care Patient',
  rating: 5
},
{
  quote:
  'As a senior citizen, I appreciate how simple and clear the interface is. My family can also track my appointments and medical records easily.',
  name: 'Helen Garcia',
  context: 'Senior Patient',
  rating: 5
}];

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-white">
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

            What Our Patients Say
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

            Real experiences from patients who have used the SmartCare platform
            to manage their healthcare journey.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) =>
          <motion.div
            key={testimonial.name}
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
            className="bg-slate-50 rounded-2xl p-8 border-l-4 border-l-[#0D9488] shadow-sm relative">

              {/* Quote Icon decorative */}
              <div className="absolute top-6 right-6 text-slate-200">
                <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg">

                  <path d="M14.017 18L14.017 10.609C14.017 4.905 17.748 1.039 23 0L23.995 2.151C21.563 3.068 20 5.789 20 8H24V18H14.017ZM0 18V10.609C0 4.905 3.748 1.038 9 0L9.996 2.151C7.563 3.068 6 5.789 6 8H9.983L9.983 18L0 18Z" />
                </svg>
              </div>

              <div className="flex gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, i) =>
              <StarIcon
                key={i}
                className="w-5 h-5 fill-amber-400 text-amber-400" />

              )}
              </div>

              <p className="text-slate-700 text-lg leading-relaxed mb-8 relative z-10 italic">
                "{testimonial.quote}"
              </p>

              <div className="flex items-center gap-4 mt-auto">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-bold text-lg">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-slate-500">
                    {testimonial.context}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>);

}