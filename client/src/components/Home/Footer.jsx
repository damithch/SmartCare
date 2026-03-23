import React from 'react';
export function Footer() {
  return (
    <footer className="bg-[#0A1628] pt-20 pb-10 relative overflow-hidden">
      {/* Large Watermark Logo */}
      <div className="absolute bottom-0 right-0 opacity-10 pointer-events-none select-none translate-x-1/4 translate-y-1/4">
        <span className="text-[20rem] font-black text-white leading-none tracking-tighter">
          SC
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-20">
          {/* Column 1: Contact Details */}
          <div>
            <h3 className="text-lg font-bold text-white mb-8 tracking-wider uppercase">
              Contact Details
            </h3>
            <div className="space-y-6 text-sm">
              <div>
                <p className="font-bold text-white mb-1">Hotline</p>
                <p className="text-gray-400">+1 800 123 4567</p>
              </div>
              <div>
                <p className="font-bold text-white mb-1">Email</p>
                <p className="text-gray-400">info@smartcare.com</p>
              </div>
              <div>
                <p className="font-bold text-white mb-1">Address</p>
                <p className="text-gray-400 leading-relaxed">
                  SmartCare Hospital,
                  <br />
                  123 Medical District,
                  <br />
                  New York, NY 10001,
                  <br />
                  United States.
                </p>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-lg font-bold text-white mb-8 tracking-wider uppercase">
              Quick Links
            </h3>
            <ul className="space-y-4 text-sm">
              {[
              'Home',
              'About Us',
              'Courses',
              'Faculties',
              'Academics',
              'Contact Us',
              'News & Events',
              'Blogs',
              'Conferences',
              'Research'].
              map((link) =>
              <li key={link}>
                  <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">

                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                    {link}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Column 3: Important Links */}
          <div>
            <h3 className="text-lg font-bold text-white mb-8 tracking-wider uppercase">
              Important Links
            </h3>
            <ul className="space-y-4 text-sm">
              {[
              'Privacy Policy',
              'Payment Policy',
              'Refund Policy',
              'Centre for QA',
              'Sitemap'].
              map((link) =>
              <li key={link}>
                  <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">

                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                    {link}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 text-sm text-gray-500 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>Copyright &copy; 2026 SmartCare Hospital</p>
          <p>Website Designed and Developed by SmartCare</p>
        </div>
      </div>
    </footer>);

}
