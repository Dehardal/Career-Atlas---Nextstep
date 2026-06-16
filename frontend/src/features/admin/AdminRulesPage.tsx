import React, { useEffect, useState } from 'react';
import { Sliders, Trash2, Plus, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { api } from '../../services/api';
import type { Node, EligibilityRule } from '../../services/api';

export const AdminRulesPage: React.FC = () => {
  const [rules, setRules] = useState<EligibilityRule[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sourceSearch, setSourceSearch] = useState('');
  const [targetSearch, setTargetSearch] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedTarget, setSelectedTarget] = useState('');
  const [ruleType, setRuleType] = useState<'ALLOW' | 'BLOCK'>('ALLOW');
  const [selectedMinQual, setSelectedMinQual] = useState('');
  const [mandatoryText, setMandatoryText] = useState('');
  const [preferredText, setPreferredText] = useState('');
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [exceptionsText, setExceptionsText] = useState('');

  // Dropdown expansion helper state
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [targetDropdownOpen, setTargetDropdownOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rulesRes, nodesRes] = await Promise.all([
        api.getEligibilityRules(),
        api.getNodes({ limit: 1000 })
      ]);
      setRules(rulesRes);
      setNodes(nodesRes.nodes);
    } catch (err) {
      console.error(err);
      setError('Failed to load rules or nodes. Verify backend API status.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this eligibility rule?')) return;
    setError(null);
    setSuccess(null);
    try {
      await api.deleteEligibilityRule(id);
      setRules(rules.filter((r) => r._id !== id));
      setSuccess('Rule deleted successfully.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete rule.');
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedSource || !selectedTarget) {
      setError('Please select both a Prerequisite Step and a Target Step.');
      return;
    }

    try {
      const rulePayload = {
        sourceNode: selectedSource,
        targetNode: selectedTarget,
        ruleType,
        minimumQualification: selectedMinQual || undefined,
        mandatorySubjects: mandatoryText ? mandatoryText.split(',').map(s => s.trim()).filter(Boolean) : [],
        preferredSubjects: preferredText ? preferredText.split(',').map(s => s.trim()).filter(Boolean) : [],
        entranceExamRequirements: selectedExams,
        exceptions: exceptionsText
      };

      const newRule = await api.createEligibilityRule(rulePayload);
      setRules([newRule, ...rules]);
      setSuccess('Eligibility requirement established successfully.');
      
      // Reset Form
      setSelectedSource('');
      setSelectedTarget('');
      setSourceSearch('');
      setTargetSearch('');
      setRuleType('ALLOW');
      setSelectedMinQual('');
      setMandatoryText('');
      setPreferredText('');
      setSelectedExams([]);
      setExceptionsText('');
      setShowCreateModal(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create rule.');
    }
  };

  // Node Filters
  const filteredSourceNodes = nodes.filter(n =>
    n.name.toLowerCase().includes(sourceSearch.toLowerCase()) ||
    n.type.toLowerCase().includes(sourceSearch.toLowerCase())
  );

  const filteredTargetNodes = nodes.filter(n =>
    n.name.toLowerCase().includes(targetSearch.toLowerCase()) ||
    n.type.toLowerCase().includes(targetSearch.toLowerCase())
  );

  const qualificationNodes = nodes.filter(n => n.type === 'QUALIFICATION');
  const examNodes = nodes.filter(n => n.type === 'EXAM');

  const getSourceNodeName = () => {
    const node = nodes.find(n => n._id === selectedSource);
    return node ? `${node.name} (${node.type})` : 'Select Prerequisite Node...';
  };

  const getTargetNodeName = () => {
    const node = nodes.find(n => n._id === selectedTarget);
    return node ? `${node.name} (${node.type})` : 'Select Destination Node...';
  };

  const handleSelectExam = (examId: string) => {
    if (selectedExams.includes(examId)) {
      setSelectedExams(selectedExams.filter(id => id !== examId));
    } else {
      setSelectedExams([...selectedExams, examId]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2.5">
            <Sliders className="w-8 h-8 text-cyan-600 dark:text-brandCyan" />
            <span>Eligibility Gateway Manager</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Define requirements to restrict or permit student pathways by creating whitelist (ALLOW) and blacklist (BLOCK) criteria.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-brandCyan to-brandIndigo hover:brightness-115 text-white text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-brandIndigo/10 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Eligibility Rule</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center space-x-2 p-4 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-xl text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-2 p-4 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Rules Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 dark:text-slate-400 animate-pulse text-sm">
          Loading rule engine parameters...
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl border border-slate-200/50 dark:border-white/5">
          {rules.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <Info className="w-12 h-12 mx-auto mb-3 text-slate-400 dark:text-slate-600 animate-pulse" />
              <p className="text-sm">No eligibility rules established. Pathways are currently fully unconstrained.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-white/5 text-[10px]">
                    <th className="p-4">Prerequisite Step</th>
                    <th className="p-4">Destination Target</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Conditions</th>
                    <th className="p-4">Exceptions</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                  {rules.map((rule) => (
                    <tr key={rule._id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      {/* Source */}
                      <td className="p-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{rule.sourceNode?.name || 'Unknown'}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-wider uppercase mt-0.5">
                          {rule.sourceNode?.type || 'N/A'}
                        </div>
                      </td>

                      {/* Target */}
                      <td className="p-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{rule.targetNode?.name || 'Unknown'}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-wider uppercase mt-0.5">
                          {rule.targetNode?.type || 'N/A'}
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] border tracking-wider ${
                          rule.ruleType === 'ALLOW'
                            ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                            : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20'
                        }`}>
                          {rule.ruleType}
                        </span>
                      </td>

                      {/* Conditions */}
                      <td className="p-4 space-y-1.5 max-w-[280px]">
                        {rule.minimumQualification && (
                          <div className="flex items-center space-x-1">
                            <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1 py-0.5 rounded font-mono">Min Qual:</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{rule.minimumQualification.name}</span>
                          </div>
                        )}

                        {rule.mandatorySubjects && rule.mandatorySubjects.length > 0 && (
                          <div className="flex flex-wrap gap-1 items-center">
                            <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1 py-0.5 rounded mr-1 font-mono">Subjects:</span>
                            {rule.mandatorySubjects.map((sub, i) => (
                              <span key={i} className="bg-teal-100 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/20 px-1.5 py-0.5 rounded text-[9px]">
                                {sub}
                              </span>
                            ))}
                          </div>
                        )}

                        {rule.entranceExamRequirements && rule.entranceExamRequirements.length > 0 && (
                          <div className="flex flex-wrap gap-1 items-center">
                            <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1 py-0.5 rounded mr-1 font-mono">Exams:</span>
                            {rule.entranceExamRequirements.map((exam, i) => (
                              <span key={i} className="bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20 px-1.5 py-0.5 rounded text-[9px]">
                                {exam.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {!rule.minimumQualification && 
                         (!rule.mandatorySubjects || rule.mandatorySubjects.length === 0) && 
                         (!rule.entranceExamRequirements || rule.entranceExamRequirements.length === 0) && (
                          <span className="text-slate-500 dark:text-slate-400 italic">No special preconditions</span>
                        )}
                      </td>

                      {/* Exceptions */}
                      <td className="p-4 max-w-[220px]">
                        <p className="text-slate-600 dark:text-slate-400 truncate-3-lines leading-relaxed">
                          {rule.exceptions || <span className="text-slate-500 dark:text-slate-500 italic">None defined</span>}
                        </p>
                      </td>

                      {/* Delete */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDelete(rule._id)}
                          className="p-2 bg-slate-100 hover:bg-red-500/10 text-slate-500 hover:text-red-600 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:text-red-400 border border-slate-200 dark:border-transparent hover:border-red-500/20 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Rule Modal Overlay */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-[#080C14]/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass w-full max-w-xl rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center bg-slate-50 dark:bg-white/5 px-6 py-4 border-b border-slate-200 dark:border-white/5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Gateway Requirement</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-bold text-lg focus:outline-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Rule Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Rule Action / Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRuleType('ALLOW')}
                    className={`text-center py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      ruleType === 'ALLOW'
                        ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-transparent hover:bg-slate-200 dark:hover:bg-white/10'
                    }`}
                  >
                    Whitelist (ALLOW Transition)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRuleType('BLOCK')}
                    className={`text-center py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      ruleType === 'BLOCK'
                        ? 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-transparent hover:bg-slate-200 dark:hover:bg-white/10'
                    }`}
                  >
                    Blacklist (BLOCK Transition)
                  </button>
                </div>
              </div>

              {/* Source Node Selector */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Prerequisite / Source Step
                </label>
                <div 
                  onClick={() => setSourceDropdownOpen(!sourceDropdownOpen)}
                  className="w-full bg-white dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 cursor-pointer flex justify-between items-center text-sm"
                >
                  <span className={selectedSource ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400 dark:text-slate-500'}>
                    {getSourceNodeName()}
                  </span>
                  <Sliders className="w-4 h-4 text-slate-500" />
                </div>
                {sourceDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 z-30 bg-slate-50 dark:bg-[#0E1524] border border-slate-200 dark:border-white/15 rounded-xl mt-1.5 shadow-xl max-h-52 overflow-y-auto p-2 space-y-2">
                    <input
                      type="text"
                      placeholder="Type to filter prerequisite steps..."
                      value={sourceSearch}
                      onChange={(e) => setSourceSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-white dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brandCyan"
                    />
                    <div className="space-y-1">
                      {filteredSourceNodes.slice(0, 30).map(node => (
                        <div
                          key={node._id}
                          onClick={() => {
                            setSelectedSource(node._id);
                            setSourceDropdownOpen(false);
                          }}
                          className="px-3 py-2 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer flex justify-between items-center"
                        >
                          <span>{node.name}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 tracking-wide uppercase">{node.type}</span>
                        </div>
                      ))}
                      {filteredSourceNodes.length === 0 && (
                        <div className="text-[11px] text-slate-500 p-2 text-center">No nodes found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Target Node Selector */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Destination / Target Step
                </label>
                <div 
                  onClick={() => setTargetDropdownOpen(!targetDropdownOpen)}
                  className="w-full bg-white dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 cursor-pointer flex justify-between items-center text-sm"
                >
                  <span className={selectedTarget ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400 dark:text-slate-500'}>
                    {getTargetNodeName()}
                  </span>
                  <Sliders className="w-4 h-4 text-slate-500" />
                </div>
                {targetDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 z-30 bg-slate-50 dark:bg-[#0E1524] border border-slate-200 dark:border-white/15 rounded-xl mt-1.5 shadow-xl max-h-52 overflow-y-auto p-2 space-y-2">
                    <input
                      type="text"
                      placeholder="Type to filter target steps..."
                      value={targetSearch}
                      onChange={(e) => setTargetSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-white dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brandCyan"
                    />
                    <div className="space-y-1">
                      {filteredTargetNodes.slice(0, 30).map(node => (
                        <div
                          key={node._id}
                          onClick={() => {
                            setSelectedTarget(node._id);
                            setTargetDropdownOpen(false);
                          }}
                          className="px-3 py-2 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer flex justify-between items-center"
                        >
                          <span>{node.name}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 tracking-wide uppercase">{node.type}</span>
                        </div>
                      ))}
                      {filteredTargetNodes.length === 0 && (
                        <div className="text-[11px] text-slate-500 p-2 text-center">No nodes found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Conditions Block (ONLY for ALLOW Rules) */}
              {ruleType === 'ALLOW' && (
                <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-white/5">
                  <h4 className="text-xs font-bold text-cyan-600 dark:text-brandCyan flex items-center space-x-1.5 font-bold">
                    <Info className="w-4 h-4 text-cyan-600 dark:text-brandCyan" />
                    <span>Whitelist Conditions</span>
                  </h4>

                  {/* Minimum Qualification */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                      Minimum Qualification Node
                    </label>
                    <select
                      value={selectedMinQual}
                      onChange={(e) => setSelectedMinQual(e.target.value)}
                      className="w-full bg-white dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-xl px-3 py-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brandCyan cursor-pointer"
                    >
                      <option value="">None Required</option>
                      {qualificationNodes.map(node => (
                        <option key={node._id} value={node._id}>{node.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Mandatory Subjects */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                      Mandatory Subjects (Comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Physics, Chemistry, Mathematics"
                      value={mandatoryText}
                      onChange={(e) => setMandatoryText(e.target.value)}
                      className="w-full bg-white dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brandCyan"
                    />
                  </div>

                  {/* Preferred Subjects */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                      Preferred Subjects (Comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science, English"
                      value={preferredText}
                      onChange={(e) => setPreferredText(e.target.value)}
                      className="w-full bg-white dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brandCyan"
                    />
                  </div>

                  {/* Entrance Exams */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider font-semibold">
                      Entrance Exam Requirements
                    </label>
                    <div className="bg-slate-50 dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-xl p-3 max-h-40 overflow-y-auto space-y-2">
                      {examNodes.map(exam => {
                        const isChecked = selectedExams.includes(exam._id);
                        return (
                          <div
                            key={exam._id}
                            onClick={() => handleSelectExam(exam._id)}
                            className="flex items-center space-x-2.5 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // Handled by outer div click
                              className="accent-brandCyan cursor-pointer rounded"
                            />
                            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{exam.name}</span>
                          </div>
                        );
                      })}
                      {examNodes.length === 0 && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center">No exams registered</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Exceptions */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider font-semibold">
                  Exceptions Description
                </label>
                <textarea
                  placeholder="e.g. Lateral entry allows diploma holders to skip PCM exam requirements..."
                  value={exceptionsText}
                  onChange={(e) => setExceptionsText(e.target.value)}
                  rows={2}
                  className="w-full bg-white dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brandCyan"
                />
              </div>

              {/* Form buttons */}
              <div className="flex space-x-3 pt-4 border-t border-slate-200 dark:border-white/5">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-brandCyan to-brandIndigo hover:brightness-110 text-white font-bold py-3 rounded-xl transition-all"
                >
                  Save Rule
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-bold py-3 rounded-xl border border-slate-200 dark:border-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRulesPage;
