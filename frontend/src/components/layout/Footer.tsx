import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 transition-all">
      <div className="container-app py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-white tracking-tight font-heading">
              Karya<span className="text-gradient">kram</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Nepal's premier event ticketing and management platform. Discover live concerts, tech summits, culinary festivals, and workshops.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 font-heading">Explore Events</h4>
          <ul className="space-y-2.5 text-xs font-medium">
            <li><Link to="/events" className="hover:text-indigo-400 transition-colors">All Events</Link></li>
            <li><Link to="/events?category=tech-startups" className="hover:text-indigo-400 transition-colors">Tech & AI Summits</Link></li>
            <li><Link to="/events?category=music-festivals" className="hover:text-indigo-400 transition-colors">Music & Concerts</Link></li>
            <li><Link to="/events?category=food-culinary" className="hover:text-indigo-400 transition-colors">Food Festivals</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 font-heading">For Organizers</h4>
          <ul className="space-y-2.5 text-xs font-medium">
            <li><Link to="/register/organizer" className="hover:text-indigo-400 transition-colors">Host an Event</Link></li>
            <li><Link to="/login" className="hover:text-indigo-400 transition-colors">Organizer Login</Link></li>
            <li><Link to="/register/organizer" className="hover:text-indigo-400 transition-colors">Partner with Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 font-heading">Legal & Support</h4>
          <ul className="space-y-2.5 text-xs font-medium">
            <li><span className="hover:text-indigo-400 cursor-pointer transition-colors">Terms & Conditions</span></li>
            <li><span className="hover:text-indigo-400 cursor-pointer transition-colors">Privacy Policy</span></li>
            <li><span className="hover:text-indigo-400 cursor-pointer transition-colors">Support & Contact</span></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 font-medium">
        © {new Date().getFullYear()} Karyakram Inc. Built with excellence for Nepal.
      </div>
    </footer>
  );
};
