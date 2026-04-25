import React from 'react';
import { getRoleLandingPath, useAppContext } from '../../context/AppContext';
import { Link } from 'react-router-dom';

export function TopBar() {
  const { user } = useAppContext();

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
        <div className="flex items-center gap-4">
          {user ? (
            <Link
              to={getRoleLandingPath(user.role)}
              className="font-semibold hover:text-gray-300 transition-colors">
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="font-semibold hover:text-gray-300 transition-colors">
                Login
              </Link>
              <Link
                to="/register"
                className="font-semibold hover:text-gray-300 transition-colors">
                Create Account
              </Link>
            </>
          )}
        </div>
      </div>
    </div>);

}
