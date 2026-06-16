import React, { useEffect, useState } from 'react';
import { Landmark, Trash2, Plus, AlertCircle, CheckCircle, Info, BookOpen, GraduationCap, Search, FileText } from 'lucide-react';
import { api } from '../../services/api';
import type { Node, InstituteCourseMapping } from '../../services/api';

export const AdminMappingsPage: React.FC = () => {
  const [mappings, setMappings] = useState<InstituteCourseMapping[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInstitute, setSelectedInstitute] = useState('');
  const [selectedDegree, setSelectedDegree] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [fees, setFees] = useState('');
  const [seats, setSeats] = useState('');

  // Dropdown search helpers
  const [instSearch, setInstSearch] = useState('');
  const [degSearch, setDegSearch] = useState('');
  const [examSearch, setExamSearch] = useState('');

  const [instDropdownOpen, setInstDropdownOpen] = useState(false);
  const [degDropdownOpen, setDegDropdownOpen] = useState(false);
  const [examDropdownOpen, setExamDropdownOpen] = useState(false);

  // Mappings search filter
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mappingsRes, nodesRes] = await Promise.all([
        api.getInstituteCourses(),
        api.getNodes({ limit: 1000 })
      ]);
      setMappings(mappingsRes);
      setNodes(nodesRes.nodes);
    } catch (err) {
      console.error(err);
      setError('Failed to load institute course mappings or nodes. Check backend API status.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this program offering?')) return;
    setError(null);
    setSuccess(null);
    try {
      await api.deleteInstituteCourse(id);
      setMappings(mappings.filter((m) => m._id !== id));
      setSuccess('College program offering removed successfully.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete college program.');
    }
  };

  const handleCreateMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedInstitute || !selectedDegree || !specialization) {
      setError('Please select an Institute, a Degree, and provide a Specialization name.');
      return;
    }

    try {
      const payload = {
        institute: selectedInstitute,
        degree: selectedDegree,
        entranceExam: selectedExam || undefined,
        specialization: specialization.trim(),
        fees: fees ? parseInt(fees, 10) : undefined,
        seats: seats ? parseInt(seats, 10) : undefined
      };

      const newMapping = await api.createInstituteCourse(payload);
      setMappings([newMapping, ...mappings]);
      setSuccess('New college program offering established successfully.');

      // Reset Form
      setSelectedInstitute('');
      setSelectedDegree('');
      setSelectedExam('');
      setSpecialization('');
      setFees('');
      setSeats('');
      setInstSearch('');
      setDegSearch('');
      setExamSearch('');
      setShowCreateModal(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to establish college program.');
    }
  };

  // Node Filters
  const filteredInstitutes = nodes.filter(n =>
    n.type === 'INSTITUTE' &&
    (n.name.toLowerCase().includes(instSearch.toLowerCase()) ||
     (n.location && (n.location.city.toLowerCase().includes(instSearch.toLowerCase()) ||
                     n.location.state.toLowerCase().includes(instSearch.toLowerCase()))))
  );

  const filteredDegrees = nodes.filter(n =>
    n.type === 'DEGREE' &&
    n.name.toLowerCase().includes(degSearch.toLowerCase())
  );

  const filteredExams = nodes.filter(n =>
    n.type === 'EXAM' &&
    n.name.toLowerCase().includes(examSearch.toLowerCase())
  );

  const getInstituteNodeName = () => {
    const node = nodes.find(n => n._id === selectedInstitute);
    return node ? `${node.name} (${node.location?.city})` : 'Select College / Institute...';
  };

  const getDegreeNodeName = () => {
    const node = nodes.find(n => n._id === selectedDegree);
    return node ? `${node.name}` : 'Select Degree Course...';
  };

  const getExamNodeName = () => {
    const node = nodes.find(n => n._id === selectedExam);
    return node ? `${node.name}` : 'None (Direct Entry)';
  };

  // Search filter for mappings list
  const filteredMappings = mappings.filter(m => {
    const query = searchQuery.toLowerCase();
    const instName = m.institute?.name?.toLowerCase() || '';
    const degName = m.degree?.name?.toLowerCase() || '';
    const examName = m.entranceExam?.name?.toLowerCase() || '';
    const spec = m.specialization?.toLowerCase() || '';
    const loc = m.institute?.location ? `${m.institute.location.city} ${m.institute.location.state}`.toLowerCase() : '';

    return instName.includes(query) ||
           degName.includes(query) ||
           examName.includes(query) ||
           spec.includes(query) ||
           loc.includes(query);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2.5">
            <Landmark className="w-8 h-8 text-cyan-600 dark:text-brandCyan" />
            <span>College Offerings & Programs</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Link colleges to their degrees, specializations, entrance exam requirements, fees, and seat structures.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-brandCyan to-brandIndigo hover:brightness-115 text-white text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-lg active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add College Program</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center space-x-2 p-4 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-xl text-sm animate-fadeIn">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-2 p-4 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm animate-fadeIn">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/5">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search programs, colleges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brandCyan"
          />
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400">
          Showing <span className="font-bold text-slate-900 dark:text-white">{filteredMappings.length}</span> of {mappings.length} established programs
        </div>
      </div>

      {/* Mappings Table */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 dark:text-slate-400 animate-pulse text-sm">
          Loading college programs catalog data...
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl border border-slate-200/50 dark:border-white/5">
          {filteredMappings.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <Info className="w-12 h-12 mx-auto mb-3 text-slate-400 dark:text-slate-600 animate-pulse" />
              <p className="text-sm">No program offerings found. Try modifying filters or create a new program.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-white/5 text-[10px]">
                    <th className="p-4">College / University</th>
                    <th className="p-4">Degree Course</th>
                    <th className="p-4">Specialization</th>
                    <th className="p-4">Entrance Exam</th>
                    <th className="p-4">Fees & Seats</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                  {filteredMappings.map((mapping) => (
                    <tr key={mapping._id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      {/* Institute */}
                      <td className="p-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{mapping.institute?.name || 'Unknown'}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {mapping.institute?.location?.city}, {mapping.institute?.location?.state}
                        </div>
                      </td>

                      {/* Degree */}
                      <td className="p-4">
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center space-x-1">
                          <GraduationCap className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                          <span>{mapping.degree?.name || 'Unknown'}</span>
                        </div>
                        <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wide font-mono mt-0.5">
                          Level: {mapping.degree?.level || 'N/A'}
                        </div>
                      </td>

                      {/* Specialization */}
                      <td className="p-4">
                        <div className="flex items-center space-x-1">
                          <BookOpen className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span className="font-semibold text-teal-700 dark:text-teal-300">{mapping.specialization}</span>
                        </div>
                      </td>

                      {/* Exam */}
                      <td className="p-4">
                        {mapping.entranceExam ? (
                          <div className="flex items-center space-x-1.5">
                            <FileText className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                            <span className="bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                              {mapping.entranceExam.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400 italic">Direct Entry</span>
                        )}
                      </td>

                      {/* Fees & Seats */}
                      <td className="p-4 space-y-1">
                        <div className="flex items-center space-x-1 text-slate-700 dark:text-slate-200">
                          <span className="text-[10px] text-slate-500">Fees:</span>
                          <span className="font-semibold">
                            {mapping.fees ? `₹${(mapping.fees / 100000).toFixed(2)}L /yr` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 text-slate-700 dark:text-slate-200">
                          <span className="text-[10px] text-slate-500">Seats:</span>
                          <span className="font-semibold">{mapping.seats || 'N/A'} Intake</span>
                        </div>
                      </td>

                      {/* Delete */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDelete(mapping._id)}
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-[#080C14]/85 backdrop-blur-sm animate-fadeIn">
          <div className="glass w-full max-w-xl rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center bg-slate-50 dark:bg-white/5 px-6 py-4 border-b border-slate-200 dark:border-white/5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create College Program</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-bold text-lg focus:outline-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateMapping} className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Institute Dropdown */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  College / Institute
                </label>
                <div 
                  onClick={() => setInstDropdownOpen(!instDropdownOpen)}
                  className="w-full bg-white dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 cursor-pointer flex justify-between items-center text-sm"
                >
                  <span className={selectedInstitute ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400 dark:text-slate-500'}>
                    {getInstituteNodeName()}
                  </span>
                  <Landmark className="w-4 h-4 text-slate-500" />
                </div>
                {instDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 z-30 bg-slate-50 dark:bg-[#0E1524] border border-slate-200 dark:border-white/15 rounded-xl mt-1.5 shadow-xl max-h-52 overflow-y-auto p-2 space-y-2">
                    <input
                      type="text"
                      placeholder="Type to filter institutes..."
                      value={instSearch}
                      onChange={(e) => setInstSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-white dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brandCyan"
                    />
                    <div className="space-y-1">
                      {filteredInstitutes.slice(0, 30).map(node => (
                        <div
                          key={node._id}
                          onClick={() => {
                            setSelectedInstitute(node._id);
                            setInstDropdownOpen(false);
                          }}
                          className="px-3 py-2 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer flex justify-between items-center"
                        >
                          <span>{node.name}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">({node.location?.city})</span>
                        </div>
                      ))}
                      {filteredInstitutes.length === 0 && (
                        <div className="text-[11px] text-slate-500 p-2 text-center">No institutes found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Degree Dropdown */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider font-semibold">
                  Degree Course
                </label>
                <div 
                  onClick={() => setDegDropdownOpen(!degDropdownOpen)}
                  className="w-full bg-white dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 cursor-pointer flex justify-between items-center text-sm"
                >
                  <span className={selectedDegree ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-455 dark:text-slate-500'}>
                    {getDegreeNodeName()}
                  </span>
                  <GraduationCap className="w-4 h-4 text-slate-500" />
                </div>
                {degDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 z-30 bg-slate-50 dark:bg-[#0E1524] border border-slate-200 dark:border-white/15 rounded-xl mt-1.5 shadow-xl max-h-52 overflow-y-auto p-2 space-y-2">
                    <input
                      type="text"
                      placeholder="Type to filter degrees..."
                      value={degSearch}
                      onChange={(e) => setDegSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-white dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-455 dark:placeholder-slate-500 focus:outline-none focus:border-brandCyan"
                    />
                    <div className="space-y-1">
                      {filteredDegrees.slice(0, 30).map(node => (
                        <div
                          key={node._id}
                          onClick={() => {
                            setSelectedDegree(node._id);
                            setDegDropdownOpen(false);
                          }}
                          className="px-3 py-2 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer flex justify-between items-center"
                        >
                          <span>{node.name}</span>
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-mono">{node.level}</span>
                        </div>
                      ))}
                      {filteredDegrees.length === 0 && (
                        <div className="text-[11px] text-slate-500 p-2 text-center">No degrees found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Specialization Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider font-semibold">
                  Course Specialization
                </label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science & Engineering, Fashion Design"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full bg-white dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brandCyan"
                  required
                />
              </div>

              {/* Entrance Exam Dropdown (Optional) */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider font-semibold">
                  Required Entrance Exam (Optional)
                </label>
                <div 
                  onClick={() => setExamDropdownOpen(!examDropdownOpen)}
                  className="w-full bg-white dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 cursor-pointer flex justify-between items-center text-sm"
                >
                  <span className="text-slate-900 dark:text-white font-medium">
                    {getExamNodeName()}
                  </span>
                  <FileText className="w-4 h-4 text-slate-500" />
                </div>
                {examDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 z-30 bg-slate-50 dark:bg-[#0E1524] border border-slate-200 dark:border-white/15 rounded-xl mt-1.5 shadow-xl max-h-52 overflow-y-auto p-2 space-y-2">
                    <input
                      type="text"
                      placeholder="Type to filter exams..."
                      value={examSearch}
                      onChange={(e) => setExamSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-white dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-455 dark:placeholder-slate-500 focus:outline-none focus:border-brandCyan"
                    />
                    <div className="space-y-1">
                      <div
                        onClick={() => {
                          setSelectedExam('');
                          setExamDropdownOpen(false);
                        }}
                        className="px-3 py-2 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      >
                        None (Direct Admission)
                      </div>
                      {filteredExams.slice(0, 30).map(node => (
                        <div
                          key={node._id}
                          onClick={() => {
                            setSelectedExam(node._id);
                            setExamDropdownOpen(false);
                          }}
                          className="px-3 py-2 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        >
                          {node.name}
                        </div>
                      ))}
                      {filteredExams.length === 0 && (
                        <div className="text-[11px] text-slate-500 p-2 text-center">No exams found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Fees and Seats */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider font-semibold">
                    Annual Fees (INR)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 200000"
                    value={fees}
                    onChange={(e) => setFees(e.target.value)}
                    className="w-full bg-white dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brandCyan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider font-semibold">
                    Seat Intake Capacity
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 120"
                    value={seats}
                    onChange={(e) => setSeats(e.target.value)}
                    className="w-full bg-white dark:bg-[#080C14] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brandCyan"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t border-slate-200 dark:border-white/5">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-brandCyan to-brandIndigo hover:brightness-110 text-white font-bold py-3 rounded-xl transition-all"
                >
                  Save Mapping
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

export default AdminMappingsPage;
