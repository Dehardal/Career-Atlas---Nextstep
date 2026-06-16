import React, { useState } from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Award,
  Layers,
  Network,
  GraduationCap,
  Briefcase,
  Landmark,
  FileText,
  Sliders,
  Link2,
  ShieldAlert,
  ArrowLeft,
  Menu,
  X,
  Compass,
  Sun,
  Moon,
  MessageSquare
} from 'lucide-react';
import { useRoadmapStore } from '../../store/useRoadmapStore';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useRoadmapStore();

  const adminNavItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/admin/qualifications', label: 'Education Milestones', icon: Award },
    { to: '/admin/streams', label: 'Academic Streams', icon: Layers },
    { to: '/admin/subject-combinations', label: 'Subject Combinations', icon: Network },
    { to: '/admin/degrees', label: 'Degree Courses', icon: GraduationCap },
    { to: '/admin/occupations', label: 'Target Careers', icon: Briefcase },
    { to: '/admin/institutes', label: 'Colleges & Universities', icon: Landmark },
    { to: '/admin/exams', label: 'Entrance Exams', icon: FileText },
    { to: '/admin/rules', label: 'Pathway Eligibility Rules', icon: Sliders },
    { to: '/admin/mappings', label: 'College Offerings Catalog', icon: Link2 },
    { to: '/admin/validation', label: 'Diagnostics & Integrity', icon: ShieldAlert },
    { to: '/admin/suggestions', label: 'User Suggestions', icon: MessageSquare },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#080C14] text-slate-800 dark:text-slate-100 font-sans antialiased transition-colors duration-300">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 border-r border-slate-200 dark:border-white/5 bg-white dark:bg-[#090D16]/95 backdrop-blur-md z-40">
        <div className="flex items-center h-16 px-6 border-b border-slate-200 dark:border-white/5 bg-slate-100/60 dark:bg-[#0d1320]/80">
          <Link to="/" className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-lg group">
            <Compass className="w-6 h-6 text-brandCyan group-hover:rotate-45 transition-transform duration-500" />
            <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-brandCyan dark:from-white dark:via-slate-200 dark:to-brandCyan bg-clip-text text-transparent">
              Atlas Admin
            </span>
          </Link>
          <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-brandCyan bg-brandCyan/10 border border-brandCyan/20 rounded uppercase">
            Portal
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-brandCyan/10 text-brandCyan border border-brandCyan/20 shadow-glow'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:dark:text-slate-100 hover:bg-slate-100 hover:dark:bg-white/5 border border-transparent'
                }`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#070A10]/50 space-y-2">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center space-x-2 w-full py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:dark:text-white bg-slate-200/50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-300/50 dark:border-white/5 rounded-xl transition-all duration-300"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Dark Mode</span>
              </>
            )}
          </button>

          <Link
            to="/"
            className="flex items-center justify-center space-x-2 w-full py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:dark:text-white bg-slate-200/50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-300/50 dark:border-white/5 rounded-xl transition-all duration-300"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Site</span>
          </Link>
        </div>
      </aside>

      {/* Mobile Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/60 backdrop-blur-sm">
          <div className="relative flex flex-col w-72 max-w-xs bg-white dark:bg-[#090D16] border-r border-slate-200 dark:border-white/10 animate-slide-in">
            <div className="absolute top-0 right-0 pt-4 pr-4">
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex items-center h-16 px-6 border-b border-slate-200 dark:border-white/10">
              <Link to="/" className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-lg">
                <Compass className="w-6 h-6 text-brandCyan" />
                <span>Atlas Admin</span>
              </Link>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {adminNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${
                      isActive
                        ? 'bg-brandCyan/10 text-brandCyan border border-brandCyan/20'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:dark:text-white hover:bg-slate-100 hover:dark:bg-white/5'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-white/10 space-y-2">
              <button
                onClick={() => {
                  toggleTheme();
                  setSidebarOpen(false);
                }}
                className="flex items-center justify-center space-x-2 w-full py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-600" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>

              <Link
                to="/"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center justify-center space-x-2 w-full py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Public Site</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex flex-col flex-1 lg:pl-72">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 lg:hidden flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#090D16]/95 backdrop-blur-md">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link to="/" className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-lg">
            <Compass className="w-6 h-6 text-brandCyan" />
            <span>Atlas Admin</span>
          </Link>

          <div className="w-10" /> {/* Spacer */}
        </header>

        {/* Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {/* Outlet for Admin Pages */}
          <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Administrator Portal</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Manage pathway milestones, entry requirements, college catalogs, and check system integrity.</p>
              </div>
              <div className="hidden sm:flex items-center space-x-2 bg-brandCyan/10 border border-brandCyan/20 px-3 py-1.5 rounded-full text-xs font-medium text-brandCyan">
                <span className="w-2 h-2 rounded-full bg-brandCyan animate-pulse" />
                <span>Diagnostic Monitor Live</span>
              </div>
            </div>

            <React.Suspense fallback={
              <div className="min-h-[40vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brandCyan" />
              </div>
            }>
              <div className="min-h-[70vh]">
                <Outlet />
              </div>
            </React.Suspense>
          </div>
        </main>

        {/* Admin Footer */}
        <footer className="border-t border-slate-200 dark:border-white/5 bg-slate-100/30 dark:bg-[#070A10]/50 py-4 px-6 lg:px-8 text-center text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} Career Atlas Admin Console. Confidential administrative access only.</p>
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
