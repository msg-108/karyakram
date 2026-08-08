import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-karyakram-red-900 text-karyakram-red-200 border-t border-karyakram-red-800 transition-all">
      <div className="container-app py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center">
            <span className="text-xl font-black text-white tracking-tight font-heading">
              Karya<span className="text-karyakram-red-200">kram</span>
            </span>
          </div>
          <p className="text-xs text-karyakram-red-200 leading-relaxed font-sans">
            Nepal's premier event ticketing and management platform. Discover live concerts, tech summits, culinary festivals, and workshops.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 font-heading">Explore Events</h4>
          <ul className="space-y-2.5 text-xs font-medium">
            <li><Link to="/events" className="hover:text-karyakram-gold-200 transition-colors">All Events</Link></li>
            <li><Link to="/events?category=tech-startups" className="hover:text-karyakram-gold-200 transition-colors">Tech & AI Summits</Link></li>
            <li><Link to="/events?category=music-festivals" className="hover:text-karyakram-gold-200 transition-colors">Music & Concerts</Link></li>
            <li><Link to="/events?category=food-culinary" className="hover:text-karyakram-gold-200 transition-colors">Food Festivals</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 font-heading">For Organizers</h4>
          <ul className="space-y-2.5 text-xs font-medium">
            <li><Link to="/register/organizer" className="hover:text-karyakram-gold-200 transition-colors">Host an Event</Link></li>
            <li><Link to="/login" className="hover:text-karyakram-gold-200 transition-colors">Organizer Login</Link></li>
            <li><Link to="/register/organizer" className="hover:text-karyakram-gold-200 transition-colors">Partner with Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 font-heading">Legal & Support</h4>
          <ul className="space-y-2.5 text-xs font-medium">
            <li><span className="hover:text-karyakram-gold-200 cursor-pointer transition-colors">Terms & Conditions</span></li>
            <li><span className="hover:text-karyakram-gold-200 cursor-pointer transition-colors">Privacy Policy</span></li>
            <li><span className="hover:text-karyakram-gold-200 cursor-pointer transition-colors">Support & Contact</span></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-karyakram-red-800 py-6 text-center text-xs text-karyakram-red-200 font-medium">
        © {new Date().getFullYear()} Karyakram Inc. Built with excellence for Nepal.
      </div>
    </footer>
  );
};
