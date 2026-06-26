import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useRoadmapStore } from '../../store/useRoadmapStore';

export const SuggestionModal: React.FC = () => {
  const { suggestionModalOpen, setSuggestionModalOpen } = useRoadmapStore();

  // Form States
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [type, setType] = useState('DEGREE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Status States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const opportunityTypes = [
    { value: 'QUALIFICATION', label: 'Milestone / School Qualification' },
    { value: 'STREAM', label: 'Stream / Academic Branch' },
    { value: 'SUBJECT_COMBINATION', label: 'Subject Combination' },
    { value: 'DEGREE', label: 'Degree / Academic Program' },
    { value: 'OCCUPATION', label: 'Occupation / Career Field' },
    { value: 'EXAM', label: 'Entrance Exam' },
    { value: 'INSTITUTE', label: 'College / Institute' },
    { value: 'OTHER', label: 'Other Type' },
  ];

  // Close modal on Escape key
  useEffect(() => {
    if (!suggestionModalOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSuggestionModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [suggestionModalOpen, setSuggestionModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!visitorName.trim()) {
      setError('Please provide your name.');
      return;
    }
    if (!visitorEmail.trim() || !visitorEmail.includes('@')) {
      setError('Please provide a valid email.');
      return;
    }
    if (!title.trim() || title.length < 2) {
      setError('Title must be at least 2 characters.');
      return;
    }
    if (!description.trim() || description.length < 10) {
      setError('Description must be at least 10 characters.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await api.createSuggestion({
        visitorName,
        visitorEmail,
        type,
        title,
        description,
      });
      setSuccess(true);
      // Reset form fields
      setVisitorName('');
      setVisitorEmail('');
      setTitle('');
      setDescription('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit suggestion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!suggestionModalOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSuggestionModalOpen(false)}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          className="relative w-full max-w-lg bg-[#0B1120] border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden z-10 flex flex-col"
        >
          {/* Ambient Glow mesh circles */}
          <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex justify-between items-center pb-4 border-b border-white/5 relative">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-brandCyan animate-pulse" />
              <h3 className="text-base font-bold text-white leading-tight">
                Suggest Pathway Opportunity
              </h3>
            </div>
            <button
              onClick={() => {
                setSuggestionModalOpen(false);
                setSuccess(false);
                setError('');
              }}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <div className="mt-4 relative">
            {success ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 space-y-4"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/25">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Suggestion Submitted Successfully!</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Thank you for contributing to Career Atlas. Our administrative moderation team will review your proposal and update our roadmap catalog soon.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSuccess(false);
                    setError('');
                  }}
                  className="mt-2 text-xs font-semibold text-brandCyan hover:underline"
                >
                  Submit another suggestion
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <p className="text-xs text-red-400 font-medium bg-red-500/5 p-2 rounded border border-red-500/10">
                    {error}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      placeholder="e.g. Alex"
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#0E1524] text-white text-xs outline-none focus:border-brandCyan transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={visitorEmail}
                      onChange={(e) => setVisitorEmail(e.target.value)}
                      placeholder="e.g. alex@example.com"
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#0E1524] text-white text-xs outline-none focus:border-brandCyan transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                      Component Type
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-white/10 bg-[#0E1524] text-white text-xs outline-none cursor-pointer focus:border-brandCyan"
                    >
                      {opportunityTypes.map((item) => (
                        <option key={item.value} value={item.value} className="bg-[#0B1120]">
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-7">
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                      Title Name
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. B.Des Fashion Design"
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#0E1524] text-white text-xs outline-none focus:border-brandCyan transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                    Description & Requirements
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details about prerequisites, career outcome, or subjects (min 10 chars)..."
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#0E1524] text-white text-xs outline-none resize-none focus:border-brandCyan transition-colors"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setSuggestionModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-brandCyan to-brandIndigo hover:brightness-105 active:scale-95 text-white font-bold text-xs disabled:opacity-50 disabled:pointer-events-none transition-all shadow-md"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit suggestion</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
export default SuggestionModal;
