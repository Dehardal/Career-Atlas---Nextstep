import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Trash2, Calendar, ShieldCheck, HelpCircle, ChevronLeft, ChevronRight, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import type { Suggestion } from '../../services/api';

export const AdminSuggestionsPage: React.FC = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pages, setPages] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [typeFilter, setTypeFilter] = useState<string>('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal / Drawer state for approving suggestion
  const [activeApproval, setActiveApproval] = useState<Suggestion | null>(null);
  
  // Node fields (approval customizer)
  const [nodeName, setNodeName] = useState('');
  const [nodeDesc, setNodeDesc] = useState('');
  
  // Custom type specific inputs
  const [qualLevel, setQualLevel] = useState<number>(10);
  const [subjectsText, setSubjectsText] = useState('General');
  const [degDuration, setDegDuration] = useState<number>(3);
  const [degLevel, setDegLevel] = useState<'UG' | 'PG' | 'DIPLOMA' | 'DOCTORATE' | 'CERTIFICATE'>('UG');
  const [examBody, setExamBody] = useState('NTA');
  const [examFreq, setExamFreq] = useState<'ANNUAL' | 'BI_ANNUAL' | 'ON_DEMAND' | 'OTHER'>('ANNUAL');
  const [occMinSal, setOccMinSal] = useState<number>(300000);
  const [occMaxSal, setOccMaxSal] = useState<number>(600000);
  const [occGrowth, setOccGrowth] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [occSector, setOccSector] = useState('Technology');
  const [instCity, setInstCity] = useState('');
  const [instState, setInstState] = useState('');
  const [instOwnership, setInstOwnership] = useState<'GOVERNMENT' | 'PRIVATE' | 'SEMI_GOVERNMENT'>('PRIVATE');
  const [skillCategory, setSkillCategory] = useState<'TECHNICAL' | 'SOFT' | 'DOMAIN_SPECIFIC'>('TECHNICAL');

  const fetchSuggestions = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = { page, limit };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;

      const res = await api.getSuggestions(params);
      setSuggestions(res.suggestions);
      setTotal(res.pagination.total);
      setPages(res.pagination.pages);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch suggestions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [page, statusFilter, typeFilter]);

  const handleOpenApproval = (suggestion: Suggestion) => {
    setActiveApproval(suggestion);
    setNodeName(suggestion.title);
    setNodeDesc(suggestion.description);
    
    // Set type specific defaults
    if (suggestion.type === 'QUALIFICATION') setQualLevel(10);
    if (suggestion.type === 'SUBJECT_COMBINATION') setSubjectsText('Physics, Chemistry, Mathematics');
    if (suggestion.type === 'DEGREE') {
      setDegDuration(3);
      setDegLevel('UG');
    }
    if (suggestion.type === 'EXAM') {
      setExamBody('NTA');
      setExamFreq('ANNUAL');
    }
    if (suggestion.type === 'OCCUPATION') {
      setOccMinSal(400000);
      setOccMaxSal(800000);
      setOccGrowth('MEDIUM');
      setOccSector('Technology');
    }
    if (suggestion.type === 'INSTITUTE') {
      setInstCity('New Delhi');
      setInstState('Delhi');
      setInstOwnership('GOVERNMENT');
    }
    if (suggestion.type === 'OTHER') {
      setSkillCategory('TECHNICAL');
    }
  };

  const handleApprove = async () => {
    if (!activeApproval) return;
    setActionLoading(activeApproval._id);
    setError('');
    try {
      // Build type-specific nodeData
      const nodeData: any = {
        name: nodeName,
        description: nodeDesc,
      };

      const t = activeApproval.type;
      if (t === 'QUALIFICATION') {
        nodeData.level = Number(qualLevel);
      } else if (t === 'SUBJECT_COMBINATION') {
        nodeData.subjects = subjectsText.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
      } else if (t === 'DEGREE') {
        nodeData.durationYears = Number(degDuration);
        nodeData.level = degLevel;
      } else if (t === 'EXAM') {
        nodeData.conductingBody = examBody;
        nodeData.frequency = examFreq;
      } else if (t === 'OCCUPATION') {
        nodeData.averageSalaryRange = {
          min: Number(occMinSal),
          max: Number(occMaxSal),
          currency: 'INR',
        };
        nodeData.growthRate = occGrowth;
        nodeData.sector = occSector;
      } else if (t === 'INSTITUTE') {
        nodeData.location = {
          city: instCity,
          state: instState,
        };
        nodeData.ownership = instOwnership;
      } else if (t === 'OTHER') {
        nodeData.category = skillCategory;
      }

      await api.updateSuggestionStatus(activeApproval._id, 'APPROVED', nodeData);
      
      // Update local state list
      setSuggestions((prev) => prev.filter((s) => s._id !== activeApproval._id));
      setActiveApproval(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to approve suggestion.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    setError('');
    try {
      await api.updateSuggestionStatus(id, 'REJECTED');
      // Update local state list or re-fetch
      setSuggestions((prev) => prev.filter((s) => s._id !== id));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reject suggestion.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this suggestion permanently?')) return;
    setActionLoading(id);
    setError('');
    try {
      await api.deleteSuggestion(id);
      setSuggestions((prev) => prev.filter((s) => s._id !== id));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete suggestion.');
    } finally {
      setActionLoading(null);
    }
  };

  const getBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-250 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
      case 'APPROVED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-250 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-250 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-brandCyan" />
            <span>Visitor Suggestions Review</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage, approve, or reject career opportunities proposed by website visitors.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-500/10 text-red-700 dark:text-red-400 dark:border-red-500/20 text-sm flex items-start space-x-2.5">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters & Control bar */}
      <div className="glass p-4 rounded-2xl flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3">
          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm outline-none cursor-pointer"
            >
              <option value="PENDING">Pending Approval</option>
              <option value="APPROVED">Approved suggestions</option>
              <option value="REJECTED">Rejected suggestions</option>
              <option value="">All Submissions</option>
            </select>
          </div>

          {/* Type filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm outline-none cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="QUALIFICATION">Milestones</option>
              <option value="STREAM">Streams</option>
              <option value="SUBJECT_COMBINATION">Combinations</option>
              <option value="DEGREE">Degrees</option>
              <option value="OCCUPATION">Occupations</option>
              <option value="EXAM">Entrance Exams</option>
              <option value="INSTITUTE">Colleges</option>
              <option value="OTHER">Other / Skills</option>
            </select>
          </div>
        </div>

        <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
          Found {total} suggestion(s)
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-brandCyan rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Fetching suggestions log...</p>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
          <HelpCircle className="w-12 h-12 text-slate-400 dark:text-slate-600" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No suggestions logged</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">
            There are no suggestions matching the current filtering criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden border border-slate-200 dark:border-slate-850 rounded-2xl bg-white dark:bg-slate-900/60 shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase border-b border-slate-200 dark:border-slate-800">
                    <th className="py-4 px-6">Visitor & Date</th>
                    <th className="py-4 px-6">Type & Status</th>
                    <th className="py-4 px-6">Suggested Title</th>
                    <th className="py-4 px-6 max-w-xs">Description</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-250 dark:divide-slate-850">
                  {suggestions.map((suggestion) => (
                    <tr key={suggestion._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all text-sm">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{suggestion.visitorName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1 mt-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(suggestion.createdAt).toLocaleDateString()}</span>
                          </p>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="space-y-1.5">
                          <span className="inline-block text-[11px] font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {suggestion.type}
                          </span>
                          <div>
                            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${getBadgeClass(suggestion.status)}`}>
                              {suggestion.status}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                        {suggestion.title}
                      </td>

                      <td className="py-4 px-6 max-w-xs text-slate-600 dark:text-slate-400 text-xs line-clamp-2 mt-3.5">
                        {suggestion.description}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {suggestion.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleOpenApproval(suggestion)}
                                disabled={actionLoading !== null}
                                className="p-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all"
                                title="Configure & Approve Node"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(suggestion._id)}
                                disabled={actionLoading !== null}
                                className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 hover:border-red-500/40 transition-all"
                                title="Reject Suggestion"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(suggestion._id)}
                            disabled={actionLoading !== null}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500 transition-all"
                            title="Delete Suggestion permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between glass p-4 rounded-2xl text-sm">
              <span className="text-slate-500 dark:text-slate-400">
                Page {page} of {pages}
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Approval Details Modal */}
      <AnimatePresence>
        {activeApproval && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveApproval(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 sm:p-8"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brandCyan/10 rounded-full filter blur-2xl pointer-events-none" />

              <button
                onClick={() => setActiveApproval(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-2 text-brandCyan dark:text-brandCyan font-semibold mb-2">
                <Sparkles className="w-5 h-5" />
                <span className="text-xs uppercase tracking-wider">Configure Node Parameters</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Approve & Add Opportunity
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Map the suggestion type ({activeApproval.type}) into a corresponding node type and verify the metadata.
              </p>

              <div className="space-y-4">
                {/* Node Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Node Title / Name
                  </label>
                  <input
                    type="text"
                    value={nodeName}
                    onChange={(e) => setNodeName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-brandCyan focus:ring-1 focus:ring-brandCyan outline-none text-slate-800 dark:text-white text-sm"
                  />
                </div>

                {/* Node Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Node Description
                  </label>
                  <textarea
                    rows={3}
                    value={nodeDesc}
                    onChange={(e) => setNodeDesc(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-brandCyan focus:ring-1 focus:ring-brandCyan outline-none text-slate-800 dark:text-white text-sm resize-none"
                  />
                </div>

                {/* Type specific config options */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3">
                    Type Specific Metadata Details
                  </h4>

                  {/* Qualification Specific */}
                  {activeApproval.type === 'QUALIFICATION' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Academic Level (1-20)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={qualLevel}
                        onChange={(e) => setQualLevel(Number(e.target.value))}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-brandCyan focus:ring-1 focus:ring-brandCyan outline-none text-slate-800 dark:text-white text-sm"
                      />
                    </div>
                  )}

                  {/* Subject Combination */}
                  {activeApproval.type === 'SUBJECT_COMBINATION' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Subjects (comma separated)
                      </label>
                      <input
                        type="text"
                        value={subjectsText}
                        onChange={(e) => setSubjectsText(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-brandCyan focus:ring-1 focus:ring-brandCyan outline-none text-slate-800 dark:text-white text-sm"
                        placeholder="Physics, Chemistry, Mathematics"
                      />
                    </div>
                  )}

                  {/* Degree */}
                  {activeApproval.type === 'DEGREE' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Duration (Years)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          max="8"
                          value={degDuration}
                          onChange={(e) => setDegDuration(Number(e.target.value))}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-brandCyan focus:ring-1 focus:ring-brandCyan outline-none text-slate-800 dark:text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Academic Level
                        </label>
                        <select
                          value={degLevel}
                          onChange={(e) => setDegLevel(e.target.value as any)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-brandCyan focus:ring-1 focus:ring-brandCyan outline-none text-slate-800 dark:text-white text-sm"
                        >
                          <option value="UG">Undergraduate (UG)</option>
                          <option value="PG">Postgraduate (PG)</option>
                          <option value="DIPLOMA">Diploma</option>
                          <option value="DOCTORATE">Doctorate</option>
                          <option value="CERTIFICATE">Certificate</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Entrance Exam */}
                  {activeApproval.type === 'EXAM' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Conducting Body
                        </label>
                        <input
                          type="text"
                          value={examBody}
                          onChange={(e) => setExamBody(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-brandCyan focus:ring-1 focus:ring-brandCyan outline-none text-slate-800 dark:text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Frequency
                        </label>
                        <select
                          value={examFreq}
                          onChange={(e) => setExamFreq(e.target.value as any)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-brandCyan focus:ring-1 focus:ring-brandCyan outline-none text-slate-800 dark:text-white text-sm"
                        >
                          <option value="ANNUAL">Annual</option>
                          <option value="BI_ANNUAL">Bi-Annual</option>
                          <option value="ON_DEMAND">On Demand</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Occupation */}
                  {activeApproval.type === 'OCCUPATION' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Min Salary (INR / Yr)
                          </label>
                          <input
                            type="number"
                            value={occMinSal}
                            onChange={(e) => setOccMinSal(Number(e.target.value))}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-brandCyan focus:ring-1 focus:ring-brandCyan outline-none text-slate-800 dark:text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Max Salary (INR / Yr)
                          </label>
                          <input
                            type="number"
                            value={occMaxSal}
                            onChange={(e) => setOccMaxSal(Number(e.target.value))}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-brandCyan focus:ring-1 focus:ring-brandCyan outline-none text-slate-800 dark:text-white text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Growth Rate
                          </label>
                          <select
                            value={occGrowth}
                            onChange={(e) => setOccGrowth(e.target.value as any)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-brandCyan focus:ring-1 focus:ring-brandCyan outline-none text-slate-800 dark:text-white text-sm"
                          >
                            <option value="HIGH">High Growth</option>
                            <option value="MEDIUM">Medium Growth</option>
                            <option value="LOW">Low Growth</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Industry Sector
                          </label>
                          <input
                            type="text"
                            value={occSector}
                            onChange={(e) => setOccSector(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-brandCyan focus:ring-1 focus:ring-brandCyan outline-none text-slate-800 dark:text-white text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Institute */}
                  {activeApproval.type === 'INSTITUTE' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            City Location
                          </label>
                          <input
                            type="text"
                            value={instCity}
                            onChange={(e) => setInstCity(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-brandCyan focus:ring-1 focus:ring-brandCyan outline-none text-slate-800 dark:text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            State Location
                          </label>
                          <input
                            type="text"
                            value={instState}
                            onChange={(e) => setInstState(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-brandCyan focus:ring-1 focus:ring-brandCyan outline-none text-slate-800 dark:text-white text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Ownership
                        </label>
                        <select
                          value={instOwnership}
                          onChange={(e) => setInstOwnership(e.target.value as any)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-brandCyan focus:ring-1 focus:ring-brandCyan outline-none text-slate-800 dark:text-white text-sm"
                        >
                          <option value="GOVERNMENT">Government owned</option>
                          <option value="PRIVATE">Private</option>
                          <option value="SEMI_GOVERNMENT">Semi-Government</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Other / Skill */}
                  {activeApproval.type === 'OTHER' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Skill Classification Category
                      </label>
                      <select
                        value={skillCategory}
                        onChange={(e) => setSkillCategory(e.target.value as any)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-brandCyan focus:ring-1 focus:ring-brandCyan outline-none text-slate-800 dark:text-white text-sm"
                      >
                        <option value="TECHNICAL">Technical Skills</option>
                        <option value="SOFT">Soft Skills</option>
                        <option value="DOMAIN_SPECIFIC">Domain Specific Skills</option>
                      </select>
                    </div>
                  )}

                  {/* Stream */}
                  {activeApproval.type === 'STREAM' && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                      No extra metadata attributes required for Stream nodes.
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-8 flex justify-end space-x-3">
                <button
                  onClick={() => setActiveApproval(null)}
                  className="px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-white font-semibold text-sm shadow-md transition-all flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Verify & Instantiate Node</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
