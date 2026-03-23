import React from 'react';
import { LockIcon } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
export function TopBar() {
  const { navigate } = useAppContext();
  const links = [
  'Home',
  'About Us',
  'Services',
  'Departments',
  'Research',
  'Blogs',
  'Contact Us',
  'Careers'];

  return (
    <div className="bg-[#0A1628] text-white py-2 px-4 sm:px-6 lg:px-8 hidden md:block">
      <div className="max-w-7xl mx-auto flex justify-between items-center text-sm">
        <div className="flex items-center gap-6">
          {links.map((link) =>
          <a
            key={link}
            href="#"
            className="hover:text-gray-300 transition-colors">

              {link}
            </a>
          )}
        </div>
        <div>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('login');
            }}
            className="flex items-center gap-2 hover:text-gray-300 transition-colors">

            <LockIcon className="w-4 h-4" />
            <span>Patient Portal</span>
          </a>
        </div>
      </div>
    </div>);

}
