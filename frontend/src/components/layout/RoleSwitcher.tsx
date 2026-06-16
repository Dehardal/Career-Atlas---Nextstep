import React, { useState } from 'react';
import { Shield, User, RefreshCw } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const [role, setRole] = useState<'STUDENT' | 'ADMIN'>(() => {
    const saved = localStorage.getItem('userRole');
    return (saved as 'STUDENT' | 'ADMIN') || 'STUDENT';
  });

  const toggleRole = () => {
    const newRole = role === 'STUDENT' ? 'ADMIN' : 'STUDENT';
    localStorage.setItem('userRole', newRole);
    setRole(newRole);
    // Dispatch a custom event to notify components if they listen,
    // and reload the window to reset route guards.
    window.dispatchEvent(new Event('roleChange'));
    window.location.reload();
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-bounce-subtle">
      <button
        onClick={toggleRole}
        className={`flex items-center space-x-2 px-4 py-3 rounded-full border glass backdrop-blur-xl shadow-2xl transition-all duration-300 group hover:scale-105 active:scale-95 ${
          role === 'ADMIN'
            ? 'border-brandCyan/40 bg-brandCyan/10 text-brandCyan shadow-brandCyan/20'
            : 'border-brandIndigo/40 bg-brandIndigo/10 text-brandIndigo shadow-brandIndigo/20'
        }`}
      >
        {role === 'ADMIN' ? (
          <Shield className="w-5 h-5 animate-pulse" />
        ) : (
          <User className="w-5 h-5" />
        )}
        <span className="text-sm font-semibold tracking-wide">
          Role: {role}
        </span>
        <RefreshCw className="w-4 h-4 text-slate-400 group-hover:rotate-180 transition-transform duration-500" />
      </button>
    </div>
  );
};

export default RoleSwitcher;
