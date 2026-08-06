import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="container-app py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight">Karyakram</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Nepal's premier event management and ticketing platform. Discover concerts, tech conferences, workshops, and cultural events.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">Explore</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/events" className="hover:text-white transition-colors">All Events</Link></li>
            <li><Link to="/events?category=technology" className="hover:text-white transition-colors">Tech Events</Link></li>
            <li><Link to="/events?category=music" className="hover:text-white transition-colors">Music & Concerts</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">Organizers</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/register/organizer" className="hover:text-white transition-colors">Host an Event</Link></li>
            <li><Link to="/login" className="hover:text-white transition-colors">Organizer Login</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">Legal & Support</h4>
          <ul className="space-y-2 text-xs">
            <li><span className="hover:text-white cursor-pointer">Terms & Conditions</span></li>
            <li><span className="hover:text-white cursor-pointer">Privacy Policy</span></li>
            <li><span className="hover:text-white cursor-pointer">Support / Contact</span></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Karyakram Inc. All rights reserved.
      </div>
    </footer>
  );
};
