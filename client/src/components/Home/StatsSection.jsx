import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
const stats = [
{
  label: 'Patients Served',
  value: 10000,
  suffix: '+'
},
{
  label: 'Expert Doctors',
  value: 50,
  suffix: '+'
},
{
  label: 'Successful Treatments',
  value: 15000,
  suffix: '+'
},
{
  label: 'Years of Service',
  value: 12,
  suffix: '+'
}];

function AnimatedCounter({
  value,
  duration = 2
}) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    margin: '-100px'
  });
  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      const totalFrames = Math.round(duration * 60);
      const increment = end / totalFrames;
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 1000 / 60);
      return () => clearInterval(timer);
    }
  }, [isInView, value, duration]);
  return <span ref={ref}>{count.toLocaleString()}</span>;
}
export function StatsSection() {
  return (
    <section className="py-20 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 divide-x divide-gray-200">
          {stats.map((stat, index) =>
          <motion.div
            key={stat.label}
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
            className="flex flex-col items-center text-center px-4">

              <div className="text-5xl md:text-6xl font-black text-[#0047AB] mb-2 flex items-center justify-center tracking-tighter">
                <AnimatedCounter value={stat.value} />
                <span className="text-[#00BCD4]">{stat.suffix}</span>
              </div>
              <p className="text-gray-600 font-bold text-sm uppercase tracking-wider">
                {stat.label}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </section>);

}
