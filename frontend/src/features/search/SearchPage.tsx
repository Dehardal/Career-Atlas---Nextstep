import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Compass, MapPin, TrendingUp, DollarSign, ExternalLink, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import type { Node } from '../../services/api';
import { useRoadmapStore } from '../../store/useRoadmapStore';

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { setStartNode, setTargetNode } = useRoadmapStore();

  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [results, setResults] = useState<Node[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filterTypes = [
    { value: 'ALL', label: 'All Types' },
    { value: 'QUALIFICATION', label: 'Qualifications' },
    { value: 'DEGREE', label: 'Degrees' },
    { value: 'EXAM', label: 'Exams' },
    { value: 'INSTITUTE', label: 'Institutes' },
    { value: 'OCCUPATION', label: 'Careers' },
    { value: 'SKILL', label: 'Skills' },
  ];

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const typeParam = selectedType === 'ALL' ? undefined : selectedType;
      const data = await api.getNodes({
        search: query.trim() || undefined,
        type: typeParam,
        limit: 50,
      });
      setResults(data.nodes);
    } catch (err) {
      console.error(err);
      setError('Search query failed. Please verify API connection.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger search on query or type filter change
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query, selectedType]);

  const handleSetStart = (node: Node) => {
    setStartNode(node);
    navigate('/roadmap');
  };

  const handleSetTarget = (node: Node) => {
    setTargetNode(node);
    navigate('/roadmap');
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'QUALIFICATION': return 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20';
      case 'BOARD': return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20';
      case 'STREAM': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'SUBJECT_COMBINATION': return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';
      case 'EXAM': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      case 'DEGREE': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'OCCUPATION': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'SKILL': return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
      case 'INSTITUTE': return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
      default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const formatCurrency = (val?: number) => {
    if (!val) return '';
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    return `₹${val}`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Search Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center space-x-2">
          <Search className="w-8 h-8 text-cyan-600 dark:text-brandCyan" />
          <span>Global Pathway Search</span>
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Find matching qualification milestones, entrance exams, skills, and institutes instantly.
        </p>
      </div>

      {/* Control Panel */}
      <div className="glass p-6 rounded-2xl space-y-4">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type keywords to filter (e.g. Science, Software, JEE, MBBS)..."
            className="w-full bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brandCyan transition-colors"
          />
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-500" />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 pt-2">
          {filterTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => setSelectedType(t.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                selectedType === t.value
                  ? 'bg-indigo-100 dark:bg-brandIndigo/25 border-cyan-500 dark:border-brandCyan text-cyan-700 dark:text-brandCyan shadow-glow'
                  : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:dark:text-white hover:bg-slate-200 hover:dark:bg-white/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results List */}
      <div className="space-y-4">
        {loading && (
          <div className="text-center py-12 text-slate-500 animate-pulse text-sm">
            Fetching match indexes...
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center text-sm">
            {error}
          </div>
        )}

        {!loading && results.length === 0 && (
          <div className="glass p-12 text-center text-slate-500 rounded-2xl">
            <Compass className="w-12 h-12 mx-auto mb-3 text-slate-600 animate-spin-slow" />
            <p className="text-sm">No careers or pathways matched your current filters.</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((node) => (
              <div
                key={node._id}
                className="glass p-5 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col justify-between hover:border-slate-300 hover:dark:border-white/10 hover:bg-slate-50 hover:dark:bg-[#121B2F]/40 transition-all group shadow-sm hover:shadow-md"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${getTypeStyle(node.type)}`}>
                      {(() => {
                        switch (node.type) {
                          case 'QUALIFICATION': return 'Education Level';
                          case 'BOARD': return 'Education Board';
                          case 'STREAM': return 'Academic Stream';
                          case 'SUBJECT_COMBINATION': return 'Required Subjects';
                          case 'EXAM': return 'Entrance Exam';
                          case 'DEGREE': return 'Degree Course';
                          case 'OCCUPATION': return 'Target Career';
                          case 'SKILL': return 'Skill Tree';
                          case 'INSTITUTE': return 'College / University';
                          default: return node.type;
                        }
                      })()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-800 dark:text-white mt-3 group-hover:text-brandCyan transition-colors">
                    {node.name}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {node.description}
                  </p>

                  {/* Render inline node stats */}
                  {node.type === 'OCCUPATION' && node.averageSalaryRange && (
                    <div className="flex items-center space-x-3 mt-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                        <TrendingUp className="w-3.5 h-3.5 mr-1" />
                        {node.growthRate || 'HIGH'}
                      </span>
                      <span className="flex items-center">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                        {formatCurrency(node.averageSalaryRange.min)} - {formatCurrency(node.averageSalaryRange.max)}
                      </span>
                    </div>
                  )}

                  {node.type === 'DEGREE' && (
                    <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      Duration: <span className="font-semibold text-slate-800 dark:text-white">{node.durationYears} Years</span> ({node.level})
                    </div>
                  )}

                  {node.type === 'INSTITUTE' && (
                    <div className="flex items-center space-x-1 mt-3 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span>{node.location?.city}, {node.location?.state}</span>
                      {node.nirfRanking && (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold ml-2">NIRF #{node.nirfRanking}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick actions row */}
                <div className="flex space-x-2 mt-5 border-t border-slate-200 dark:border-white/5 pt-3">
                  {node.type === 'QUALIFICATION' && (
                    <button
                      onClick={() => handleSetStart(node)}
                      className="flex-1 flex items-center justify-center space-x-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-brandCyan text-[11px] font-bold py-2 rounded-lg border border-cyan-500/20 dark:border-brandCyan/20 transition-all"
                    >
                      <span>Set as Start Point</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  {node.type === 'OCCUPATION' && (
                    <button
                      onClick={() => handleSetTarget(node)}
                      className="flex-1 flex items-center justify-center space-x-1.5 bg-brandIndigo/10 dark:bg-brandIndigo/20 hover:bg-brandIndigo/20 dark:hover:bg-brandIndigo/35 text-indigo-600 dark:text-brandCyan text-[11px] font-bold py-2 rounded-lg border border-brandIndigo/20 dark:border-brandIndigo/30 transition-all"
                    >
                      <span>Set as Target Career</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  {node.website && (
                    <a
                      href={node.website.startsWith('http') ? node.website : `https://${node.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center space-x-1.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-[11px] font-bold py-2 rounded-lg border border-slate-200 dark:border-white/10 transition-all"
                    >
                      <span>Official Website</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
