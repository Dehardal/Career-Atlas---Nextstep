import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  PlusCircle
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

  const dashboardCards = [
    {
      title: 'Career Explorer',
      desc: 'Browse in-demand professions, high growth rate sectors, and average salary benchmarks.',
      path: '/careers',
      icon: Briefcase,
      color: 'text-emerald-600 dark:text-emerald-450 bg-emerald-500/10 border-emerald-500/20 dark:border-emerald-500/10 hover:border-emerald-500/40',
    },
    {
      title: 'Degree Explorer',
      desc: 'Discover undergraduate and postgraduate degrees, durations, and eligibility rules.',
      path: '/degrees',
      icon: GraduationCap,
      color: 'text-blue-600 dark:text-blue-455 bg-blue-500/10 border-blue-500/20 dark:border-blue-500/10 hover:border-blue-500/40',
    },
    {
      title: 'Exam Explorer',
      desc: 'Find national and state-level entrance exams, conducting bodies, and registration details.',
      path: '/exams',
      icon: FileText,
      color: 'text-red-650 dark:text-red-400 bg-red-500/10 border-red-500/20 dark:border-red-500/10 hover:border-red-500/40',
    },
    {
      title: 'Institute Explorer',
      desc: 'Search leading government and private colleges ranked by NIRF with locations.',
      path: '/institutes',
      icon: Landmark,
      color: 'text-cyan-600 dark:text-brandCyan bg-cyan-500/10 border-cyan-500/20 dark:border-cyan-500/10 hover:border-cyan-500/40',
    },
  ];

  // Framer motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col space-y-16"
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brandIndigo/10 border border-brandIndigo/35 text-cyan-700 dark:text-brandCyan text-sm font-medium mb-4 shadow-sm">
          <Compass className="w-4 h-4 animate-spin-slow" />
          <span>Interactive Career Navigation System</span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
          Your Career GPS:{' '}
          <span className="bg-gradient-to-r from-brandCyan via-brandIndigo to-purple-500 bg-clip-text text-transparent">
            Chart Your Course
          </span>
        </h1>

        <p className="text-slate-650 dark:text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
          Explore educational pathways, discover degrees, and find the shortest road to your target occupation. Custom-tailored pathway steps driven by real data.
        </p>
      </motion.div>

      {/* GPS Navigator Form */}
      <motion.div
        variants={itemVariants}
        className="glass p-6 sm:p-8 rounded-3xl max-w-4xl mx-auto w-full shadow-2xl relative z-20 border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/70"
      >
        {/* Glow behind */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brandCyan/5 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brandIndigo/5 rounded-full filter blur-3xl pointer-events-none" />

        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-2">
              Where are you currently? (Starting Point)
            </label>
            <CustomDropdown
              options={startOptions}
              value={selectedStart}
              onChange={setSelectedStart}
              placeholder="Choose your education level..."
              showSearch={true}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-355 mb-2">
              What is your Dream Career? (Target Point)
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

        <div className="mt-8 flex justify-center">
          <motion.button
            whileHover={{ scale: 1.02, filter: 'brightness(1.05)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSearchRoute}
            disabled={!selectedStart || !selectedTarget || loading}
            className="flex items-center space-x-2 bg-gradient-to-r from-brandCyan to-brandIndigo text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-brandIndigo/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Map className="w-5 h-5" />
            <span>Generate Roadmap</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>

      {/* Grid Explorers Section */}
      <motion.div variants={itemVariants} className="space-y-8">
        <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white">Explore Educational Components</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardCards.map((card) => (
            <motion.div
              key={card.title}
              whileHover={{ y: -6, scale: 1.02 }}
              onClick={() => navigate(card.path)}
              className={`glass p-6 rounded-2xl cursor-pointer border flex flex-col justify-between group h-full shadow-md bg-white/40 dark:bg-slate-900/40 hover:shadow-xl transition-all duration-300 ${card.color}`}
            >
              <div>
                <div className="mb-4 p-3 rounded-xl bg-white/80 dark:bg-slate-950/40 w-fit shadow-sm">
                  <card.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">{card.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">{card.desc}</p>
              </div>
              <span className="flex items-center text-xs font-bold group-hover:translate-x-1.5 transition-transform duration-300 mt-auto">
                Explore Now <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Contribution Portal Section */}
      <motion.div
        variants={itemVariants}
        className="glass rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-white/10 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-[#0B101D] dark:to-[#0F1629] shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-brandIndigo/5 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full filter blur-3xl pointer-events-none" />

        <div className="space-y-4 max-w-xl">
          <div className="flex items-center space-x-2 text-brandCyan dark:text-brandCyan font-semibold">
            <Sparkles className="w-5 h-5 text-brandCyan" />
            <span className="text-xs uppercase tracking-wider">Crowdsourced Repository</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Contribute to Career Atlas
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
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
            className="w-full md:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-brandCyan via-brandIndigo to-purple-500 text-white font-bold text-sm shadow-lg shadow-brandIndigo/25"
          >
            <PlusCircle className="w-4.5 h-4.5" />
            <span>Suggest Pathway Opportunity</span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HomePage;
