import React, { useState } from 'react';
import { Compass, Send, CheckCircle, Sparkles } from 'lucide-react';
import { api } from '../../services/api';

export const Footer: React.FC = () => {
  // Suggestion Form States
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

  const handleSubmitSuggestion = async (e: React.FormEvent) => {
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
      setError('Title must be at least 2 chars.');
      return;
    }
    if (!description.trim() || description.length < 10) {
      setError('Description must be at least 10 chars.');
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
      // Reset form
      setVisitorName('');
      setVisitorEmail('');
      setTitle('');
      setDescription('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer id="footer" className="border-t border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-[#070A10] py-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left column - Branding and info */}
        <div className="md:col-span-5 space-y-4">
          <div className="flex items-center space-x-2">
            <Compass className="w-6 h-6 text-brandCyan" />
            <span className="text-base font-bold text-slate-800 dark:text-white">Career Atlas</span>
            <span className="text-xs text-slate-550 dark:text-slate-500">| Complete Navigation Platform</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
            Discover optimal educational pathways, degrees, colleges, and entrance exams. Help students navigate from school milestones to their dream professions with our data-driven career GPS.
          </p>
          <div className="pt-2 text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Career Atlas. Chart your course with data-driven insights.
          </div>
        </div>

        {/* Right column - Compact Suggestion Box Form */}
        <div className="md:col-span-7 bg-white/40 dark:bg-[#090E1A]/40 backdrop-blur-md p-5 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-lg relative">
          
          {success ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Suggestion Submitted!</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
                Thank you for contributing. Our administrative team will review your proposal.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="mt-2 text-xs font-semibold text-brandCyan hover:text-cyan-600 transition-colors"
              >
                Submit another suggestion
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitSuggestion} className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-2">
                <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brandCyan" />
                  <span>Suggest Pathway Opportunity</span>
                </h4>
                <span className="text-[10px] text-slate-500 dark:text-slate-500">Crowdsourced Database</span>
              </div>

              {error && (
                <p className="text-[10px] text-red-500 dark:text-red-400 font-medium bg-red-500/5 p-1.5 rounded border border-red-500/10">
                  {error}
                </p>
              )}

              {/* Name & Email inputs side-by-side */}
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-slate-800 dark:text-white text-xs outline-none focus:border-brandCyan transition-colors"
                />
                <input
                  type="email"
                  required
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                  placeholder="Your Email"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-slate-800 dark:text-white text-xs outline-none focus:border-brandCyan transition-colors"
                />
              </div>

              {/* Type and Title */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="sm:col-span-5 w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-slate-800 dark:text-white text-xs outline-none cursor-pointer focus:border-brandCyan"
                >
                  {opportunityTypes.map((item) => (
                    <option key={item.value} value={item.value} className="dark:bg-slate-900">
                      {item.label}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Node Title (e.g. B.Des)"
                  className="sm:col-span-7 w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-slate-800 dark:text-white text-xs outline-none focus:border-brandCyan transition-colors"
                />
              </div>

              {/* Description */}
              <textarea
                required
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description & Requirements (min 10 chars)..."
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-slate-800 dark:text-white text-xs outline-none resize-none focus:border-brandCyan transition-colors"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-brandCyan to-brandIndigo hover:brightness-105 active:scale-95 text-white font-bold text-xs disabled:opacity-50 disabled:pointer-events-none transition-all shadow-md"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
      </div>
    </footer>
  );
};

export default Footer;
