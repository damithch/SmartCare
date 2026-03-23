import React from 'react';
import { motion } from 'framer-motion';
export function WelcomeSection() {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Image Area with Decorative SVG */}
          <motion.div
            initial={{
              opacity: 0,
              x: -50
            }}
            whileInView={{
              opacity: 1,
              x: 0
            }}
            viewport={{
              once: true,
              margin: '-100px'
            }}
            transition={{
              duration: 0.8,
              ease: 'easeOut'
            }}
            className="relative">

            {/* Main Image Placeholder */}
            <div className="relative rounded-3xl overflow-hidden aspect-[4/5] max-w-md mx-auto lg:mx-0 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop"
                alt="Healthcare Professional"
                className="w-full h-full object-cover" />

              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            </div>

            {/* Decorative Scribble Overlay (like ESU's white lines) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] pointer-events-none z-10">
              <svg
                viewBox="0 0 500 500"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full opacity-90 drop-shadow-lg">

                <path
                  d="M150 350 C 50 250, 100 100, 250 150 C 400 200, 450 350, 350 400 C 250 450, 150 350, 250 250 C 350 150, 250 50, 150 150"
                  stroke="white"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="path-draw-animation" />

                <path
                  d="M120 380 C 20 280, 70 130, 220 180 C 370 230, 420 380, 320 430 C 220 480, 120 380, 220 280"
                  stroke="white"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.6" />

              </svg>
            </div>
          </motion.div>

          {/* Right: Text Content */}
          <motion.div
            initial={{
              opacity: 0,
              x: 50
            }}
            whileInView={{
              opacity: 1,
              x: 0
            }}
            viewport={{
              once: true,
              margin: '-100px'
            }}
            transition={{
              duration: 0.8,
              ease: 'easeOut',
              delay: 0.2
            }}>

            <h2 className="text-5xl md:text-6xl font-black text-[#1A1A2E] tracking-tight leading-none mb-2">
              Welcome to
            </h2>
            <h2 className="text-6xl md:text-7xl font-black text-[#0047AB] tracking-tighter leading-none mb-8">
              SMARTCARE
            </h2>

            <p className="text-xl md:text-2xl text-[#1A1A2E] font-medium mb-8 leading-relaxed">
              Leading Hospital Management System: Your Pathway to a Global
              Future
            </p>

            <p className="text-gray-600 text-lg leading-relaxed mb-10">
              What makes SmartCare one of the most trusted hospital management
              platforms? Established with a vision to digitize healthcare,
              SmartCare has grown into a comprehensive system supporting over
              10,000 patients every year. How does SmartCare hold its
              operational excellence? Across the world, benchmarked workflows, a
              certified medical workforce, and applications designed for
              realistic skills and enterprise relevance. What packages does
              SmartCare offer? A huge variety of patient and administrative
              stages in computing, engineering, business, law, and art. Join us
              at SmartCare - where your unique potential meets infinite
              possibilities.
            </p>

            <button className="w-14 h-14 rounded-md bg-[#0047AB] text-white flex items-center justify-center hover:bg-[#003DA5] transition-colors shadow-lg ml-auto">
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
        </div>
      </div>
    </section>);

}