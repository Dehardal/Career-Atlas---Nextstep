import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowLeft, Loader2, Sparkles, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useRoadmapStore } from '../../store/useRoadmapStore';

interface AdminGuardProps {
  children: React.ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const loginWithGoogle = useRoadmapStore((state) => state.loginWithGoogle);
  const [currentRole, setCurrentRole] = useState(() => localStorage.getItem('userRole') || 'STUDENT');

  // Login Form States
  const [email, setEmail] = useState('admin.demo@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all authorization fields.');
      return;
    }

    setIsLoading(true);

    // Simulate database lookup/validation
    setTimeout(() => {
      const emailStr = email.toLowerCase().trim();
      if (emailStr === 'admin.demo@gmail.com' && password === 'admin123') {
        localStorage.setItem('userRole', 'ADMIN');
        loginWithGoogle('admin.demo@gmail.com', 'Admin System', 'ADMIN');
        setCurrentRole('ADMIN');
      } else {
        setError('Invalid administrative credentials. Access denied.');
      }
      setIsLoading(false);
    }, 850); // Small processing delay for security feel
  };

  if (currentRole !== 'ADMIN') {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-brandIndigo/5 dark:bg-brandIndigo/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-brandCyan/5 dark:bg-brandCyan/10 blur-[100px] pointer-events-none" />

        <div className="max-w-md w-full glass p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl relative bg-white/90 dark:bg-[#0C111E]/95 backdrop-blur-md transition-colors duration-300">
          {/* Circular Shield icon header */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-brandIndigo/10 border border-brandIndigo/25 rounded-full text-brandIndigo dark:text-brandCyan relative">
              <Shield className="w-12 h-12 animate-pulse" />
              <Lock className="w-5 h-5 absolute bottom-0 right-0 bg-slate-50 dark:bg-[#0c1322] border border-brandIndigo/25 rounded-full p-1" />
            </div>
          </div>

          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brandIndigo/10 border border-brandIndigo/20 text-brandIndigo dark:text-brandCyan text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-brandCyan" />
              <span>Admin Secure Gateway</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              System Authorization
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Provide credentials to access administrative dashboard & rules configuration.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin.demo@gmail.com"
                  required
                  disabled={isLoading}
                  className="w-full bg-slate-50 dark:bg-[#080C14] border border-slate-200 dark:border-white/5 focus:border-brandCyan dark:focus:border-brandCyan focus:ring-0 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-650 text-xs rounded-xl pl-10 pr-4 py-3 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Authorization Key
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Type password..."
                  required
                  disabled={isLoading}
                  className="w-full bg-slate-50 dark:bg-[#080C14] border border-slate-200 dark:border-white/5 focus:border-brandCyan dark:focus:border-brandCyan focus:ring-0 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-650 text-xs rounded-xl pl-10 pr-10 py-3 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-brandCyan to-brandIndigo text-white rounded-xl text-xs font-extrabold shadow-lg shadow-brandIndigo/25 transition-all active:scale-95 disabled:opacity-55 disabled:cursor-not-allowed hover:brightness-[1.03]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Authorize System Portal</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick info tip for review convenience */}
          <div className="mt-5 p-3 bg-slate-50 dark:bg-white/3 border border-slate-200/50 dark:border-white/5 rounded-xl text-[10px] text-slate-500 dark:text-slate-450 leading-relaxed">
            💡 <strong>Demo Mode Credentials:</strong><br />
            Email: <code className="text-brandCyan">admin.demo@gmail.com</code><br />
            Password: <code className="text-brandCyan">admin123</code>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex justify-center">
            <Link
              to="/"
              className="inline-flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 hover:dark:text-white transition-colors"
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
