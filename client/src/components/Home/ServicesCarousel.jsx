import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
const services = [
{
  title: 'Appointment Scheduling',
  image:
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=2000&auto=format&fit=crop'
},
{
  title: 'Patient Records Management',
  image:
  'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?q=80&w=2073&auto=format&fit=crop'
},
{
  title: 'Pharmacy & Prescriptions',
  image:
  'https://images.unsplash.com/photo-1587854692152-cbe668df9731?q=80&w=2069&auto=format&fit=crop'
},
{
  title: 'Billing & Payments',
  image:
  'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2036&auto=format&fit=crop'
},
{
  title: 'Emergency Services',
  image:
  'https://images.unsplash.com/photo-1587559070757-f72a388edbba?q=80&w=2070&auto=format&fit=crop'
}];

export function ServicesCarousel() {
  const carouselRef = useRef(null);
  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: -400,
        behavior: 'smooth'
      });
    }
  };
  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: 400,
        behavior: 'smooth'
      });
    }
  };
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div
            initial={{
              opacity: 0,
              x: -30
            }}
            whileInView={{
              opacity: 1,
              x: 0
            }}
            viewport={{
              once: true
            }}
            className="flex flex-wrap items-baseline gap-3">

            <h2 className="text-5xl md:text-7xl font-black text-gray-700 tracking-tight">
              Explore
            </h2>
            <h2 className="text-5xl md:text-7xl font-black text-[#0047AB] tracking-tight">
              Our
            </h2>
            <h2 className="text-5xl md:text-7xl font-black text-[#0047AB] tracking-tight w-full">
              Services
            </h2>
          </motion.div>

          <motion.button
            initial={{
              opacity: 0,
              x: 30
            }}
            whileInView={{
              opacity: 1,
              x: 0
            }}
            viewport={{
              once: true
            }}
            className="bg-[#0047AB] hover:bg-[#003DA5] text-white px-8 py-3 rounded-md font-bold transition-colors whitespace-nowrap self-start md:self-auto">

            Explore
          </motion.button>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative w-full">
        {/* Navigation Buttons */}
        <button
          onClick={scrollLeft}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-[#0047AB] text-white flex items-center justify-center shadow-lg hover:bg-[#003DA5] transition-colors hidden md:flex">

          <ChevronLeftIcon className="w-6 h-6" />
        </button>

        <button
          onClick={scrollRight}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-[#0047AB] text-white flex items-center justify-center shadow-lg hover:bg-[#003DA5] transition-colors hidden md:flex">

          <ChevronRightIcon className="w-6 h-6" />
        </button>

        {/* Scrollable Area */}
        <div
          ref={carouselRef}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory hide-scrollbar px-4 sm:px-6 lg:px-8 pb-10 pt-4"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>

          {services.map((service, index) =>
          <motion.div
            key={index}
            initial={{
              opacity: 0,
              scale: 0.9
            }}
            whileInView={{
              opacity: 1,
              scale: 1
            }}
            viewport={{
              once: true,
              margin: '-50px'
            }}
            transition={{
              delay: index * 0.1,
              duration: 0.5
            }}
            className="min-w-[300px] md:min-w-[400px] h-[500px] rounded-2xl overflow-hidden relative snap-center group flex-shrink-0 shadow-md">

              <img
              src={service.image}
              alt={service.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />

              <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628]/90 via-[#0A1628]/40 to-transparent"></div>

              {/* Grid overlay pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>

              <div className="absolute bottom-0 left-0 p-8 w-full">
                <h3 className="text-2xl font-bold text-white leading-tight">
                  {service.title}
                </h3>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `
        }} />

    </section>);

}
