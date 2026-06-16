import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Sparkles, AlertCircle, CheckCircle, Mail, User, BookOpen } from 'lucide-react';
import { api } from '../../services/api';

export const SuggestPage: React.FC = () => {
  const navigate = useNavigate();

  // Form states
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [type, setType] = useState('DEGREE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Status states
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
    { value: 'OTHER', label: 'Other Opportunity Type' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!visitorName.trim()) {
      setError('Please provide your name.');
      return;
    }
    if (!visitorEmail.trim() || !visitorEmail.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!title.trim() || title.length < 2) {
      setError('Please provide a title (at least 2 characters).');
      return;
    }
    if (!description.trim() || description.length < 10) {
      setError('Please describe this opportunity in more detail (at least 10 characters).');
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
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit suggestion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex items-center justify-center">
      {/* Dynamic Background Accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brandCyan/10 rounded-full filter blur-3xl pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brandIndigo/10 rounded-full filter blur-3xl pointer-events-none animate-pulse-slow" />

      <div className="w-full max-w-2xl relative z-10">
        {/* Back Link */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center space-x-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white mb-6 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div
              key="form-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass p-6 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-2xl relative overflow-hidden bg-white/70 dark:bg-slate-900/70"
            >
              {/* Top Accent Strip */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-brandCyan via-brandIndigo to-purple-500" />

              <div className="mb-8">
                <div className="flex items-center space-x-2 text-brandCyan dark:text-brandCyan font-semibold mb-2">
                  <Sparkles className="w-5 h-5 text-brandCyan" />
                  <span className="text-sm tracking-wider uppercase">Crowdsourced Registry</span>
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Suggest a New Pathway
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm sm:text-base leading-relaxed">
                  Is Career Atlas missing a degree, certification, career, exam, or university? Submit the details below. Our administrative team reviews all additions before integrating them into the pathway navigation graph.
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-xl border border-red-200 bg-red-500/10 text-red-700 dark:text-red-400 dark:border-red-500/20 text-sm flex items-start space-x-2.5"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact Info (Row) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Your Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={visitorName}
                        onChange={(e) => setVisitorName(e.target.value)}
                        placeholder="Alex Johnson"
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950 focus:border-brandCyan focus:ring-1 focus:ring-brandCyan outline-none text-slate-800 dark:text-white text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Your Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={visitorEmail}
                        onChange={(e) => setVisitorEmail(e.target.value)}
                        placeholder="alex@example.com"
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950 focus:border-brandCyan focus:ring-1 focus:ring-brandCyan outline-none text-slate-800 dark:text-white text-sm transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Dropdown Choice */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Opportunity Classification
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full pl-11 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950 focus:border-brandCyan focus:ring-1 focus:ring-brandCyan outline-none text-slate-800 dark:text-white text-sm transition-all appearance-none cursor-pointer"
                    >
                      {opportunityTypes.map((item) => (
                        <option key={item.value} value={item.value} className="dark:bg-slate-900 text-slate-800 dark:text-white">
                          {item.label}
                        </option>
                      ))}
                    </select>
                    {/* Select arrow */}
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Opportunity Title */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Title / Node Name
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. B.Des in Communication Design, Google UX Design Certificate, Agribusiness Manager"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950 focus:border-brandCyan focus:ring-1 focus:ring-brandCyan outline-none text-slate-800 dark:text-white text-sm transition-all"
                  />
                </div>

                {/* Details / Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Description & Required Milestone Links
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide detailed description, requirements, fees, durations, and any eligibility details for this pathway."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950 focus:border-brandCyan focus:ring-1 focus:ring-brandCyan outline-none text-slate-800 dark:text-white text-sm transition-all resize-none"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-brandCyan via-brandIndigo to-purple-500 text-white font-semibold shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 disabled:pointer-events-none transition-all text-sm"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting details...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4.5 h-4.5" />
                      <span>Submit Opportunity Suggestion</span>
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass p-8 sm:p-12 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-2xl text-center relative overflow-hidden bg-white/70 dark:bg-slate-900/70"
            >
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Suggestion Submitted!
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-4 leading-relaxed text-sm sm:text-base max-w-md mx-auto">
                Thank you, <span className="font-semibold text-slate-800 dark:text-white">{visitorName}</span>. Your request for <span className="font-semibold text-slate-850 dark:text-slate-200">"{title}"</span> has been logged. Our administrators will review the proposal shortly.
              </p>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    setSuccess(false);
                    setTitle('');
                    setDescription('');
                  }}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all"
                >
                  Suggest Another
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm transition-all hover:bg-slate-800 dark:hover:bg-slate-100 shadow-md"
                >
                  Return to Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
