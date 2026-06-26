import React, { useEffect, useState } from 'react';
import { 
  Landmark, 
  MapPin, 
  Award, 
  Shield, 
  GraduationCap, 
  DollarSign, 
  TrendingUp, 
  Sliders, 
  Info, 
  Search, 
  ExternalLink,
  Briefcase
} from 'lucide-react';
import { api } from '../../services/api';
import type { Node, InstituteCourseMapping } from '../../services/api';
import { CustomDropdown } from '../../components/common/CustomDropdown';

export const InstitutePage: React.FC = () => {
  // Tabs State
  const [activeTab, setActiveTab] = useState<'EXPLORE' | 'RECOMMEND'>('EXPLORE');

  // EXPLORE Tab State
  const [institutes, setInstitutes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedOwnership, setSelectedOwnership] = useState('ALL');
  const [sortByNirf, setSortByNirf] = useState(true);

  // RECOMMEND Tab State
  const [degrees, setDegrees] = useState<Node[]>([]);
  const [careers, setCareers] = useState<Node[]>([]);
  const [recs, setRecs] = useState<InstituteCourseMapping[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsError, setRecsError] = useState<string | null>(null);

  // Recommender Form Inputs
  const [mode, setMode] = useState<'DEGREE' | 'CAREER'>('DEGREE');
  const [selectedDegreeId, setSelectedDegreeId] = useState('');
  const [selectedCareerId, setSelectedCareerId] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [ownershipFilter, setOwnershipFilter] = useState('ALL');
  const [maxFees, setMaxFees] = useState<number>(400000); // Default 4L
  const [sortBy, setSortBy] = useState<'nirf' | 'fees' | 'package' | 'placementRate'>('nirf');

  // Load Base Directory Institutes
  useEffect(() => {
    const fetchInstitutes = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getNodes({ type: 'INSTITUTE', limit: 100 });
        setInstitutes(data.nodes);
      } catch (err) {
        console.error(err);
        setError('Failed to load institutes.');
      } finally {
        setLoading(false);
      }
    };
    fetchInstitutes();
  }, []);

  // Load Dropdowns for Recommender (Degrees & Careers)
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [degRes, carRes] = await Promise.all([
          api.getNodes({ type: 'DEGREE', limit: 100 }),
          api.getNodes({ type: 'OCCUPATION', limit: 100 })
        ]);
        setDegrees(degRes.nodes);
        setCareers(carRes.nodes);
        if (degRes.nodes.length > 0) setSelectedDegreeId(degRes.nodes[0]._id);
        if (carRes.nodes.length > 0) setSelectedCareerId(carRes.nodes[0]._id);
      } catch (err) {
        console.error('Failed to load recommendation inputs', err);
      }
    };
    loadDropdowns();
  }, []);

  // Trigger Recommendations Query Reactively
  useEffect(() => {
    if (activeTab !== 'RECOMMEND') return;

    const fetchRecommendations = async () => {
      recsLoading === false && setRecsLoading(true);
      setRecsError(null);
      try {
        const params: any = {
          state: stateFilter || undefined,
          ownership: ownershipFilter !== 'ALL' ? ownershipFilter : undefined,
          maxFees: maxFees || undefined,
          sortBy
        };

        if (mode === 'DEGREE' && selectedDegreeId) {
          params.degreeId = selectedDegreeId;
        } else if (mode === 'CAREER' && selectedCareerId) {
          params.careerId = selectedCareerId;
        }

        const data = await api.getRecommendations(params);
        setRecs(data);
      } catch (err) {
        console.error(err);
        setRecsError('Could not compute college recommendations.');
      } finally {
        setRecsLoading(false);
      }
    };

    // Simple delay debounce for text typing in state filter
    const handler = setTimeout(() => {
      fetchRecommendations();
    }, 300);

    return () => clearTimeout(handler);
  }, [
    activeTab,
    mode,
    selectedDegreeId,
    selectedCareerId,
    stateFilter,
    ownershipFilter,
    maxFees,
    sortBy
  ]);

  // Filters for Explore tab
  const filteredInstitutes = institutes.filter((inst) => {
    const matchesSearch = inst.name.toLowerCase().includes(search.toLowerCase()) || 
                          (inst.location && (inst.location.city.toLowerCase().includes(search.toLowerCase()) || 
                                             inst.location.state.toLowerCase().includes(search.toLowerCase()))) ||
                          inst.description.toLowerCase().includes(search.toLowerCase());
    const matchesOwnership = selectedOwnership === 'ALL' || inst.ownership === selectedOwnership;
    return matchesSearch && matchesOwnership;
  });

  const sortedInstitutes = [...filteredInstitutes].sort((a, b) => {
    if (sortByNirf) {
      const rankA = a.nirfRanking ?? 9999;
      const rankB = b.nirfRanking ?? 9999;
      return rankA - rankB;
    }
    return a.name.localeCompare(b.name);
  });

  const formatCurrency = (val?: number) => {
    if (!val) return 'N/A';
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    return `₹${val}`;
  };

  const formatPackage = (val?: number) => {
    if (!val) return 'N/A';
    return `₹${(val / 100000).toFixed(1)} LPA`;
  };

  const ownershipOptions = [
    { value: 'ALL', label: 'All Ownerships' },
    { value: 'GOVERNMENT', label: 'Government' },
    { value: 'PRIVATE', label: 'Private' },
    { value: 'SEMI_GOVERNMENT', label: 'Semi-Government' }
  ];

  const degreeOptions = degrees.map((d) => ({
    value: d._id,
    label: d.name,
    icon: GraduationCap
  }));

  const careerOptions = careers.map((c) => ({
    value: c._id,
    label: c.name,
    icon: Briefcase
  }));

  const sortOptions = [
    { value: 'nirf', label: 'NIRF National Rank (Low → High)' },
    { value: 'package', label: 'Average Placements package (High → Low)' },
    { value: 'placementRate', label: 'Placement Success rate (High → Low)' },
    { value: 'fees', label: 'Estimated Fees (Low → High)' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Top Banner and Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200 dark:border-white/5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2.5">
            <Landmark className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
            <span>College Directory & Explorer</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Browse through directories or consult the recommendation engine to find matching colleges.
          </p>
        </div>

        {/* Premium Tab Toggles */}
        <div className="flex bg-slate-100 dark:bg-[#080C14] p-1 rounded-xl border border-slate-200 dark:border-white/10 self-start md:self-auto shadow-inner shadow-black">
          <button
            onClick={() => setActiveTab('EXPLORE')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'EXPLORE'
                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 dark:border-cyan-500/10 shadow-glow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:dark:text-white border border-transparent'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Institute Directory</span>
          </button>
          <button
            onClick={() => setActiveTab('RECOMMEND')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'RECOMMEND'
                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 dark:border-cyan-500/10 shadow-glow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:dark:text-white border border-transparent'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Smart Recommender</span>
          </button>
        </div>
      </div>

      {/* TAB 1: EXPLORE DIRECTORY */}
      {activeTab === 'EXPLORE' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-100/60 dark:bg-[#0E1524]/60 border border-slate-200 dark:border-white/5 p-4 rounded-2xl">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <input
                type="text"
                placeholder="Search city, state, college..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-brandCyan w-full sm:w-80"
              />

              <CustomDropdown
                options={ownershipOptions}
                value={selectedOwnership}
                onChange={setSelectedOwnership}
                className="w-full sm:w-56"
              />
            </div>

            <button
              onClick={() => setSortByNirf(!sortByNirf)}
              className={`w-full md:w-auto px-5 py-2.5 text-xs font-bold rounded-xl border transition-all ${
                sortByNirf 
                  ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-400 shadow-glow' 
                  : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:dark:text-white'
              }`}
            >
              {sortByNirf ? 'Sorted by NIRF Ranking' : 'Sorted Alphabetically'}
            </button>
          </div>

          {/* Loading & Errors */}
          {loading && (
            <div className="text-center py-24 text-slate-500 animate-pulse text-sm">
              Loading universities registry database...
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
              {sortedInstitutes.length === 0 ? (
                <div className="glass p-16 text-center text-slate-500 rounded-2xl">
                  No colleges found matching your parameters.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedInstitutes.map((inst) => (
                    <div
                      key={inst._id}
                      className="glass p-6 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col justify-between hover:border-cyan-500/40 hover:bg-slate-50 hover:dark:bg-[#121B2F]/40 transition-all duration-300 group relative overflow-hidden shadow-sm hover:shadow-md"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-500/20 group-hover:bg-cyan-500/60 transition-colors" />

                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20 px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                            {inst.ownership || 'GOVERNMENT'}
                          </span>

                          {inst.nirfRanking && (
                            <div className="flex items-center text-xs text-amber-600 dark:text-amber-400 font-bold space-x-1">
                              <Award className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                              <span>NIRF #{inst.nirfRanking}</span>
                            </div>
                          )}
                        </div>

                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-4 group-hover:text-cyan-600 group-hover:dark:text-cyan-400 transition-colors">
                          {inst.name}
                        </h3>

                        {inst.category && (
                          <div className="text-[10px] text-cyan-600 dark:text-brandCyan bg-cyan-500/10 dark:bg-brandCyan/5 border border-cyan-500/25 dark:border-brandCyan/10 px-2 py-0.5 rounded-md inline-block mt-2 font-semibold">
                            {inst.category} Institute
                          </div>
                        )}

                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed line-clamp-3">
                          {inst.description}
                        </p>

                        <div className="mt-4 flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <MapPin className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                          <span>{inst.location?.city}, {inst.location?.state}</span>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/5 flex items-center text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center space-x-1">
                          <Shield className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>Verified Profile</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 2: SMART RECOMMENDATION ENGINE */}
      {activeTab === 'RECOMMEND' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fadeIn items-start">
          {/* Query Control Sidebar Panel */}
          <div className="glass p-5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-6 lg:col-span-1 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center space-x-2 border-b border-slate-200 dark:border-white/5 pb-3">
              <Sliders className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Query Parameters</span>
            </h2>

            {/* Mode Select */}
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Recommendation Base
              </label>
              <div className="flex bg-slate-100 dark:bg-[#080C14] p-1 rounded-xl border border-slate-200 dark:border-white/5 text-center">
                <button
                  onClick={() => setMode('DEGREE')}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    mode === 'DEGREE'
                      ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 dark:border-cyan-500/10'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 hover:dark:text-white'
                  }`}
                >
                  By Degree
                </button>
                <button
                  onClick={() => setMode('CAREER')}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    mode === 'CAREER'
                      ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 dark:border-cyan-500/10'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 hover:dark:text-white'
                  }`}
                >
                  By Career
                </button>
              </div>
            </div>

            {/* Target Select Dropdown */}
            {mode === 'DEGREE' ? (
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Target Academic Degree
                </label>
                <CustomDropdown
                  options={degreeOptions}
                  value={selectedDegreeId}
                  onChange={setSelectedDegreeId}
                  placeholder="Select target degree..."
                  showSearch={true}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Target Dream Career
                </label>
                <CustomDropdown
                  options={careerOptions}
                  value={selectedCareerId}
                  onChange={setSelectedCareerId}
                  placeholder="Select target career..."
                  showSearch={true}
                />
              </div>
            )}

            {/* Filters */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/5">
              <h3 className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                Filter Results
              </h3>

              {/* State Filter */}
              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-semibold">State</label>
                <input
                  type="text"
                  placeholder="e.g. Maharashtra, Delhi..."
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="w-full bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Ownership */}
              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Ownership Classification</label>
                <CustomDropdown
                  options={ownershipOptions}
                  value={ownershipFilter}
                  onChange={setOwnershipFilter}
                />
              </div>

              {/* Fees Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-semibold">
                  <span className="text-slate-500 dark:text-slate-400">Max Fees (Annual)</span>
                  <span className="text-cyan-600 dark:text-brandCyan font-mono">{maxFees >= 500000 ? 'Any Fees' : formatCurrency(maxFees)}</span>
                </div>
                <input
                  type="range"
                  min={10000}
                  max={500000}
                  step={10000}
                  value={maxFees}
                  onChange={(e) => setMaxFees(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-500 dark:accent-cyan-400 bg-slate-200 dark:bg-[#080C14] rounded-lg cursor-pointer h-1"
                />
              </div>
            </div>

            {/* Sorting */}
            <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-white/5">
              <label className="block text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                Sort Output By
              </label>
              <CustomDropdown
                options={sortOptions}
                value={sortBy}
                onChange={(val: any) => setSortBy(val)}
              />
            </div>
          </div>

          {/* Recommendations Listing Area */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-slate-100/60 dark:bg-[#0E1524]/60 border border-slate-200 dark:border-white/5 px-5 py-3.5 rounded-2xl flex justify-between items-center">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Found <strong className="text-slate-950 dark:text-white font-bold">{recs.length}</strong> matching universities recommended for you.
              </div>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                Sorted by {sortBy}
              </span>
            </div>

            {/* Loading & Errors */}
            {recsLoading && (
              <div className="text-center py-24 text-slate-500 animate-pulse text-sm">
                Generating smart recommendations...
              </div>
            )}

            {recsError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center text-sm">
                {recsError}
              </div>
            )}

            {/* Grid */}
            {!recsLoading && !recsError && (
              <>
                {recs.length === 0 ? (
                  <div className="glass p-16 text-center text-slate-500 rounded-2xl">
                    <Info className="w-12 h-12 mx-auto mb-3 text-slate-400 dark:text-slate-600 animate-pulse" />
                    <p className="text-sm">No recommended colleges match your selected filters.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recs.map((rec) => (
                      <div
                        key={rec._id}
                        className="glass p-6 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col justify-between hover:border-cyan-500/40 hover:bg-slate-50 hover:dark:bg-[#121B2F]/40 transition-all duration-300 group relative overflow-hidden shadow-sm hover:shadow-md"
                      >
                        <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-500/20 group-hover:bg-cyan-500/60 transition-colors" />

                        <div>
                          {/* Top row */}
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <span className="text-[9px] bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider mr-2">
                                {rec.institute?.ownership || 'GOVERNMENT'}
                              </span>
                              {rec.institute?.category && (
                                <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-white/5 px-2 py-0.5 rounded font-semibold">
                                  {rec.institute.category}
                                </span>
                              )}
                            </div>

                            {rec.institute?.nirfRanking && (
                              <div className="flex items-center text-xs text-amber-600 dark:text-amber-400 font-bold space-x-1 shrink-0">
                                <Award className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                                <span>NIRF #{rec.institute.nirfRanking}</span>
                              </div>
                            )}
                          </div>

                          {/* Institute Name */}
                          <h3 className="text-base font-bold text-slate-800 dark:text-white mt-3 group-hover:text-cyan-600 group-hover:dark:text-cyan-400 transition-colors">
                            {rec.institute?.name}
                          </h3>

                          {/* State & City */}
                          <div className="mt-1 flex items-center space-x-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <MapPin className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
                            <span>{rec.institute?.location?.city}, {rec.institute?.location?.state}</span>
                          </div>

                          {/* Offered Degree & Spec */}
                          <div className="mt-4 bg-slate-100 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5 space-y-1.5">
                            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 dark:text-white">
                              <GraduationCap className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                              <span>{rec.degree?.name} ({rec.specialization})</span>
                            </div>
                            
                            <div className="text-[10px] text-slate-600 dark:text-slate-400 flex justify-between">
                              <span>Admissions: <strong className="text-blue-600 dark:text-blue-400">{rec.entranceExam?.name || 'Direct Entry'}</strong></span>
                              <span>Seats: <strong className="text-slate-800 dark:text-slate-200">{rec.seats || 'N/A'}</strong></span>
                            </div>
                            
                            <div className="text-[10px] text-slate-600 dark:text-slate-400">
                              Annual Tuition Fees: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(rec.fees)}</strong>
                            </div>
                          </div>

                          {/* Placement Stats Dashboard Section */}
                          {rec.placementStats && (
                            <div className="mt-4 bg-slate-100/60 dark:bg-[#0E1524]/60 border border-slate-200 dark:border-brandCyan/10 p-3.5 rounded-xl grid grid-cols-2 gap-4">
                              <div className="space-y-0.5">
                                <div className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider flex items-center space-x-1">
                                  <DollarSign className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  <span>Avg Package</span>
                                </div>
                                <span className="text-sm font-extrabold text-slate-800 dark:text-white">
                                  {formatPackage(rec.placementStats.averageSalary)}
                                </span>
                              </div>

                              <div className="space-y-0.5">
                                <div className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider flex items-center space-x-1">
                                  <TrendingUp className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                                  <span>Placement Success</span>
                                </div>
                                <span className="text-sm font-extrabold text-cyan-600 dark:text-brandCyan">
                                  {rec.placementStats.placementRate}% Placed
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Portal Link */}
                        {rec.entranceExam?.website && (
                          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-white/5">
                            <a
                              href={rec.entranceExam.website.startsWith('http') ? rec.entranceExam.website : `https://${rec.entranceExam.website}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between w-full bg-slate-100 dark:bg-[#0E1524] hover:bg-cyan-500/10 hover:text-cyan-700 dark:hover:text-cyan-400 border border-slate-200 dark:border-white/10 hover:border-cyan-500/30 text-slate-700 dark:text-slate-300 text-xs font-semibold py-2 rounded-xl transition-all px-3"
                            >
                              <span>Official Exam Portal</span>
                              <ExternalLink className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
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
        </div>
      )}
    </div>
  );
};

export default InstitutePage;
