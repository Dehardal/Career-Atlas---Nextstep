import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Layers,
  Network,
  GraduationCap,
  Briefcase,
  Landmark,
  FileText,
  Sliders,
  Link2,
  Database,
  ArrowRight,
  RefreshCw,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { api } from '../../services/api';
import type { Node, EligibilityRule, InstituteCourseMapping, ValidationReport } from '../../services/api';

export const AdminDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [nodes, setNodes] = useState<Node[]>([]);
  const [rules, setRules] = useState<EligibilityRule[]>([]);
  const [mappings, setMappings] = useState<InstituteCourseMapping[]>([]);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const [nodesRes, rulesRes, mappingsRes, validationRes] = await Promise.all([
        api.getNodes({ limit: 1000 }),
        api.getEligibilityRules(),
        api.getInstituteCourses(),
        api.getValidationReport()
      ]);
      setNodes(nodesRes.nodes);
      setRules(rulesRes);
      setMappings(mappingsRes);
      setValidationReport(validationRes);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard data. Verify API connection.');
    } finally {
      setLoading(false);
    }
  };

  const getCountByType = (type: string) => {
    return nodes.filter((n) => n.type === type).length;
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-10 h-10 text-brandCyan animate-spin" />
        <p className="text-slate-400 text-sm animate-pulse">Assembling system metadata and metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-12">
        <p className="text-sm font-semibold">{error}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-white rounded-xl text-xs font-semibold transition-all border border-red-500/30"
        >
          Retry Load
        </button>
      </div>
    );
  }

  const nodeStats = [
    { label: 'Education Milestones', type: 'QUALIFICATION', count: getCountByType('QUALIFICATION'), icon: Award, to: '/admin/qualifications', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { label: 'Academic Streams', type: 'STREAM', count: getCountByType('STREAM'), icon: Layers, to: '/admin/streams', color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20' },
    { label: 'Subject Combinations', type: 'SUBJECT_COMBINATION', count: getCountByType('SUBJECT_COMBINATION'), icon: Network, to: '/admin/subject-combinations', color: 'text-pink-600 dark:text-pink-400 bg-pink-500/10 border-pink-500/20' },
    { label: 'Degree Courses', type: 'DEGREE', count: getCountByType('DEGREE'), icon: GraduationCap, to: '/admin/degrees', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Target Careers', type: 'OCCUPATION', count: getCountByType('OCCUPATION'), icon: Briefcase, to: '/admin/occupations', color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { label: 'Colleges & Universities', type: 'INSTITUTE', count: getCountByType('INSTITUTE'), icon: Landmark, to: '/admin/institutes', color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
    { label: 'Entrance Exams', type: 'EXAM', count: getCountByType('EXAM'), icon: FileText, to: '/admin/exams', color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20' },
  ];

  const criticalIssuesCount = validationReport
    ? validationReport.issues.filter((i) => i.severity === 'CRITICAL' || i.severity === 'HIGH').length
    : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Welcome / Health Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass p-6 rounded-2xl border border-slate-200/50 dark:border-white/5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brandCyan/10 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Console Overview</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
              Manage eligibility gates, structure degree requirements, design pathways, and link academic colleges to entrance tests. Check diagnostic health status frequently to keep the Career Roadmap engine clean and accurate.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center space-x-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 px-4 py-2.5 rounded-xl">
              <Database className="w-5 h-5 text-cyan-600 dark:text-brandCyan" />
              <div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase">Pathway Elements</div>
                <div className="text-base font-bold text-slate-950 dark:text-white">{nodes.length}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 px-4 py-2.5 rounded-xl">
              <Sliders className="w-5 h-5 text-indigo-600 dark:text-brandIndigo" />
              <div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase">Active Rules</div>
                <div className="text-base font-bold text-slate-950 dark:text-white">{rules.length}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 px-4 py-2.5 rounded-xl">
              <Link2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase">College Offerings</div>
                <div className="text-base font-bold text-slate-950 dark:text-white">{mappings.length}</div>
              </div>
            </div>
          </div>
        </div>

        <div className={`glass p-6 rounded-2xl border flex flex-col justify-between relative overflow-hidden ${
          criticalIssuesCount > 0 
            ? 'border-red-500/20 bg-red-500/5' 
            : 'border-emerald-500/20 bg-emerald-500/5'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">System Diagnostics & Integrity</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                criticalIssuesCount > 0 
                  ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30' 
                  : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
              }`}>
                {criticalIssuesCount > 0 ? 'Attention Needed' : 'Healthy'}
              </span>
            </div>

            <div className="mt-4 flex items-center space-x-4">
              {criticalIssuesCount > 0 ? (
                <div className="p-3 bg-red-100 dark:bg-red-500/10 rounded-xl text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                  <Flame className="w-8 h-8 animate-pulse" />
                </div>
              ) : (
                <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              )}
              <div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {validationReport ? validationReport.summary.totalIssues : 0}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">consistency warnings detected</div>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
              {criticalIssuesCount > 0
                ? `${criticalIssuesCount} of the issues are of high or critical severity. Check the report immediately to resolve broken pathways.`
                : 'All pathway connections, rules, exams, and program catalogs are fully verified and integrated with no circular cycles or dangling edges.'}
            </p>
          </div>

          <Link
            to="/admin/validation"
            className="flex items-center justify-center space-x-2 w-full mt-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-xl border border-slate-200 dark:border-white/5 transition-all"
          >
            <span>View Full Report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Node Counts Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pathway Elements Catalog</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {nodeStats.map((stat) => (
            <Link
              key={stat.type}
              to={stat.to}
              className="glass p-5 rounded-2xl border border-slate-200/50 dark:border-white/5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-xl border ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{stat.count}</span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{stat.label}</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Advanced Engines Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl border border-slate-200/50 dark:border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 dark:text-white">Pathway Eligibility Rules</h4>
            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-brandIndigo/10 text-indigo-700 dark:text-brandIndigo text-[10px] font-bold rounded border border-indigo-200 dark:border-brandIndigo/25">
              Eligibility criteria
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Create gate policies whitelisting or blocking transitions (e.g. PCM to B.Tech, Commerce to MBBS). Require mandatory exam attempts or minimum degrees.
          </p>
          <Link
            to="/admin/rules"
            className="inline-flex items-center space-x-2 text-xs font-semibold text-cyan-600 dark:text-brandCyan hover:underline"
          >
            <span>Manage Eligibility criteria</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="glass p-6 rounded-2xl border border-slate-200/50 dark:border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 dark:text-white">College Course Catalog</h4>
            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded border border-emerald-200 dark:border-emerald-400/25">
              Linked Offerings
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Link Academic Institutes to Degrees, Specializations, and Entrance Exams. Control seat capacities, estimated fees, and placement records.
          </p>
          <Link
            to="/admin/mappings"
            className="inline-flex items-center space-x-2 text-xs font-semibold text-cyan-600 dark:text-brandCyan hover:underline"
          >
            <span>Manage Offerings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="glass p-6 rounded-2xl border border-slate-200/50 dark:border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 dark:text-white">Integrity Diagnostics</h4>
            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-400/10 text-red-700 dark:text-red-400 text-[10px] font-bold rounded border border-red-200 dark:border-red-400/25">
              Integrity Checks
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Run structural integrity queries detecting duplicates, dead ends, circular reference logic, missing rules, and missing exam relationships.
          </p>
          <Link
            to="/admin/validation"
            className="inline-flex items-center space-x-2 text-xs font-semibold text-cyan-600 dark:text-brandCyan hover:underline"
          >
            <span>Check System Integrity</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-600 dark:text-brandCyan" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
