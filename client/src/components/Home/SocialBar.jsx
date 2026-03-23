import React from 'react';
import { motion } from 'framer-motion';
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  TwitterIcon } from
'lucide-react';
export function SocialBar() {
  return (
    <section className="bg-[#0047AB] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <motion.h2
            initial={{
              opacity: 0,
              x: -20
            }}
            whileInView={{
              opacity: 1,
              x: 0
            }}
            viewport={{
              once: true
            }}
            className="text-4xl md:text-5xl font-black text-white tracking-tight">

            #SmartCareLife
          </motion.h2>

          <motion.div
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
            className="flex items-center gap-4">

            {[FacebookIcon, InstagramIcon, LinkedinIcon, TwitterIcon].map(
              (Icon, i) =>
              <a
                key={i}
                href="#"
                className="w-12 h-12 rounded-md bg-[#0A1628] flex items-center justify-center text-white hover:bg-white hover:text-[#0A1628] transition-colors">

                  <Icon className="w-5 h-5" />
                </a>

            )}
          </motion.div>
        </div>
      </div>
    </section>);

}