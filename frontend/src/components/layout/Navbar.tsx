import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Search,
  Briefcase,
  GraduationCap,
  FileText,
  Landmark,
  Menu,
  X,
  Sun,
  Moon,
  LogIn,
  LogOut,
  Shield,
  ChevronDown,
  User as UserIcon,
} from 'lucide-react';
import { useRoadmapStore } from '../../store/useRoadmapStore';
import { AuthModal } from '../auth/AuthModal';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const { theme, toggleTheme, user, logout } = useRoadmapStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { to: '/', label: 'Home', icon: Compass },
    { to: '/roadmap', label: 'Roadmap Explorer', icon: Compass },
    { to: '/careers', label: 'Careers', icon: Briefcase },
    { to: '/degrees', label: 'Degrees', icon: GraduationCap },
    { to: '/exams', label: 'Exams', icon: FileText },
    { to: '/institutes', label: 'Institutes', icon: Landmark },
    { to: '/search', label: 'Search', icon: Search },
  ];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-slate-200/50 dark:border-white/10 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <NavLink to="/" className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-xl group">
              <Compass className="w-8 h-8 text-brandCyan group-hover:rotate-45 transition-transform duration-500" />
              <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-brandCyan dark:from-white dark:via-slate-200 dark:to-brandCyan bg-clip-text text-transparent">
                Career Atlas
              </span>
            </NavLink>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex space-x-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-brandIndigo/20 text-brandCyan border border-brandCyan/20 shadow-glow'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 hover:dark:text-white hover:bg-slate-100 hover:dark:bg-white/5 border border-transparent'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 hover:dark:text-white hover:bg-slate-100 hover:dark:bg-white/5 transition-all focus:outline-none border border-slate-200/60 dark:border-white/5"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400 animate-pulse" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* Simulated Google Login Gate */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center space-x-2.5 p-1.5 pr-3 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/60 hover:dark:bg-slate-750 transition-all outline-none"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover bg-slate-300 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                  />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-300 ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-2.5 space-y-1 animate-fadeIn z-50">
                    <div className="px-3.5 py-3 border-b border-slate-100 dark:border-slate-850">
                      <p className="text-xs font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-1">
                        Signed In As
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {user.email}
                      </p>
                      <div className="mt-2.5 flex items-center space-x-1">
                        {user.role === 'ADMIN' ? (
                          <>
                            <Shield className="w-3.5 h-3.5 text-brandIndigo dark:text-brandCyan" />
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brandIndigo/10 text-brandIndigo dark:text-brandCyan border border-brandIndigo/25">
                              Administrator
                            </span>
                          </>
                        ) : (
                          <>
                            <UserIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-605 dark:text-emerald-400 border border-emerald-500/25">
                              Student Profile
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {user.role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 hover:dark:text-white hover:bg-brandIndigo/10 hover:border-brandIndigo/20 border border-transparent transition-all"
                      >
                        <Shield className="w-4 h-4 text-brandIndigo dark:text-brandCyan" />
                        <span>Go to Admin Portal</span>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-650 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-500/10 border border-transparent transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out Account</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 hover:dark:text-white hover:bg-slate-100 hover:dark:bg-white/5 transition-all focus:outline-none border border-slate-200/60 dark:border-white/5"
                title="Sign in with Google"
                aria-label="Google Sign-In"
              >
                <LogIn className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile Auth Button if not logged in */}
            {!user && (
              <button
                onClick={() => setAuthOpen(true)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-850 dark:hover:text-white"
                aria-label="Google Sign-In"
              >
                <LogIn className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 hover:dark:text-white hover:bg-slate-100 hover:dark:bg-white/5 focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-[#090D16]/95 border-b border-slate-200 dark:border-white/10 px-2 pt-2 pb-4 space-y-2 sm:px-3 animate-fadeIn">
          {user && (
            <div className="px-3.5 py-3.5 border-b border-slate-100 dark:border-white/5 flex items-center space-x-3">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full border border-slate-250 dark:border-slate-700"
              />
              <div className="overflow-hidden flex-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-1.5 ${
                  user.role === 'ADMIN' 
                    ? 'bg-brandIndigo/10 text-brandIndigo dark:text-brandCyan' 
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450'
                }`}>
                  {user.role} PROFILE
                </span>
              </div>
            </div>
          )}

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center space-x-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brandIndigo/10 dark:bg-brandIndigo/20 text-brandCyan border border-brandCyan/25'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 hover:dark:text-white hover:bg-slate-100 hover:dark:bg-white/5'
                }`
              }
            >
              <item.icon className="w-4.5 h-4.5" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {user && user.role === 'ADMIN' && (
            <Link
              to="/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-2 px-3 py-2.5 rounded-lg text-sm font-medium text-brandIndigo dark:text-brandCyan hover:bg-slate-100 hover:dark:bg-white/5 transition-all"
            >
              <Shield className="w-4.5 h-4.5" />
              <span>Go to Admin Portal</span>
            </Link>
          )}

          {user ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-650 hover:bg-red-500/10 transition-all text-left"
            >
              <LogOut className="w-4.5 h-4.5" />
              <span>Sign Out Account</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setIsOpen(false);
                setAuthOpen(true);
              }}
              className="w-full flex items-center space-x-2 px-3 py-2.5 rounded-lg text-sm font-medium text-emerald-600 hover:bg-emerald-500/10 transition-all text-left"
            >
              <LogIn className="w-4.5 h-4.5" />
              <span>Sign In with Google</span>
            </button>
          )}

          {/* Mobile Theme Toggle */}
          <div className="pt-3 border-t border-slate-100 dark:border-white/5 px-3 flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Display Theme</span>
            <button
              onClick={toggleTheme}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-55 dark:bg-white/5 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Auth Modal Trigger popup */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </nav>
  );
};

export default Navbar;
