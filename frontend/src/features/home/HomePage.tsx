import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Briefcase,
  GraduationCap,
  FileText,
  Landmark,
  ArrowRight,
  Search,
  Map,
  Sparkles,
  PlusCircle,
  ChevronDown,
  Layers,
  Trophy
} from 'lucide-react';
import { api } from '../../services/api';
import type { Node } from '../../services/api';
import { useRoadmapStore } from '../../store/useRoadmapStore';
import { CustomDropdown } from '../../components/common/CustomDropdown';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { setStartNode, setTargetNode } = useRoadmapStore();

  const [qualifications, setQualifications] = useState<Node[]>([]);
  const [careers, setCareers] = useState<Node[]>([]);
  const [selectedStart, setSelectedStart] = useState<string>('');
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Landing Page Interactive States
  const [activeTrackerStep, setActiveTrackerStep] = useState(0);
  const [activeTab, setActiveTab] = useState<'pathfinder' | 'explorer' | 'compare'>('pathfinder');
  const [explorerMockExpanded, setExplorerMockExpanded] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const qualsRes = await api.getNodes({ type: 'QUALIFICATION', limit: 100 });
        const careersRes = await api.getNodes({ type: 'OCCUPATION', limit: 100 });
        
        setQualifications(qualsRes.nodes);
        setCareers(careersRes.nodes);
      } catch (err) {
        console.error('Failed to load initial nodes', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Hero micro-roadmap simulation interval
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTrackerStep((prev) => (prev + 1) % 4);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const handleSearchRoute = () => {
    const startObj = qualifications.find((q) => q._id === selectedStart);
    const targetObj = careers.find((c) => c._id === selectedTarget);

    if (startObj) setStartNode(startObj);
    if (targetObj) setTargetNode(targetObj);

    navigate('/roadmap');
  };

  const startOptions = qualifications.map((q) => ({
    value: q._id,
    label: q.name,
    icon: Search
  }));

  const targetOptions = careers.map((c) => ({
    value: c._id,
    label: c.name,
    icon: Briefcase
  }));

  const trackerSteps = [
    { title: 'School Stage', detail: 'Class 12 - Science', icon: Layers, color: 'text-amber-500 bg-amber-500/10' },
    { title: 'Entrance Gate', detail: 'JEE Advanced Exam', icon: FileText, color: 'text-red-500 bg-red-500/10' },
    { title: 'College Pathway', detail: 'B.Tech Computer Science', icon: GraduationCap, color: 'text-blue-500 bg-blue-500/10' },
    { title: 'Target Goal', detail: 'AI Software Engineer', icon: Briefcase, color: 'text-emerald-500 bg-emerald-500/10' }
  ];

  const workflowSteps = [
    {
      num: '01',
      title: 'Define Current Stage',
      desc: 'Select your starting qualification level or High School stream to load accurate requirements.',
      icon: Search,
      color: 'from-amber-500 to-orange-500'
    },
    {
      num: '02',
      title: 'Analyze Alternative Paths',
      desc: 'Our engine traces prerequisite rules to outline all valid roadmaps leading to your goal.',
      icon: Map,
      color: 'from-blue-500 to-indigo-500'
    },
    {
      num: '03',
      title: 'Match & Compare Colleges',
      desc: 'Launch side-drawer profiles to filter offering institutes by fees, locations, and packages.',
      icon: Landmark,
      color: 'from-cyan-500 to-teal-500'
    }
  ];

  const statsItems = [
    { count: '5,000+', label: 'Offering Colleges', desc: 'NIRF ranked Govt & Private profiles', icon: Landmark, border: 'hover:border-cyan-500/30' },
    { count: '200+', label: 'Discovered Pathways', desc: 'Dynamic visual academic connections', icon: Map, border: 'hover:border-indigo-500/30' },
    { count: '50+', label: 'National Exams', desc: 'Conducting dates & stream criteria', icon: FileText, border: 'hover:border-red-500/30' },
    { count: '10,000+', label: 'Student Decisions', desc: 'Saves, bookmarks & custom maps', icon: Trophy, border: 'hover:border-emerald-500/30' },
  ];

  const faqs = [
    {
      q: 'How does Career Atlas calculate alternative paths?',
      a: 'Our graph traversal engine analyzes prerequisite eligibility rules, admission exams, and degree streams to outline all possible sequential paths between your current qualification and target profession.'
    },
    {
      q: 'Can I save my roadmaps and access them later?',
      a: 'Absolutely! By logging in with Google, you unlock a private Student Dashboard where you can save pathway planners, reload them instantly on the canvas, and manage bookmarked items.'
    },
    {
      q: 'What is the difference between Path Finder and Interactive Explorer?',
      a: 'Path Finder plots the end-to-end route to a chosen dream career. Interactive Explorer lets you start from a single stage and build a roadmap organically by expanding connections branch-by-branch.'
    },
    {
      q: 'How can I suggest missing colleges or qualifications?',
      a: 'We support crowdsourcing! Click the "Suggest Pathway Opportunity" button in the contribution panel below to submit missing nodes. Our review team verifies and seeds suggestions weekly.'
    }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.12 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25 } }
  };

  return (
    <div className="w-full flex flex-col items-center bg-slate-50 dark:bg-[#080C14] text-slate-800 dark:text-slate-100 transition-colors duration-300 relative overflow-hidden">
      
      {/* Background Grids & Radial Ambient Mesh Rings */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-15 pointer-events-none z-0" />
      <div className="absolute top-[-10%] left-[-20%] w-[600px] h-[600px] rounded-full bg-brandCyan/5 dark:bg-brandCyan/10 blur-[150px] pointer-events-none z-0" />
      <div className="absolute top-[40%] right-[-20%] w-[600px] h-[600px] rounded-full bg-brandIndigo/5 dark:bg-brandIndigo/10 blur-[150px] pointer-events-none z-0" />

      {/* 1. HERO SECTION (Full Viewport bleed) */}
      <section className="w-full relative py-20 lg:py-28 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center"
          >
            {/* Left Info & Form Column */}
            <div className="lg:col-span-7 space-y-8 text-left">
              <motion.div variants={itemVariants} className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brandIndigo/15 border border-brandIndigo/30 text-cyan-600 dark:text-brandCyan text-xs font-bold tracking-wide shadow-sm">
                <Compass className="w-3.5 h-3.5 animate-spin-slow text-brandCyan" />
                <span>Interactive Career Navigation System</span>
              </motion.div>
              
              <motion.h1 variants={itemVariants} className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.08]">
                Chart the shortest path to your{' '}
                <span className="bg-gradient-to-r from-brandCyan via-brandIndigo to-purple-500 bg-clip-text text-transparent">
                  Dream Career
                </span>
              </motion.h1>

              <motion.p variants={itemVariants} className="text-slate-600 dark:text-slate-400 text-lg max-w-xl leading-relaxed">
                Explore dynamic horizontal path timelines, analyze eligibility rules, discover matching colleges, and build custom visual educational structures.
              </motion.p>

              {/* GPS Navigator Form */}
              <motion.div
                variants={itemVariants}
                className="glass p-6 sm:p-8 rounded-3xl w-full shadow-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#0C101D]/90 space-y-6 relative overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Where are you currently?
                    </label>
                    <CustomDropdown
                      options={startOptions}
                      value={selectedStart}
                      onChange={setSelectedStart}
                      placeholder="Choose starting point..."
                      showSearch={true}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      What is your Dream Career?
                    </label>
                    <CustomDropdown
                      options={targetOptions}
                      value={selectedTarget}
                      onChange={setSelectedTarget}
                      placeholder="Choose a profession..."
                      showSearch={true}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02, filter: 'brightness(1.05)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSearchRoute}
                    disabled={!selectedStart || !selectedTarget || loading}
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-brandCyan to-brandIndigo text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-brandIndigo/35 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Map className="w-5 h-5" />
                    <span>Generate Roadmap</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            </div>

            {/* Right Simulation Column */}
            <div className="lg:col-span-5 flex justify-center items-center">
              <motion.div
                variants={itemVariants}
                className="relative w-full max-w-[390px] glass p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-[#0A0F1D]/80 shadow-2xl overflow-hidden"
              >
                {/* Visual accent glows */}
                <div className="absolute top-[-10%] right-[-10%] w-32 h-32 rounded-full bg-cyan-500/20 blur-xl pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 rounded-full bg-indigo-500/20 blur-xl pointer-events-none" />

                <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-4 mb-4">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-brandCyan bg-brandCyan/10 border border-brandCyan/20 px-2.5 py-1 rounded-md">
                    Pathway Simulation
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[10px] text-slate-400 font-bold">Live Tracker</span>
                  </span>
                </div>

                {/* Steps rendering */}
                <div className="space-y-4 relative">
                  {/* Connecting line */}
                  <div className="absolute left-[22px] top-6 bottom-6 w-0.5 bg-slate-200 dark:bg-slate-800" />
                  
                  {/* Moving glow dot */}
                  <motion.div
                    animate={{ y: activeTrackerStep * 56 + 13 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                    className="absolute left-[20px] w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] z-10"
                  />

                  {trackerSteps.map((step, idx) => {
                    const isActive = activeTrackerStep === idx;
                    const StepIcon = step.icon;

                    return (
                      <motion.div
                        key={idx}
                        animate={{ scale: isActive ? 1.02 : 1, opacity: isActive ? 1 : 0.55 }}
                        className={`flex items-center space-x-4 p-2.5 rounded-2xl transition-all duration-300 ${
                          isActive 
                            ? 'bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 shadow-inner' 
                            : 'border border-transparent'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-slate-200/20 dark:border-white/5 ${step.color}`}>
                          <StepIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9px] text-slate-500 block uppercase font-mono tracking-wide">{step.title}</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">{step.detail}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. HOW IT WORKS SECTION (Widescreen contrasting bar) */}
      <section className="w-full py-20 bg-slate-100/80 dark:bg-[#070B13]/80 border-y border-slate-200 dark:border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Simplifying Navigation</span>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">How Career Atlas Works</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Three modular stages engineered to bridge qualifications with real professional fields.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {workflowSteps.map((step, idx) => {
                const StepIcon = step.icon;
                return (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -5 }}
                    className="glass p-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-white/70 dark:bg-[#0B0F19]/70 relative flex flex-col justify-between shadow-md"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className={`p-3 rounded-2xl bg-gradient-to-r ${step.color} text-white`}>
                          <StepIcon className="w-5 h-5" />
                        </div>
                        <span className="text-3xl font-black font-mono text-slate-200 dark:text-slate-800">{step.num}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{step.title}</h3>
                      <p className="text-xs text-slate-655 dark:text-slate-450 leading-relaxed">{step.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 3. CAPABILITIES SHOWCASE / SANDBOX */}
      <section className="w-full py-20 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest">Capabilities Sandbox</span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">Product Interactive Mockups</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Interactive systems built to match students to target portfolios. Toggle tabs below to test live components.
            </p>
          </div>

          {/* Tabs header */}
          <div className="flex justify-center">
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200/60 dark:border-white/5 max-w-lg w-full">
              {[
                { id: 'pathfinder', label: 'Path Finder' },
                { id: 'explorer', label: 'Interactive Explorer' },
                { id: 'compare', label: 'College Matrix' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 text-center py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-brandCyan to-brandIndigo text-white shadow-lg'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabs Body / Mockups */}
          <div className="glass max-w-4xl mx-auto rounded-3xl border border-slate-200 dark:border-white/5 bg-white/40 dark:bg-[#090D16]/40 p-6 md:p-10 shadow-2xl relative min-h-[320px] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />

            <AnimatePresence mode="wait">
              {activeTab === 'pathfinder' && (
                <motion.div
                  key="pathfinder"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="w-full flex flex-col md:flex-row items-center justify-around gap-6 py-6"
                >
                  {/* Step 1 */}
                  <div className="glass p-4 rounded-2xl border border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#0E1524] text-center w-44">
                    <span className="text-[10px] text-amber-500 font-mono font-bold">STEP 1</span>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white mt-1">Class 12 Commerce</h4>
                  </div>
                  {/* Connect arrow */}
                  <ArrowRight className="w-5 h-5 text-brandCyan animate-pulse rotate-90 md:rotate-0" />
                  {/* Step 2 */}
                  <div className="glass p-4 rounded-2xl border border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#0E1524] text-center w-44">
                    <span className="text-[10px] text-blue-500 font-mono font-bold">STEP 2</span>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white mt-1">B.Com Degree</h4>
                  </div>
                  {/* Connect arrow */}
                  <ArrowRight className="w-5 h-5 text-brandCyan animate-pulse rotate-90 md:rotate-0" />
                  {/* Step 3 */}
                  <div className="glass p-4 rounded-2xl border border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#0E1524] text-center w-44">
                    <span className="text-[10px] text-emerald-500 font-mono font-bold">GOAL</span>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white mt-1">Financial Analyst</h4>
                  </div>
                </motion.div>
              )}

              {activeTab === 'explorer' && (
                <motion.div
                  key="explorer"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="w-full flex flex-col items-center py-4 space-y-6"
                >
                  {/* Root Node */}
                  <div className="glass p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#0E1524] text-center w-52 relative">
                    <span className="text-[8px] bg-blue-500/10 border border-blue-500/25 px-1.5 py-0.5 rounded text-blue-500 dark:text-blue-400 font-bold uppercase">Root Milestone</span>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white mt-2">B.Tech Degree</h4>
                    <button
                      onClick={() => setExplorerMockExpanded(!explorerMockExpanded)}
                      className="mt-3 text-[10px] font-bold text-cyan-500 dark:text-cyan-400 hover:underline flex items-center justify-center mx-auto space-x-1"
                    >
                      <span>{explorerMockExpanded ? '- Collapse Node' : '+ Expand Node'}</span>
                    </button>
                  </div>

                  {/* Dynamic sub branches */}
                  <AnimatePresence>
                    {explorerMockExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col md:flex-row items-center justify-center gap-4 w-full"
                      >
                        {['Software Engineer', 'Data Scientist', 'DevOps Specialist'].map((role, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="glass p-3 rounded-xl border border-slate-200 dark:border-white/5 bg-white/60 dark:bg-slate-900/80 text-center w-40"
                          >
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-450 font-bold font-mono">CAREER</span>
                            <h5 className="text-[11px] font-bold text-slate-700 dark:text-slate-350 mt-1">{role}</h5>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {activeTab === 'compare' && (
                <motion.div
                  key="compare"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="w-full overflow-x-auto py-2"
                >
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-white/5 text-[9px] text-slate-500 uppercase font-bold tracking-wider">
                        <th className="py-2.5 px-4">Institute</th>
                        <th className="py-2.5 px-4">NIRF Rank</th>
                        <th className="py-2.5 px-4">Annual Fees</th>
                        <th className="py-2.5 px-4 text-center">Placements</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                      {[
                        { name: 'IIT Delhi', rank: '#2', fees: '₹2.2L', placement: '96%' },
                        { name: 'BITS Pilani', rank: '#25', fees: '₹4.8L', placement: '92%' },
                        { name: 'VIT Vellore', rank: '#11', fees: '₹3.9L', placement: '87%' },
                      ].map((mock, i) => (
                        <tr key={i} className="hover:bg-slate-100 hover:dark:bg-white/5 transition-all">
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{mock.name}</td>
                          <td className="py-3 px-4 text-amber-500 font-bold">{mock.rank}</td>
                          <td className="py-3 px-4 text-emerald-600 dark:text-emerald-450 font-bold">{mock.fees}</td>
                          <td className="py-3 px-4 text-center font-bold text-cyan-600 dark:text-brandCyan">{mock.placement}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 4. STATISTICS STRIP */}
      <section className="w-full py-20 bg-slate-100/50 dark:bg-[#070B13]/50 border-y border-slate-200 dark:border-white/5 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsItems.map((stat, i) => {
              const StatIcon = stat.icon;
              return (
                <motion.div
                  key={i}
                  whileHover={{ y: -4 }}
                  className={`glass p-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-white/60 dark:bg-[#0A0E1A]/40 flex flex-col items-center text-center shadow-md transition-all duration-300 ${stat.border}`}
                >
                  <div className="p-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl mb-3 shrink-0">
                    <StatIcon className="w-5 h-5 text-cyan-500" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stat.count}</h3>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1 uppercase tracking-wider font-mono">{stat.label}</h4>
                  <p className="text-[10px] text-slate-500 mt-2.5 leading-relaxed">{stat.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. COLLAPSIBLE FAQ SECTION */}
      <section className="w-full py-20 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 w-full space-y-12">
          <div className="text-center space-y-2">
            <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Support FAQ</span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Everything you need to know about the Career Atlas pathway engine.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="glass rounded-2xl border border-slate-200 dark:border-white/5 bg-white/50 dark:bg-[#0B101D]/45 overflow-hidden transition-all shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:bg-slate-50 hover:dark:bg-white/3 transition-colors"
                  >
                    <span className="mr-4 leading-snug">{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-brandCyan' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="p-5 pt-0 border-t border-slate-200/50 dark:border-white/5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION PANEL (CTA) */}
      <section className="w-full py-16 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            whileHover={{ y: -3 }}
            className="glass rounded-3xl p-8 sm:p-14 border border-slate-200 dark:border-white/10 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 dark:from-[#0B101D] dark:to-[#0F1629] shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8"
          >
            {/* Glow spots */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brandIndigo/10 rounded-full filter blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full filter blur-3xl pointer-events-none" />

            <div className="space-y-4 max-w-xl text-left">
              <div className="flex items-center space-x-2 text-brandCyan font-semibold">
                <Sparkles className="w-5 h-5 text-brandCyan" />
                <span className="text-xs uppercase tracking-wider font-mono font-bold">Crowdsourced Database</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Contribute to Career Atlas
              </h2>
              <p className="text-sm text-slate-650 dark:text-slate-400 leading-relaxed">
                Is our pathway engine missing a degree, exam, institute, or target career? Help visitors discover optimal routes by submitting new nodes. All suggestions go straight to our review console!
              </p>
            </div>

            <div className="shrink-0 w-full md:w-auto">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  const footerEl = document.getElementById('footer');
                  if (footerEl) {
                    footerEl.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="w-full md:w-auto flex items-center justify-center space-x-2 px-6 py-4 rounded-2xl bg-gradient-to-r from-brandCyan via-brandIndigo to-purple-500 text-white font-bold text-sm shadow-lg shadow-brandIndigo/25"
              >
                <PlusCircle className="w-4.5 h-4.5" />
                <span>Suggest Pathway Opportunity</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
