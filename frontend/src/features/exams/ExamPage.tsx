import React, { useEffect, useState } from 'react';
import { FileText, Calendar, Landmark, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';
import type { Node } from '../../services/api';
import { CustomDropdown } from '../../components/common/CustomDropdown';

export const ExamPage: React.FC = () => {
  const [exams, setExams] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [selectedFreq, setSelectedFreq] = useState('ALL');

  const frequencies = [
    { value: 'ALL', label: 'All Frequencies' },
    { value: 'ANNUAL', label: 'Annual' },
    { value: 'BI_ANNUAL', label: 'Bi-Annual' },
    { value: 'ON_DEMAND', label: 'On-Demand' },
    { value: 'OTHER', label: 'Other' },
  ];

  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getNodes({ type: 'EXAM', limit: 100 });
        setExams(data.nodes);
      } catch (err) {
        console.error(err);
        setError('Failed to load exams database.');
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  const filteredExams = exams.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) || 
                          (e.conductingBody && e.conductingBody.toLowerCase().includes(search.toLowerCase())) ||
                          e.description.toLowerCase().includes(search.toLowerCase());
    const matchesFreq = selectedFreq === 'ALL' || e.frequency === selectedFreq;
    return matchesSearch && matchesFreq;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2.5">
            <FileText className="w-8 h-8 text-red-600 dark:text-red-400" />
            <span>Exam Explorer</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Track key national and state-level entrance exams, conducting boards, and websites.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
          <input
            type="text"
            placeholder="Search exams (e.g. JEE, NEET)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white dark:bg-[#0E1524] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-brandCyan w-full sm:w-auto"
          />

          <CustomDropdown
            options={frequencies}
            value={selectedFreq}
            onChange={setSelectedFreq}
            className="w-full sm:w-56"
          />
        </div>
      </div>

      {/* Loading & Errors */}
      {loading && (
        <div className="text-center py-16 text-slate-500 animate-pulse text-sm">
          Loading examinations syllabus index...
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center text-sm">
          {error}
        </div>
      )}

      {/* Grid */}
      {!loading && !error && (
        <>
          {filteredExams.length === 0 ? (
            <div className="glass p-12 text-center text-slate-500 rounded-2xl">
              No exams found matching your current search parameters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExams.map((exam) => (
                <div
                  key={exam._id}
                  className="glass p-6 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col justify-between hover:border-red-500/40 hover:bg-slate-50 hover:dark:bg-[#121B2F]/40 transition-all duration-300 group relative overflow-hidden shadow-sm hover:shadow-md"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-red-500/20 group-hover:bg-red-500/60 transition-colors" />

                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                        {exam.frequency || 'ANNUAL'}
                      </span>

                      <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 font-semibold space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                        <span>Scheduled</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-4 group-hover:text-red-600 group-hover:dark:text-red-400 transition-colors">
                      {exam.name}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed line-clamp-3">
                      {exam.description}
                    </p>

                    {exam.eligibilityDescription && (
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-3 italic border-l-2 border-red-500/40 pl-2">
                        {exam.eligibilityDescription}
                      </p>
                    )}

                    <div className="mt-4 space-y-1">
                      {exam.streamRequirements && exam.streamRequirements.length > 0 && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-400">
                          Streams: <strong className="text-slate-800 dark:text-slate-200">{exam.streamRequirements.join(', ')}</strong>
                        </div>
                      )}
                      {exam.subjectRequirements && exam.subjectRequirements.length > 0 && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-400">
                          Subjects: <strong className="text-slate-800 dark:text-slate-200">{exam.subjectRequirements.join(', ')}</strong>
                        </div>
                      )}
                      {(exam.ageMin || exam.ageMax) && (exam.ageMax && exam.ageMax < 90) && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-400">
                          Age: <strong className="text-slate-800 dark:text-slate-200">{exam.ageMin || 17} - {exam.ageMax} Years</strong>
                        </div>
                      )}
                      {exam.maxAttempts && exam.maxAttempts < 10 && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-400">
                          Max Attempts: <strong className="text-slate-800 dark:text-slate-200">{exam.maxAttempts}</strong>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 p-2.5 rounded-xl border border-slate-200 dark:border-white/5">
                      <Landmark className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                      <span className="truncate">Conducts: <strong className="text-slate-800 dark:text-white font-medium">{exam.conductingBody}</strong></span>
                    </div>
                  </div>

                  {exam.website && (
                    <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/5">
                      <a
                        href={exam.website.startsWith('http') ? exam.website : `https://${exam.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between w-full bg-slate-100 dark:bg-[#0E1524] hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-400 border border-slate-200 dark:border-white/10 hover:border-red-500/30 text-slate-700 dark:text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
                      >
                        <span>Official Portal</span>
                        <ExternalLink className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExamPage;
