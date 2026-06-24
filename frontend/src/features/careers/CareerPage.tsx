import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, TrendingUp, DollarSign, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import type { Node } from '../../services/api';
import { useRoadmapStore } from '../../store/useRoadmapStore';
import { CustomDropdown } from '../../components/common/CustomDropdown';
import { StageSelectModal } from '../../components/common/StageSelectModal';

export const CareerPage: React.FC = () => {
  const navigate = useNavigate();
  const { setTargetNode, setStartNode } = useRoadmapStore();

  const [careers, setCareers] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stage selection modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingCareer, setPendingCareer] = useState<Node | null>(null);
  
  // Filtering & Search
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [sectors, setSectors] = useState<string[]>([]);

  useEffect(() => {
    const fetchCareers = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getNodes({ type: 'OCCUPATION', limit: 100 });
        setCareers(data.nodes);
        
        // Extract unique sectors
        const uniqueSectors = Array.from(
          new Set(data.nodes.map((n) => n.sector).filter((s): s is string => !!s))
        );
        setSectors(uniqueSectors);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch careers. Check backend service connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchCareers();
  }, []);

  const handleMapRoute = (node: Node) => {
    setPendingCareer(node);
    setModalOpen(true);
  };

  const handleModalConfirm = (startNode: Node, targetNode: Node) => {
    setStartNode(startNode);
    setTargetNode(targetNode);
    setModalOpen(false);
    setPendingCareer(null);
    navigate('/roadmap');
  };

  const filteredCareers = careers.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.description.toLowerCase().includes(search.toLowerCase());
    const matchesSector = selectedSector === 'ALL' || c.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  const formatSalary = (val?: number) => {
    if (!val) return '0';
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    return `₹${val}`;
  };

  const sectorOptions = [
    { value: 'ALL', label: 'All Sectors' },
    ...sectors.map((sec) => ({ value: sec, label: sec }))
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2.5">
            <Briefcase className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <span>Career Explorer</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Discover modern professions, average packages, and market growth indicators.
          </p>
        </div>

        {/* Search and filter controls */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
          <input
            type="text"
            placeholder="Search professions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white dark:bg-[#0E1524] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-brandCyan w-full sm:w-auto"
          />

          <CustomDropdown
            options={sectorOptions}
            value={selectedSector}
            onChange={setSelectedSector}
            className="w-full sm:w-56"
          />
        </div>
      </div>

      {/* Loading & Errors */}
      {loading && (
        <div className="text-center py-16 text-slate-500 animate-pulse text-sm">
          Loading professional database index...
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center text-sm">
          {error}
        </div>
      )}

      {/* Grid List */}
      {!loading && !error && (
        <>
          {filteredCareers.length === 0 ? (
            <div className="glass p-12 text-center text-slate-500 rounded-2xl">
              No careers match your search criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCareers.map((career) => (
                <div
                  key={career._id}
                  className="glass p-6 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col justify-between hover:border-emerald-500/40 hover:bg-slate-50 hover:dark:bg-[#121B2F]/40 transition-all duration-300 group relative overflow-hidden shadow-sm hover:shadow-md"
                >
                  {/* Accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500/20 group-hover:bg-emerald-500/60 transition-colors" />
                  
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-semibold tracking-wider uppercase">
                        {career.sector || 'Industry'}
                      </span>
                      
                      <span className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="w-3.5 h-3.5 mr-1" />
                        {career.growthRate || 'HIGH'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-4 group-hover:text-emerald-600 group-hover:dark:text-emerald-400 transition-colors">
                      {career.name}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 line-clamp-3 leading-relaxed">
                      {career.description}
                    </p>

                    {/* Salary Slider Visualization */}
                    {career.averageSalaryRange && (
                      <div className="mt-6 space-y-2">
                        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
                            Salary Benchmark
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-white">
                            {formatSalary(career.averageSalaryRange.min)} - {formatSalary(career.averageSalaryRange.max)}
                          </span>
                        </div>
                        {/* Custom Gauge Track */}
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-500 dark:to-teal-400 rounded-full w-3/4 animate-pulse" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 border-t border-slate-200 dark:border-white/5 pt-4">
                    <button
                      onClick={() => handleMapRoute(career)}
                      className="w-full flex items-center justify-center space-x-2 bg-slate-100 dark:bg-[#0E1524] hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400 border border-slate-200 dark:border-white/10 hover:border-emerald-500/30 text-slate-700 dark:text-slate-300 text-xs font-semibold py-2.5 rounded-xl transition-all"
                    >
                      <span>Chart Path to Career</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      <StageSelectModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setPendingCareer(null); }}
        targetCareer={pendingCareer}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
};

export default CareerPage;
