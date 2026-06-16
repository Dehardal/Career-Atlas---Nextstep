import React, { useEffect, useState } from 'react';
import { Trash2, Plus, AlertCircle, CheckCircle, Info, Edit, ExternalLink, FileText } from 'lucide-react';
import { api } from '../../services/api';
import type { Node } from '../../services/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const AdminExamsPage: React.FC = () => {
  const [exams, setExams] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [conductingBody, setConductingBody] = useState('');
  const [frequency, setFrequency] = useState<'ANNUAL' | 'BI_ANNUAL' | 'ON_DEMAND' | 'OTHER'>('ANNUAL');
  const [website, setWebsite] = useState('');
  const [eligibilityDescription, setEligibilityDescription] = useState('');
  const [streamText, setStreamText] = useState('');
  const [subjectText, setSubjectText] = useState('');
  const [ageMin, setAgeMin] = useState<string>('');
  const [ageMax, setAgeMax] = useState<string>('');
  const [maxAttempts, setMaxAttempts] = useState<string>('');

  // Search
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getNodes({ type: 'EXAM', limit: 1000 });
      setExams(res.nodes);
    } catch (err) {
      console.error(err);
      setError('Failed to load entrance exams list.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingExamId(null);
    setName('');
    setDescription('');
    setConductingBody('');
    setFrequency('ANNUAL');
    setWebsite('');
    setEligibilityDescription('');
    setStreamText('');
    setSubjectText('');
    setAgeMin('');
    setAgeMax('');
    setMaxAttempts('');
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleOpenEdit = (exam: Node) => {
    setEditingExamId(exam._id);
    setName(exam.name);
    setDescription(exam.description || '');
    setConductingBody(exam.conductingBody || '');
    setFrequency((exam.frequency as any) || 'ANNUAL');
    setWebsite(exam.website || '');
    setEligibilityDescription(exam.eligibilityDescription || '');
    setStreamText(exam.streamRequirements ? exam.streamRequirements.join(', ') : '');
    setSubjectText(exam.subjectRequirements ? exam.subjectRequirements.join(', ') : '');
    setAgeMin(exam.ageMin !== undefined ? exam.ageMin.toString() : '');
    setAgeMax(exam.ageMax !== undefined ? exam.ageMax.toString() : '');
    setMaxAttempts(exam.maxAttempts !== undefined ? exam.maxAttempts.toString() : '');
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this entrance exam?')) return;
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`${API_BASE}/nodes/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete exam node');
      }
      setExams(exams.filter((e) => e._id !== id));
      setSuccess('Entrance exam deleted successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to delete exam node.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name || !conductingBody) {
      setError('Please provide exam name and conducting body.');
      return;
    }

    const payload = {
      name,
      type: 'EXAM',
      description,
      conductingBody,
      frequency,
      website: website || undefined,
      eligibilityDescription: eligibilityDescription || undefined,
      streamRequirements: streamText ? streamText.split(',').map((s) => s.trim()).filter(Boolean) : [],
      subjectRequirements: subjectText ? subjectText.split(',').map((s) => s.trim()).filter(Boolean) : [],
      ageMin: ageMin ? parseInt(ageMin, 10) : undefined,
      ageMax: ageMax ? parseInt(ageMax, 10) : undefined,
      maxAttempts: maxAttempts ? parseInt(maxAttempts, 10) : undefined
    };

    try {
      if (editingExamId) {
        const response = await fetch(`${API_BASE}/nodes/${editingExamId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to update exam');
        
        setExams(exams.map((ex) => (ex._id === editingExamId ? data : ex)));
        setSuccess('Entrance exam updated successfully.');
      } else {
        const response = await fetch(`${API_BASE}/nodes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to create exam');
        
        setExams([data, ...exams]);
        setSuccess('Entrance exam registered successfully.');
      }
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save exam node.');
    }
  };

  const filteredExams = exams.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.conductingBody && e.conductingBody.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2.5">
            <FileText className="w-8 h-8 text-red-500 dark:text-red-400" />
            <span>Entrance Exam Engine</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Configure entrance exam metadata, stream/subject criteria, and age or attempt limitations.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 hover:brightness-110 text-white text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-lg active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Register Exam</span>
        </button>
      </div>

      {/* Controls & Search */}
      <div className="flex bg-slate-50 dark:bg-[#0E1524]/60 border border-slate-200 dark:border-white/5 p-4 rounded-xl justify-between items-center">
        <input
          type="text"
          placeholder="Filter exams by name or conducting body..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500 w-full sm:max-w-md"
        />
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

      {/* Main Table */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 dark:text-slate-400 animate-pulse text-sm">
          Loading exam criteria profiles...
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl border border-slate-200/50 dark:border-white/5">
          {filteredExams.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <Info className="w-12 h-12 mx-auto mb-3 text-slate-400 dark:text-slate-600 animate-pulse" />
              <p className="text-sm">No entrance exams found in database.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-white/5 text-[10px]">
                    <th className="p-4">Exam Name</th>
                    <th className="p-4">Conducting Body</th>
                    <th className="p-4">Stream & Subject Criteria</th>
                    <th className="p-4">Age / Attempt Limits</th>
                    <th className="p-4">Website</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                  {filteredExams.map((exam) => (
                    <tr key={exam._id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="p-4 font-semibold text-slate-900 dark:text-white">
                        <div>{exam.name}</div>
                        {exam.eligibilityDescription && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-normal italic leading-relaxed max-w-xs truncate-2-lines">
                            {exam.eligibilityDescription}
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-medium text-slate-800 dark:text-slate-200">
                        {exam.conductingBody || 'N/A'}
                        <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">{exam.frequency || 'ANNUAL'}</div>
                      </td>
                      <td className="p-4 space-y-1.5">
                        {exam.streamRequirements && exam.streamRequirements.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1 py-0.5 rounded font-mono">Streams:</span>
                            {exam.streamRequirements.map((st, i) => (
                              <span key={i} className="bg-indigo-100 dark:bg-brandIndigo/25 text-indigo-700 dark:text-brandCyan border border-indigo-200 dark:border-brandCyan/20 px-1.5 py-0.5 rounded text-[9px]">
                                {st}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 italic">No stream restrictions</div>
                        )}

                        {exam.subjectRequirements && exam.subjectRequirements.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1 py-0.5 rounded font-mono">Subjects:</span>
                            {exam.subjectRequirements.map((sub, i) => (
                              <span key={i} className="bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/20 px-1.5 py-0.5 rounded text-[9px]">
                                {sub}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </td>
                      <td className="p-4 space-y-1 text-slate-800 dark:text-slate-200">
                        {(exam.ageMin || exam.ageMax) ? (
                          <div className="text-[10px]">
                            Age limits: <strong className="text-slate-900 dark:text-white">{exam.ageMin || 17} - {exam.ageMax && exam.ageMax < 90 ? exam.ageMax : 'No Max'}</strong>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">No age restrictions</div>
                        )}
                        {exam.maxAttempts && exam.maxAttempts < 90 ? (
                          <div className="text-[10px]">
                            Attempts limit: <strong className="text-slate-900 dark:text-white">{exam.maxAttempts} Max</strong>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">Unlimited attempts</div>
                        )}
                      </td>
                      <td className="p-4">
                        {exam.website ? (
                          <a
                            href={exam.website.startsWith('http') ? exam.website : `https://${exam.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-600 dark:text-brandCyan hover:text-cyan-800 dark:hover:text-white flex items-center space-x-1 font-semibold"
                          >
                            <span className="max-w-[120px] truncate">{exam.website}</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleOpenEdit(exam)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-transparent rounded-lg transition-all"
                            title="Edit exam metadata"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(exam._id)}
                            className="p-2 bg-slate-100 hover:bg-red-500/10 text-slate-500 hover:text-red-600 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:text-red-400 border border-slate-200 dark:border-transparent hover:border-red-500/20 rounded-lg transition-all"
                            title="Delete exam"
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
          )}
        </div>
      )}

      {/* Modal Form Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-[#080C14]/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass w-full max-w-xl rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center bg-slate-50 dark:bg-white/5 px-6 py-4 border-b border-slate-200 dark:border-white/5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingExamId ? 'Edit Entrance Exam' : 'Register New Entrance Exam'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-bold text-lg focus:outline-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Exam Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. JEE Advanced"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Conducting Body */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Conducting Body
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NTA, JAB"
                    value={conductingBody}
                    onChange={(e) => setConductingBody(e.target.value)}
                    className="w-full bg-white dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Frequency */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e: any) => setFrequency(e.target.value)}
                    className="w-full bg-white dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-red-500 cursor-pointer"
                  >
                    <option value="ANNUAL">Annual</option>
                    <option value="BI_ANNUAL">Bi-Annual</option>
                    <option value="ON_DEMAND">On-Demand</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Website */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Official Website URL
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. https://jeeadv.ac.in"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full bg-white dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Description */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    General Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Short description of the exam, its purpose, and pattern..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-white dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Eligibility Description */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Eligibility / Academic Qualification
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Must rank in top candidates of JEE Main Paper 1..."
                    value={eligibilityDescription}
                    onChange={(e) => setEligibilityDescription(e.target.value)}
                    className="w-full bg-white dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Stream Requirements */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Stream Criteria (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Science"
                    value={streamText}
                    onChange={(e) => setStreamText(e.target.value)}
                    className="w-full bg-white dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Subject Requirements */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Mandatory Subjects (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Physics, Chemistry, Mathematics"
                    value={subjectText}
                    onChange={(e) => setSubjectText(e.target.value)}
                    className="w-full bg-white dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Age limits & Attempts */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Min Age
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 17"
                    value={ageMin}
                    onChange={(e) => setAgeMin(e.target.value)}
                    className="w-full bg-white dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Max Age
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 25"
                    value={ageMax}
                    onChange={(e) => setAgeMax(e.target.value)}
                    className="w-full bg-white dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Max Attempt Limit
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="e.g. 3 (leave blank for unlimited)"
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(e.target.value)}
                    className="w-full bg-white dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex space-x-3 pt-4 border-t border-slate-200 dark:border-white/5">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:brightness-110 text-white font-bold py-3 rounded-xl transition-all shadow-md"
                >
                  Save Exam Profile
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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

export default AdminExamsPage;
