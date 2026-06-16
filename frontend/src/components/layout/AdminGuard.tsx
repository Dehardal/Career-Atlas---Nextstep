import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const role = localStorage.getItem('userRole') || 'STUDENT';

  if (role !== 'ADMIN') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full glass p-8 rounded-2xl border border-red-500/20 text-center relative overflow-hidden shadow-2xl">
          {/* Decorative radial glows */}
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-brandIndigo/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 relative">
              <ShieldAlert className="w-12 h-12 animate-pulse" />
              <Lock className="w-5 h-5 absolute bottom-0 right-0 bg-[#0c1322] border border-red-500/30 rounded-full p-1 text-red-400" />
            </div>
          </div>

          <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-3">
            Access Denied
          </h1>
          
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
            The requested resource is restricted to system administrators. Students, Parents, and Teachers are not permitted to access administrative diagnostics, rules, or database mappings.
          </p>

          <div className="p-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-left mb-6">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>CURRENT ROLE</span>
              <span className="font-semibold text-red-600 dark:text-red-400 bg-red-500/10 dark:bg-red-400/10 px-2 py-0.5 rounded">
                STUDENT
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Use the floating role switcher widget at the bottom-right of the screen to switch to <strong>ADMIN</strong> role for testing and review.
            </p>
          </div>

          <div className="flex flex-col space-y-3">
            <Link
              to="/"
              className="flex items-center justify-center space-x-2 w-full py-3 bg-gradient-to-r from-brandIndigo to-brandIndigo/80 hover:from-brandIndigo hover:to-brandIndigo/90 text-white rounded-xl font-medium shadow-lg shadow-brandIndigo/25 transition-all duration-300 hover:scale-[1.02]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Public Atlas</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminGuard;
