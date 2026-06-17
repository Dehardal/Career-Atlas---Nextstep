import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Briefcase } from 'lucide-react';

const STATUS_MESSAGES = [
  "Connecting to Career Atlas Database...",
  "Loading educational pathway elements...",
  "Evaluating gateway requirements...",
  "Resolving entrance exam connections...",
  "Analyzing college program offerings...",
  "Structuring canvas columns...",
  "Rendering pathway diagnostics..."
];

export const PathwayLoader: React.FC = () => {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => {
        if (prev < STATUS_MESSAGES.length - 1) {
          return prev + 1;
        }
        return prev; // hold on the last step
      });
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-[#080C14] transition-colors duration-300 overflow-hidden z-10">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-brandCyan/10 rounded-full filter blur-3xl pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-brandIndigo/10 rounded-full filter blur-3xl pointer-events-none animate-pulse-slow" />

      <div className="max-w-md w-full flex flex-col items-center text-center space-y-10 z-10">
        
        {/* Animated Icon Pipeline */}
        <div className="flex items-center justify-center space-x-0 relative">
          
          {/* Start Point Node */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [1, 1.06, 1],
              opacity: 1
            }}
            transition={{ 
              scale: { repeat: Infinity, duration: 2, ease: "easeInOut" },
              opacity: { duration: 0.5 }
            }}
            className="w-14 h-14 rounded-2xl bg-cyan-500/10 dark:bg-brandCyan/10 text-cyan-600 dark:text-brandCyan flex items-center justify-center border border-cyan-500/30 dark:border-brandCyan/30 shadow-[0_0_20px_rgba(6,182,212,0.15)] relative"
          >
            <Search className="w-6 h-6" />
            <span className="absolute -bottom-6 text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Start</span>
          </motion.div>

          {/* Connecting Laser Wire 1 */}
          <div className="w-16 h-[2px] bg-slate-200 dark:bg-slate-800/80 relative overflow-hidden">
            <motion.div
              initial={{ left: "-100%" }}
              animate={{ left: "100%" }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
            />
          </div>

          {/* Intermediate Checkpoint Node */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [1, 1.06, 1],
              opacity: 1
            }}
            transition={{ 
              scale: { repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.3 },
              opacity: { duration: 0.5, delay: 0.2 }
            }}
            className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/30 shadow-[0_0_25px_rgba(168,85,247,0.15)] relative z-10"
          >
            <Sparkles className="w-7 h-7" />
            <span className="absolute -bottom-6 text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pathway</span>
          </motion.div>

          {/* Connecting Laser Wire 2 */}
          <div className="w-16 h-[2px] bg-slate-200 dark:bg-slate-800/80 relative overflow-hidden">
            <motion.div
              initial={{ left: "-100%" }}
              animate={{ left: "100%" }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear", delay: 0.75 }}
              className="absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-indigo-400 to-transparent"
            />
          </div>

          {/* Target Destination Node */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [1, 1.06, 1],
              opacity: 1
            }}
            transition={{ 
              scale: { repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.6 },
              opacity: { duration: 0.5, delay: 0.4 }
            }}
            className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)] relative"
          >
            <Briefcase className="w-6 h-6" />
            <span className="absolute -bottom-6 text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Career</span>
          </motion.div>

        </div>

        {/* Text Loader */}
        <div className="space-y-3 pt-4">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide uppercase">
            Calculating Career Pathway
          </h4>
          
          <div className="h-5 overflow-hidden flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={statusIndex}
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -15, opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="text-xs text-slate-650 dark:text-slate-400 font-medium font-mono block"
              >
                {STATUS_MESSAGES[statusIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* Outer Circular Traversal Radar Scan */}
        <div className="absolute w-[340px] h-[340px] border border-dashed border-slate-200 dark:border-white/5 rounded-full pointer-events-none opacity-50 flex items-center justify-center">
          <div className="absolute w-[220px] h-[220px] border border-dashed border-slate-200 dark:border-white/5 rounded-full" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
            className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_60%,rgba(6,182,212,0.04)_90%,rgba(6,182,212,0.1)_100%)] rounded-full"
          />
        </div>

      </div>
    </div>
  );
};
