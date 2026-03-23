import React, { Children, memo } from 'react';
import { motion } from 'framer-motion';
export function FeaturesGrid() {
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    }
  };
  return (
    <section className="py-16 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            margin: '-100px'
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[300px]">

          {/* TOP LEFT - Text Card */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl p-8 shadow-sm relative overflow-hidden group border border-gray-100">

            {/* Decorative corners */}
            <div className="absolute top-4 right-4 w-0 h-0 border-l-[8px] border-l-transparent border-b-[8px] border-b-[#0047AB] rotate-45"></div>
            <div className="absolute bottom-4 right-4 w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-[#0047AB] -rotate-45"></div>

            <h3 className="text-3xl font-black text-gray-800 leading-tight mb-1">
              A Space To
            </h3>
            <h3 className="text-3xl font-black text-[#0047AB] leading-tight mb-6">
              Grow, Lead,
              <br />
              and Belong
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              From meaningful friendships to memorable moments, our environment
              is built for connection and discovery. Students find the freedom
              to express themselves, step into leadership, and feel part of
              something bigger every step of the way.
            </p>
          </motion.div>

          {/* TOP CENTER - Tall Image Card (Spans 2 rows) */}
          <motion.div
            variants={itemVariants}
            className="lg:row-span-2 rounded-2xl overflow-hidden relative shadow-md group">

            <img
              src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop"
              alt="Medical Team"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />

            <div className="absolute inset-0 bg-gradient-to-t from-[#00BCD4]/90 via-transparent to-transparent"></div>

            {/* Overlay Text for bottom half */}
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-[#00BCD4] h-[50%] flex flex-col justify-center">
              <div className="absolute top-4 right-4 w-0 h-0 border-l-[8px] border-l-transparent border-b-[8px] border-b-[#0047AB] rotate-45"></div>
              <div className="absolute bottom-4 right-4 w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-[#0047AB] -rotate-45"></div>

              <h3 className="text-3xl font-black text-white leading-tight mb-4">
                Turning
                <br />
                Ambition Into
                <br />
                Direction
              </h3>
              <p className="text-white/90 text-sm leading-relaxed">
                We don't just talk about goals; we help shape them. With
                personalized support and real-world exposure, students gain the
                clarity and confidence to turn potential into purpose—and dreams
                into action.
              </p>
            </div>
          </motion.div>

          {/* TOP RIGHT - Text Card */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl p-8 shadow-sm relative overflow-hidden group border border-gray-100">

            <div className="absolute top-4 right-4 w-0 h-0 border-l-[8px] border-l-transparent border-b-[8px] border-b-[#0047AB] rotate-45"></div>
            <div className="absolute bottom-4 right-4 w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-[#0047AB] -rotate-45"></div>

            <h3 className="text-3xl font-black text-gray-800 leading-tight mb-1">
              Learning
            </h3>
            <h3 className="text-3xl font-black text-[#0047AB] leading-tight mb-6">
              Beyond The
              <br />
              Classroom
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              We bring the real world to our students through collaboration with
              professionals, exposure to current challenges, and hands-on
              experience. It's more than education; it's preparation to thrive
              in a fast-changing world.
            </p>
          </motion.div>

          {/* BOTTOM LEFT - Image Card */}
          <motion.div
            variants={itemVariants}
            className="rounded-2xl overflow-hidden relative shadow-md group">

            <img
              src="https://images.unsplash.com/photo-1581056771107-24ca5f033842?q=80&w=2070&auto=format&fit=crop"
              alt="Research"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />

            {/* Decorative scribble overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60">
              <svg
                viewBox="0 0 200 100"
                className="w-full h-full stroke-white fill-none"
                strokeWidth="2">

                <path d="M20 50 Q 50 10, 100 50 T 180 50" />
              </svg>
            </div>
          </motion.div>

          {/* BOTTOM RIGHT - Image Card */}
          <motion.div
            variants={itemVariants}
            className="rounded-2xl overflow-hidden relative shadow-md group">

            <img
              src="https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=2070&auto=format&fit=crop"
              alt="Technology"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60">
              <svg
                viewBox="0 0 200 100"
                className="w-full h-full stroke-white fill-none"
                strokeWidth="2">

                <path d="M20 50 Q 50 90, 100 50 T 180 50" />
              </svg>
            </div>

            {/* Scroll to top button overlaying bottom right card */}
            <button
              className="absolute bottom-4 right-4 w-12 h-12 rounded-md bg-[#0047AB] text-white flex items-center justify-center hover:bg-[#003DA5] transition-colors shadow-lg z-20"
              onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: 'smooth'
              })
              }>

              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">

                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>);

}