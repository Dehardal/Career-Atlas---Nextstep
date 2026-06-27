import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Users,
  Target,
  Shield,
  Heart,
  Award,
  Sparkles,
  Cpu,
  GitFork,
  ArrowRight,
  TrendingUp,
  Map,
  BookOpen,
  GraduationCap
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vision' | 'architecture' | 'impact'>('vision');

  const pillars = [
    {
      icon: Target,
      title: 'Our Core Mission',
      desc: 'To eliminate educational uncertainty by mapping every academic stream, exam, and degree to its industry-proven career destination.',
      color: 'from-blue-500 to-indigo-500 shadow-blue-500/10'
    },
    {
      icon: Cpu,
      title: 'Graph-Based Routing',
      desc: 'Utilizes a custom node-and-edge system that calculates optimized academic paths based on strict prerequisite mappings.',
      color: 'from-cyan-500 to-teal-500 shadow-cyan-500/10'
    },
    {
      icon: Shield,
      title: 'Curated Integrity',
      desc: 'All nodes, exams, and institute profiles undergo multi-tier administrative approval to maintain 100% data trust.',
      color: 'from-indigo-500 to-purple-500 shadow-indigo-500/10'
    },
    {
      icon: Users,
      title: 'Community Driven',
      desc: 'Empowers students, educators, and mentors to contribute pathway proposals and suggestions directly to the atlas.',
      color: 'from-emerald-500 to-teal-500 shadow-emerald-500/10'
    }
  ];

  const techStack = [
    { name: 'React & TS', category: 'Frontend', desc: 'Type-safe interactive interface.' },
    { name: 'React Flow', category: 'Visualization', desc: 'Custom canvas for modular path mapping.' },
    { name: 'Tailwind CSS', category: 'Styling', desc: 'Glassmorphic tokens and responsive theme layouts.' },
    { name: 'Node.js & Express', category: 'Backend Engine', desc: 'Graph traversal and API aggregation layers.' },
    { name: 'MongoDB', category: 'Database', desc: 'Document model storing nodes, links, and schemas.' }
  ];

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-[#080C14] text-slate-900 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      {/* Decorative Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brandIndigo/10 dark:bg-brandIndigo/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brandCyan/10 dark:bg-brandCyan/5 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-20 relative z-10">
        
        {/* 1. HERO HEADER */}
        <section className="text-center space-y-6 max-w-3xl mx-auto py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brandIndigo/10 text-brandIndigo dark:text-brandCyan border border-brandIndigo/20 dark:border-brandCyan/15 text-xs font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Discovering Careers Differently</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black tracking-tight"
          >
            Bridging Academics and{' '}
            <span className="bg-gradient-to-r from-brandIndigo via-purple-500 to-brandCyan bg-clip-text text-transparent">
              Professional Realities
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-slate-550 dark:text-slate-400 leading-relaxed font-medium"
          >
            Career Atlas is an advanced visual pathway planner engineered to map out the entire student lifecycle. From high school streams to competitive exams, higher institutes, degree courses, and occupation outcomes—we chart them all.
          </motion.p>
        </section>

        {/* 2. CORE PILLARS GRID */}
        <section className="space-y-12">
          <div className="text-center space-y-3">
            <span className="text-[10px] text-brandIndigo dark:text-brandCyan font-bold uppercase tracking-widest">Platform Core</span>
            <h2 className="text-2xl sm:text-3xl font-black">How We Guide You Forward</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="glass p-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-white/70 dark:bg-[#0E1524]/65 shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${pillar.color} p-3 text-white flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{pillar.title}</h3>
                    <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">{pillar.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* 3. INTERACTIVE STORY BOARD & VISION */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <span className="text-[10px] text-brandIndigo dark:text-brandCyan font-bold uppercase tracking-widest">Interactive Context</span>
              <h2 className="text-3xl font-black">Connecting the Educational Dots</h2>
            </div>
            
            <p className="text-sm text-slate-550 dark:text-slate-400 leading-relaxed">
              Academic planning is traditionally scattered. Students must reference different portals for exams, check separate college catalogs, and search unrelated job boards to find a role requirement.
            </p>
            <p className="text-sm text-slate-550 dark:text-slate-400 leading-relaxed font-bold">
              Career Atlas unites these stages under one interactive, node-based map. By defining relationships as direct graph edges, we make paths transparent and fully navigable.
            </p>

            <div className="flex space-x-2 pt-2">
              {(['vision', 'architecture', 'impact'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab
                      ? 'bg-brandIndigo text-white shadow-lg shadow-brandIndigo/25'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-655 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="glass p-5 rounded-2xl border border-slate-250/60 dark:border-white/5 bg-white/50 dark:bg-[#0A0E17]/50 min-h-[120px]">
              <AnimatePresence mode="wait">
                {activeTab === 'vision' && (
                  <motion.div
                    key="vision"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2"
                  >
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Our Vision</h4>
                    <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
                      To empower every student in the country to plan their career path with complete database transparency. No hidden requirements, no guessing.
                    </p>
                  </motion.div>
                )}
                {activeTab === 'architecture' && (
                  <motion.div
                    key="architecture"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2"
                  >
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">The Tech Architecture</h4>
                    <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
                      Powered by a MongoDB backend storing academic nodes (streams, courses, roles) and a customized React Flow visualization canvas representing complex transitions visually.
                    </p>
                  </motion.div>
                )}
                {activeTab === 'impact' && (
                  <motion.div
                    key="impact"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2"
                  >
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Social Impact</h4>
                    <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
                      Providing free, open-source access to career blueprints helps level the playing field, giving students from all regions equal insight into competitive examinations and career milestones.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Graphical Mockup representation of educational stage connections */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass p-8 rounded-3xl border border-slate-200 dark:border-white/5 bg-gradient-to-br from-slate-100 to-white dark:from-[#0B101D] dark:to-[#0D1525] shadow-2xl relative flex flex-col justify-center space-y-6"
          >
            <div className="absolute top-4 left-4 flex space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>

            <div className="space-y-4 pt-4">
              <span className="text-[10px] text-brandCyan font-bold uppercase tracking-wider block">Pathway Demonstration</span>
              
              <div className="flex flex-col space-y-3">
                {/* Step 1 */}
                <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/5 shadow-sm">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Milestone 1: Stream Select</h4>
                    <p className="text-[10px] text-slate-400">Class 12 - Commerce</p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center my-0.5">
                  <ArrowRight className="w-4 h-4 text-brandIndigo rotate-90" />
                </div>

                {/* Step 2 */}
                <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/5 shadow-sm">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Milestone 2: Degree Choice</h4>
                    <p className="text-[10px] text-slate-400">Bachelor of Commerce (B.Com)</p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center my-0.5">
                  <ArrowRight className="w-4 h-4 text-brandIndigo rotate-90" />
                </div>

                {/* Step 3 */}
                <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/5 shadow-sm border-brandCyan bg-gradient-to-r from-brandCyan/5 to-transparent">
                  <div className="p-2 rounded-xl bg-brandCyan/10 text-brandCyan">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Target Outcome: Profession</h4>
                    <p className="text-[10px] text-slate-400">Investment Analyst / CPA</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 4. TECH DETAILS */}
        <section className="space-y-8 glass p-8 rounded-3xl border border-slate-200 dark:border-white/5 bg-white/40 dark:bg-slate-900/30">
          <div className="space-y-2">
            <span className="text-[10px] text-brandIndigo dark:text-brandCyan font-bold uppercase tracking-widest">Behind The Scenes</span>
            <h2 className="text-2xl font-black">Engineering Specifications</h2>
            <p className="text-xs text-slate-550 dark:text-slate-450">The reliable framework keeping our roadmaps precise and fast.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {techStack.map((tech, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 shadow-sm space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{tech.name}</span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-brandIndigo/10 text-brandIndigo dark:text-brandCyan">
                    {tech.category}
                  </span>
                </div>
                <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">{tech.desc}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};
