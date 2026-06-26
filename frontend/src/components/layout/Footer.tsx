import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, Sparkles, Plus, Github, Globe } from 'lucide-react';
import { useRoadmapStore } from '../../store/useRoadmapStore';

export const Footer: React.FC = () => {
  const { setSuggestionModalOpen } = useRoadmapStore();

  return (
    <footer id="footer" className="border-t border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-[#070A10] transition-colors duration-300">
      
      {/* Top Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
        
        {/* Column 1 - Brand Info */}
        <div className="md:col-span-4 space-y-4">
          <div className="flex items-center space-x-2">
            <Compass className="w-6 h-6 text-brandCyan" />
            <span className="text-base font-bold text-slate-800 dark:text-white">Career Atlas</span>
            <span className="text-[10px] text-indigo-500 font-mono font-bold border border-indigo-500/20 bg-indigo-500/10 px-1.5 py-0.5 rounded">v1.1.0</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
            Discover optimal educational pathways, degrees, colleges, and entrance exams. Help students navigate from school milestones to their dream professions with our data-driven career GPS.
          </p>
          <div className="flex items-center space-x-4 pt-2">
            <a 
              href="https://github.com/Dehardal/Career-Atlas---Nextstep" 
              target="_blank" 
              rel="noreferrer" 
              className="text-slate-400 hover:text-slate-900 hover:dark:text-white transition-colors"
              title="GitHub Repository"
            >
              <Github className="w-4 h-4" />
            </a>
            <a 
              href="https://career-atlas.onrender.com" 
              className="text-slate-400 hover:text-slate-900 hover:dark:text-white transition-colors"
              title="Website"
            >
              <Globe className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Column 2 - Platform Links */}
        <div className="md:col-span-2 space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Platform</h4>
          <ul className="space-y-2">
            {[
              { to: '/', label: 'Home' },
              { to: '/roadmap', label: 'Path Finder' },
              { to: '/careers', label: 'Careers' },
              { to: '/degrees', label: 'Degrees' },
              { to: '/exams', label: 'Entrance Exams' },
            ].map((link) => (
              <li key={link.to}>
                <NavLink 
                  to={link.to} 
                  className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3 - Features & Resources */}
        <div className="md:col-span-2 space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Resources</h4>
          <ul className="space-y-2">
            {[
              { to: '/dashboard', label: 'Student Dashboard' },
              { to: '/institutes', label: 'College Mappings' },
              { to: '/search', label: 'Advanced Search' },
              { to: '/admin', label: 'Moderator Board' },
            ].map((link) => (
              <li key={link.to}>
                <NavLink 
                  to={link.to} 
                  className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4 - Contribution Prompt */}
        <div className="md:col-span-4 bg-white/40 dark:bg-[#090E1A]/40 p-5 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-white/5 pb-2">
            <Sparkles className="w-3.5 h-3.5 text-brandCyan" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Database Contribution
            </h4>
          </div>
          <p className="text-[11px] text-slate-655 dark:text-slate-400 leading-relaxed">
            Missing a degree, entrance exam, or matched institute in our graph database? Propose new academic steps directly to our console.
          </p>
          <button
            onClick={() => setSuggestionModalOpen(true)}
            className="w-full flex items-center justify-center space-x-1.5 py-2 px-4 rounded-xl bg-gradient-to-r from-brandCyan to-brandIndigo hover:brightness-105 active:scale-95 text-white text-xs font-bold transition-all shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Suggest Pathway Component</span>
          </button>
        </div>

      </div>

      {/* Bottom Row */}
      <div className="border-t border-slate-200 dark:border-white/5 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-550 dark:text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} Career Atlas. Designed for educational navigation insights.
          </div>
          <div className="flex space-x-4">
            <a href="#terms" className="hover:text-slate-700 dark:hover:text-slate-350 transition-colors">Terms of Service</a>
            <span>&bull;</span>
            <a href="#privacy" className="hover:text-slate-700 dark:hover:text-slate-350 transition-colors">Privacy Policy</a>
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
