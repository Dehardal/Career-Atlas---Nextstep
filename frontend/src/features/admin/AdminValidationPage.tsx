import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  RefreshCw, 
  AlertOctagon, 
  AlertTriangle, 
  HelpCircle, 
  Info, 
  CheckCircle2, 
  Flame, 
  Database,
  ArrowRight
} from 'lucide-react';
import { api } from '../../services/api';
import type { ValidationReport, ValidationIssue } from '../../services/api';

export const AdminValidationPage: React.FC = () => {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'STRUCTURAL' | 'CONFLICTS' | 'COMPLETENESS' | 'DUPLICATES'>('ALL');

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getValidationReport();
      setReport(data);
    } catch (err) {
      console.error(err);
      setError('Failed to run diagnostics checks. Verify backend API connection.');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredIssues = (issues: ValidationIssue[]) => {
    switch (selectedFilter) {
      case 'STRUCTURAL':
        return issues.filter(i => i.type === 'BROKEN_RELATIONSHIP' || i.type === 'CIRCULAR_RELATIONSHIP');
      case 'CONFLICTS':
        return issues.filter(i => i.type === 'INVALID_DEGREE_PATHWAY');
      case 'COMPLETENESS':
        return issues.filter(i => i.type === 'MISSING_ENTRANCE_EXAM_RELATION' || i.type === 'MISSING_ELIGIBILITY_RULE');
      case 'DUPLICATES':
        return issues.filter(i => i.type === 'DUPLICATE_CAREER' || i.type === 'DUPLICATE_INSTITUTE');
      default:
        return issues;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400',
          badge: 'bg-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.4)]',
          icon: Flame
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30 text-orange-700 dark:text-orange-400',
          badge: 'bg-orange-500 text-white',
          icon: AlertOctagon
        };
      case 'MEDIUM':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30 text-yellow-700 dark:text-yellow-400',
          badge: 'bg-yellow-500 text-slate-950',
          icon: AlertTriangle
        };
      default:
        return {
          bg: 'bg-slate-50 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/20 text-slate-700 dark:text-slate-400',
          badge: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
          icon: Info
        };
    }
  };

  const getResolutionAction = (issue: ValidationIssue) => {
    switch (issue.type) {
      case 'BROKEN_RELATIONSHIP':
        return 'Go to database client or run cascade cleaner script to delete these orphaned edge records.';
      case 'CIRCULAR_RELATIONSHIP':
        return 'Break the loop cycle by modifying or removing relationship entries at Careers or Degree connections.';
      case 'INVALID_DEGREE_PATHWAY':
        return 'Verify the degree requirements rule. Either adjust the Whitelist rule in Admin Rules or add matching exams/relationships in the graph.';
      case 'MISSING_ENTRANCE_EXAM_RELATION':
        return 'Register incoming stream connections (PCM/PCB) to this exam or link it to its accepting degrees.';
      case 'MISSING_ELIGIBILITY_RULE':
        return 'Create at least one ALLOW gate eligibility rule for this target Degree or Career under the Admin Rules page.';
      case 'DUPLICATE_CAREER':
      case 'DUPLICATE_INSTITUTE':
        return 'Consolidate duplicate nodes using API DELETE calls and update referencing edges to point to the master node.';
      default:
        return 'Inspect details of this anomaly in database collections.';
    }
  };

  const filteredIssues = report ? getFilteredIssues(report.issues) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2 border-b border-slate-200 dark:border-white/5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2.5">
            <ShieldAlert className="w-8 h-8 text-cyan-600 dark:text-brandCyan" />
            <span>Pathway Integrity Diagnostics</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Detect connection gaps, circular cycles, logic contradictions, completeness issues, and duplicate assets.
          </p>
        </div>

        <button
          onClick={runDiagnostics}
          disabled={loading}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-brandCyan to-brandIndigo hover:brightness-110 text-white text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Analyzing...' : 'Run Diagnostics'}</span>
        </button>
      </div>

      {/* Loading & Errors */}
      {loading && (
        <div className="text-center py-24 text-slate-500 dark:text-slate-400 animate-pulse text-sm">
          Traversing path graphs and parsing whitelist rule gates...
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-xl text-center text-sm">
          {error}
        </div>
      )}

      {!loading && !error && report && (
        <div className="space-y-8 animate-fadeIn">
          {/* Summary Dashboard Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass p-4 rounded-xl border border-slate-200/50 dark:border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Total Warnings</span>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                <Database className="w-6 h-6 text-cyan-600 dark:text-brandCyan" />
                <span>{report.summary.totalIssues}</span>
              </div>
            </div>

            <div className="glass p-4 rounded-xl border border-slate-200/50 dark:border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Connection Errors</span>
              <div className="text-3xl font-extrabold text-red-600 dark:text-red-400 flex items-center space-x-2">
                <Flame className="w-6 h-6 text-red-500 dark:text-red-400 animate-pulse" />
                <span>{report.summary.brokenRelationships + report.summary.circularRelationships}</span>
              </div>
            </div>

            <div className="glass p-4 rounded-xl border border-slate-200/50 dark:border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Completeness Gaps</span>
              <div className="text-3xl font-extrabold text-yellow-600 dark:text-yellow-400 flex items-center space-x-2">
                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                <span>{report.summary.missingEntranceExams + report.summary.missingEligibilityRules}</span>
              </div>
            </div>

            <div className="glass p-4 rounded-xl border border-slate-200/50 dark:border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Duplicate Records</span>
              <div className="text-3xl font-extrabold text-slate-700 dark:text-slate-300 flex items-center space-x-2">
                <HelpCircle className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                <span>{report.summary.duplicateCareers + report.summary.duplicateInstitutes}</span>
              </div>
            </div>
          </div>

          {/* Filtering Tabs */}
          <div className="flex bg-slate-50 dark:bg-[#0E1524]/60 border border-slate-200 dark:border-white/5 p-1 rounded-xl self-start overflow-x-auto">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
                selectedFilter === 'ALL'
                  ? 'bg-cyan-100 dark:bg-brandCyan/10 text-cyan-700 dark:text-brandCyan border border-cyan-200 dark:border-brandCyan/15'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              All Warnings ({report.issues.length})
            </button>
            <button
              onClick={() => setSelectedFilter('STRUCTURAL')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
                selectedFilter === 'STRUCTURAL'
                  ? 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/15'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Structural ({report.summary.brokenRelationships + report.summary.circularRelationships})
            </button>
            <button
              onClick={() => setSelectedFilter('CONFLICTS')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
                selectedFilter === 'CONFLICTS'
                  ? 'bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/15'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Logic Conflicts ({report.summary.invalidDegreePathways})
            </button>
            <button
              onClick={() => setSelectedFilter('COMPLETENESS')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
                selectedFilter === 'COMPLETENESS'
                  ? 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/15'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Gaps ({report.summary.missingEntranceExams + report.summary.missingEligibilityRules})
            </button>
            <button
              onClick={() => setSelectedFilter('DUPLICATES')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
                selectedFilter === 'DUPLICATES'
                  ? 'bg-slate-200 dark:bg-slate-700/35 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/50'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Duplicates ({report.summary.duplicateCareers + report.summary.duplicateInstitutes})
            </button>
          </div>

          {/* Diagnostics Listing */}
          <div className="space-y-4">
            {filteredIssues.length === 0 ? (
              <div className="glass p-16 text-center text-slate-500 dark:text-slate-400 rounded-2xl border border-slate-200/50 dark:border-white/5 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 dark:text-emerald-400 mx-auto animate-bounce" />
                <h3 className="text-slate-900 dark:text-white font-bold text-base">Perfect Pathway Integrity</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                  No issues found in this diagnostics category. Pathway connections and eligibility constraints match correctly.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredIssues.map((issue, idx) => {
                  const styles = getSeverityStyles(issue.severity);
                  const Icon = styles.icon;

                  return (
                    <div
                      key={idx}
                      className={`glass p-5 rounded-2xl border ${styles.bg} transition-all duration-300 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4`}
                    >
                      <div className="flex items-start space-x-3 max-w-3xl">
                        <Icon className="w-5 h-5 shrink-0 text-current mt-0.5" />
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${styles.badge}`}>
                              {issue.severity}
                            </span>
                            <span className="text-[10px] bg-slate-200/50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-white/5 px-2 py-0.5 rounded font-mono uppercase">
                              {(() => {
                                switch (issue.type) {
                                  case 'BROKEN_RELATIONSHIP': return 'Broken Connection';
                                  case 'CIRCULAR_RELATIONSHIP': return 'Circular Cycle';
                                  case 'INVALID_DEGREE_PATHWAY': return 'Invalid Transition';
                                  case 'MISSING_ENTRANCE_EXAM_RELATION': return 'Missing Entrance Exam Connection';
                                  case 'MISSING_ELIGIBILITY_RULE': return 'Missing Eligibility Criteria';
                                  case 'DUPLICATE_CAREER': return 'Duplicate Career Profile';
                                  case 'DUPLICATE_INSTITUTE': return 'Duplicate College Profile';
                                  default: return (issue.type as string).replace(/_/g, ' ');
                                }
                              })()}
                            </span>
                          </div>

                          <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                            {issue.message}
                          </p>

                          {/* Recommendation details */}
                          <div className="flex items-start space-x-2 bg-slate-100/50 dark:bg-black/20 p-3 rounded-xl border border-slate-200 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300">
                            <ArrowRight className="w-4 h-4 text-cyan-600 dark:text-brandCyan shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-cyan-600 dark:text-brandCyan font-semibold">Recommended Fix: </strong>
                              <span>{getResolutionAction(issue)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Debugging Node Details */}
                      {issue.details && (
                        <div className="shrink-0 bg-slate-100/40 dark:bg-white/5 p-3.5 rounded-xl border border-slate-200 dark:border-white/5 text-[10px] text-slate-600 dark:text-slate-500 font-mono w-full md:w-64 overflow-x-auto leading-relaxed">
                          <span className="text-[9px] uppercase font-bold text-slate-700 dark:text-slate-400 block mb-1">Diagnostic Details</span>
                          <div className="max-h-24 overflow-y-auto">
                            {Object.entries(issue.details).map(([k, v]) => (
                              <div key={k}>
                                <strong className="text-slate-800 dark:text-slate-300">{k}:</strong> {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminValidationPage;
