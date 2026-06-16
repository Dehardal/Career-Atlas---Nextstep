import React, { useEffect, useState } from 'react';
import { GraduationCap, Clock } from 'lucide-react';
import { api } from '../../services/api';
import type { Node } from '../../services/api';
import { CustomDropdown } from '../../components/common/CustomDropdown';

export const DegreePage: React.FC = () => {
  const [degrees, setDegrees] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('ALL');

  const levels = [
    { value: 'ALL', label: 'All Levels' },
    { value: 'UG', label: 'Undergraduate (UG)' },
    { value: 'PG', label: 'Postgraduate (PG)' },
    { value: 'DIPLOMA', label: 'Diploma' },
    { value: 'DOCTORATE', label: 'Doctorate' },
  ];

  useEffect(() => {
    const fetchDegrees = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getNodes({ type: 'DEGREE', limit: 100 });
        setDegrees(data.nodes);
      } catch (err) {
        console.error(err);
        setError('Failed to load degrees data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDegrees();
  }, []);

  const filteredDegrees = degrees.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || 
                          d.description.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = selectedLevel === 'ALL' || d.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2.5">
            <GraduationCap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <span>Degree Explorer</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Browse undergraduate, postgraduate, and diploma degrees with duration and requirements.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
          <input
            type="text"
            placeholder="Search degrees (e.g. B.Tech)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white dark:bg-[#0E1524] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-brandCyan w-full sm:w-auto"
          />

          <CustomDropdown
            options={levels}
            value={selectedLevel}
            onChange={setSelectedLevel}
            className="w-full sm:w-56"
          />
        </div>
      </div>

      {/* States */}
      {loading && (
        <div className="text-center py-16 text-slate-500 animate-pulse text-sm">
          Loading degree program listings...
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
          {filteredDegrees.length === 0 ? (
            <div className="glass p-12 text-center text-slate-500 rounded-2xl">
              No degrees found matching your current parameters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDegrees.map((deg) => (
                <div
                  key={deg._id}
                  className="glass p-6 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col justify-between hover:border-blue-500/40 hover:bg-slate-50 hover:dark:bg-[#121B2F]/40 transition-all duration-300 group relative overflow-hidden shadow-sm hover:shadow-md"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500/20 group-hover:bg-blue-500/60 transition-colors" />

                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                        {deg.level || 'UG'}
                      </span>

                      <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 font-medium space-x-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>{deg.durationYears} Years</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-4 group-hover:text-blue-600 group-hover:dark:text-blue-400 transition-colors">
                      {deg.name}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed line-clamp-3">
                      {deg.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Degree Course Code</span>
                    <span className="font-mono text-[10px] select-all bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                      {deg._id.substring(0, 8)}...
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DegreePage;
