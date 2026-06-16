import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Award, 
  Layers, 
  Network, 
  GraduationCap, 
  Briefcase, 
  Landmark,
  X,
  AlertTriangle,
  Check
} from 'lucide-react';
import { api } from '../../services/api';
import type { Node } from '../../services/api';

interface AdminNodesPageProps {
  nodeType: 'QUALIFICATION' | 'STREAM' | 'SUBJECT_COMBINATION' | 'DEGREE' | 'OCCUPATION' | 'INSTITUTE';
}

export const AdminNodesPage: React.FC<AdminNodesPageProps> = ({ nodeType }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    level: 1, // Qualification
    subjects: '', // SubjectCombination (comma separated)
    durationYears: 3, // Degree
    degreeLevel: 'UG', // Degree
    salaryMin: 300000, // Occupation
    salaryMax: 600000, // Occupation
    salaryCurrency: 'INR', // Occupation
    growthRate: 'MEDIUM', // Occupation
    sector: '', // Occupation
    city: '', // Institute
    state: '', // Institute
    nirfRanking: '', // Institute
    ownership: 'GOVERNMENT', // Institute
    category: 'General' // Institute
  });

  const getPageInfo = () => {
    switch (nodeType) {
      case 'QUALIFICATION':
        return { title: 'Education Milestones', desc: 'Define educational milestones (e.g. Class 10, Class 12).', icon: Award, color: 'text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/5' };
      case 'STREAM':
        return { title: 'Academic Streams', desc: 'Configure stream divisions (e.g. Science PCM, Science PCB, Commerce, Arts).', icon: Layers, color: 'text-purple-600 dark:text-purple-400 border-purple-500/20 bg-purple-500/5' };
      case 'SUBJECT_COMBINATION':
        return { title: 'Subject Combinations', desc: 'Define required subject lists for pathway mapping.', icon: Network, color: 'text-pink-600 dark:text-pink-400 border-pink-500/20 bg-pink-500/5' };
      case 'DEGREE':
        return { title: 'Degree Courses', desc: 'Manage under-graduate and post-graduate degree offerings.', icon: GraduationCap, color: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/5' };
      case 'OCCUPATION':
        return { title: 'Target Careers', desc: 'Configure target careers, industries, salary scopes, and growth metrics.', icon: Briefcase, color: 'text-blue-600 dark:text-blue-400 border-blue-500/20 bg-blue-500/5' };
      case 'INSTITUTE':
        return { title: 'Colleges & Universities', desc: 'Manage educational institutes, NIRF rankings, and ownership classifications.', icon: Landmark, color: 'text-cyan-600 dark:text-cyan-400 border-cyan-500/20 bg-cyan-500/5' };
    }
  };

  const page = getPageInfo();

  useEffect(() => {
    loadNodes();
  }, [nodeType]);

  const loadNodes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getNodes({ type: nodeType, limit: 1000 });
      setNodes(res.nodes);
    } catch (err) {
      console.error(err);
      setError(`Failed to retrieve ${page.title}. Verify API status.`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setSelectedNode(null);
    setFormData({
      name: '',
      description: '',
      level: 1,
      subjects: '',
      durationYears: 3,
      degreeLevel: 'UG',
      salaryMin: 300000,
      salaryMax: 600000,
      salaryCurrency: 'INR',
      growthRate: 'MEDIUM',
      sector: '',
      city: '',
      state: '',
      nirfRanking: '',
      ownership: 'GOVERNMENT',
      category: 'General'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (node: Node) => {
    setSelectedNode(node);
    setFormData({
      name: node.name,
      description: node.description || '',
      level: typeof node.level === 'number' ? node.level : (parseInt(node.level as string) || 1),
      subjects: Array.isArray(node.subjects) ? node.subjects.join(', ') : '',
      durationYears: node.durationYears || 3,
      degreeLevel: node.level && typeof node.level === 'string' && ['UG', 'PG', 'DIPLOMA', 'DOCTORATE', 'CERTIFICATE'].includes(node.level) ? node.level : 'UG',
      salaryMin: node.averageSalaryRange?.min || 300000,
      salaryMax: node.averageSalaryRange?.max || 600000,
      salaryCurrency: node.averageSalaryRange?.currency || 'INR',
      growthRate: node.growthRate || 'MEDIUM',
      sector: node.sector || '',
      city: node.location?.city || '',
      state: node.location?.state || '',
      nirfRanking: node.nirfRanking ? String(node.nirfRanking) : '',
      ownership: node.ownership || 'GOVERNMENT',
      category: node.category || 'General'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${nodeType.toLowerCase()}? This could break related pathways, gateway requirements or college program offerings.`)) return;
    setError(null);
    setSuccessMsg(null);
    try {
      await api.deleteNode(id);
      setNodes(nodes.filter(n => n._id !== id));
      setSuccessMsg('Item deleted successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to delete the item. It may be referenced by active gateway requirements or college program offerings.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Build payload depending on node type
    const payload: any = {
      name: formData.name.trim(),
      type: nodeType,
      description: formData.description.trim()
    };

    if (nodeType === 'QUALIFICATION') {
      payload.level = Number(formData.level);
    } else if (nodeType === 'SUBJECT_COMBINATION') {
      payload.subjects = formData.subjects.split(',').map(s => s.trim()).filter(s => s.length > 0);
      if (payload.subjects.length === 0) {
        setError('At least one subject name is required.');
        return;
      }
    } else if (nodeType === 'DEGREE') {
      payload.durationYears = Number(formData.durationYears);
      payload.level = formData.degreeLevel; // level stores the UG/PG string discriminator for degrees
    } else if (nodeType === 'OCCUPATION') {
      payload.averageSalaryRange = {
        min: Number(formData.salaryMin),
        max: Number(formData.salaryMax),
        currency: formData.salaryCurrency
      };
      payload.growthRate = formData.growthRate;
      payload.sector = formData.sector.trim();
    } else if (nodeType === 'INSTITUTE') {
      payload.location = {
        city: formData.city.trim(),
        state: formData.state.trim()
      };
      payload.ownership = formData.ownership;
      payload.category = formData.category.trim();
      if (formData.nirfRanking) {
        payload.nirfRanking = Number(formData.nirfRanking);
      }
    }

    try {
      if (selectedNode) {
        const updated = await api.updateNode(selectedNode._id, payload);
        setNodes(nodes.map(n => n._id === selectedNode._id ? updated : n));
        setSuccessMsg('Item updated successfully.');
      } else {
        const created = await api.createNode(payload);
        setNodes([created, ...nodes]);
        setSuccessMsg('Item created successfully.');
      }
      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Validation error saving item. Verify fields.');
    }
  };

  const filteredNodes = nodes.filter(n =>
    n.name.toLowerCase().includes(search.toLowerCase()) ||
    (n.description && n.description.toLowerCase().includes(search.toLowerCase()))
  );

  const Icon = page.icon;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Local Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-2xl border ${page.color}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{page.title}</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{page.desc}</p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-brandCyan to-brandIndigo hover:brightness-110 text-white text-xs font-bold px-4 py-3 rounded-xl transition-all shadow-lg active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Element</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-xl flex items-center space-x-2">
          <Check className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-xs font-semibold rounded-xl flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Table */}
      <div className="glass rounded-2xl border border-slate-200/50 dark:border-white/5 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 flex items-center">
          <Search className="w-4 h-4 text-slate-500 mr-2" />
          <input
            type="text"
            placeholder={`Search ${page.title.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-0 outline-none focus:ring-0 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 w-full"
          />
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500 dark:text-slate-400 text-sm animate-pulse">
            Loading {page.title.toLowerCase()}...
          </div>
        ) : filteredNodes.length === 0 ? (
          <div className="text-center py-20 text-slate-500 dark:text-slate-400 text-sm">
            No {page.title.toLowerCase()} found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-white/[0.02]">
                  <th className="p-4 w-1/3">Name</th>
                  <th className="p-4 w-1/3">Details</th>
                  <th className="p-4 w-1/6">Description</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNodes.map((node) => (
                  <tr key={node._id} className="border-b border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-all">
                    <td className="p-4 font-bold text-slate-900 dark:text-white">{node.name}</td>
                    <td className="p-4 text-xs">
                      {nodeType === 'QUALIFICATION' && (
                        <span className="bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded">
                          Level {node.level}
                        </span>
                      )}
                      {nodeType === 'STREAM' && (
                        <span className="text-slate-500 dark:text-slate-400 italic">No extra properties</span>
                      )}
                      {nodeType === 'SUBJECT_COMBINATION' && (
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(node.subjects) && node.subjects.map((sub, idx) => (
                            <span key={idx} className="bg-pink-100 dark:bg-pink-500/10 border border-pink-200 dark:border-pink-500/20 text-pink-700 dark:text-pink-400 px-1.5 py-0.5 rounded text-[10px]">
                              {sub}
                            </span>
                          ))}
                        </div>
                      )}
                      {nodeType === 'DEGREE' && (
                        <div className="space-y-1 text-slate-700 dark:text-slate-300">
                          <span className="bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] uppercase font-bold mr-1">
                            {node.level}
                          </span>
                          <span>
                            {node.durationYears} Years duration
                          </span>
                        </div>
                      )}
                      {nodeType === 'OCCUPATION' && (
                        <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400">
                              {node.growthRate} Growth
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">Sector: {node.sector}</span>
                          </div>
                          <div className="font-mono text-slate-500 dark:text-slate-400">
                            Avg Salary: {node.averageSalaryRange?.min?.toLocaleString()} - {node.averageSalaryRange?.max?.toLocaleString()} {node.averageSalaryRange?.currency || 'INR'}
                          </div>
                        </div>
                      )}
                      {nodeType === 'INSTITUTE' && (
                        <div className="space-y-1 text-slate-700 dark:text-slate-300">
                          <div className="flex flex-wrap gap-1">
                            <span className="bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 text-cyan-700 dark:text-cyan-400 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">
                              {node.ownership?.replace(/_/g, ' ')}
                            </span>
                            {node.nirfRanking && (
                              <span className="bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                NIRF #{node.nirfRanking}
                              </span>
                            )}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400">
                            {node.location?.city}, {node.location?.state}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 text-xs truncate max-w-xs">{node.description || '—'}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEdit(node)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded border border-slate-200 dark:border-transparent transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(node._id)}
                          className="p-1.5 bg-slate-100 hover:bg-red-500/10 text-slate-500 hover:text-red-600 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:text-red-400 rounded border border-slate-200 dark:border-transparent transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Form Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="glass max-w-lg w-full rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-2xl relative">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {selectedNode ? `Edit ${page.title.slice(0, -1)}` : `Create ${page.title.slice(0, -1)}`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Bachelor of Technology (B.Tech)"
                  className="w-full bg-white dark:bg-[#0d1424] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brandCyan"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide educational or occupational details..."
                  rows={3}
                  className="w-full bg-white dark:bg-[#0d1424] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brandCyan resize-none"
                />
              </div>

              {/* Specific Field Renderers */}
              {nodeType === 'QUALIFICATION' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">Sequence Level</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={20}
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) })}
                    className="w-full bg-white dark:bg-[#0d1424] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brandCyan"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Must be a number representation of the pathway sequence hierarchy.</span>
                </div>
              )}

              {nodeType === 'SUBJECT_COMBINATION' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">Subjects (comma separated)</label>
                  <input
                    type="text"
                    required
                    value={formData.subjects}
                    onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                    placeholder="e.g. Physics, Chemistry, Mathematics"
                    className="w-full bg-white dark:bg-[#0d1424] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brandCyan"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Provide comma-separated entries of mandatory subject names.</span>
                </div>
              )}

              {nodeType === 'DEGREE' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">Duration (Years)</label>
                    <input
                      type="number"
                      required
                      step="0.5"
                      min="0.5"
                      max="8"
                      value={formData.durationYears}
                      onChange={(e) => setFormData({ ...formData, durationYears: Number(e.target.value) })}
                      className="w-full bg-white dark:bg-[#0d1424] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brandCyan"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">Level</label>
                    <select
                      value={formData.degreeLevel}
                      onChange={(e) => setFormData({ ...formData, degreeLevel: e.target.value })}
                      className="w-full bg-white dark:bg-[#0d1424] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brandCyan cursor-pointer"
                    >
                      <option value="UG">Undergraduate (UG)</option>
                      <option value="PG">Postgraduate (PG)</option>
                      <option value="DIPLOMA">Diploma</option>
                      <option value="DOCTORATE">Doctorate</option>
                      <option value="CERTIFICATE">Certificate</option>
                    </select>
                  </div>
                </div>
              )}

              {nodeType === 'OCCUPATION' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1 col-span-2">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">Min Salary</label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={formData.salaryMin}
                        onChange={(e) => setFormData({ ...formData, salaryMin: Number(e.target.value) })}
                        className="w-full bg-white dark:bg-[#0d1424] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brandCyan"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">Currency</label>
                      <input
                        type="text"
                        required
                        maxLength={3}
                        value={formData.salaryCurrency}
                        onChange={(e) => setFormData({ ...formData, salaryCurrency: e.target.value.toUpperCase() })}
                        className="w-full bg-white dark:bg-[#0d1424] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brandCyan uppercase font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">Max Salary</label>
                    <input
                      type="number"
                      required
                      min={formData.salaryMin}
                      value={formData.salaryMax}
                      onChange={(e) => setFormData({ ...formData, salaryMax: Number(e.target.value) })}
                      className="w-full bg-white dark:bg-[#0d1424] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brandCyan"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">Growth Rate</label>
                      <select
                        value={formData.growthRate}
                        onChange={(e) => setFormData({ ...formData, growthRate: e.target.value })}
                        className="w-full bg-white dark:bg-[#0d1424] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brandCyan cursor-pointer"
                      >
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">Sector</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Technology"
                        value={formData.sector}
                        onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                        className="w-full bg-white dark:bg-[#0d1424] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brandCyan"
                      />
                    </div>
                  </div>
                </div>
              )}

              {nodeType === 'INSTITUTE' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">City</label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full bg-white dark:bg-[#0d1424] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brandCyan"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">State</label>
                      <input
                        type="text"
                        required
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full bg-white dark:bg-[#0d1424] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brandCyan"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">NIRF Ranking (optional)</label>
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={formData.nirfRanking}
                        onChange={(e) => setFormData({ ...formData, nirfRanking: e.target.value })}
                        className="w-full bg-white dark:bg-[#0d1424] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brandCyan"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">Ownership</label>
                      <select
                        value={formData.ownership}
                        onChange={(e) => setFormData({ ...formData, ownership: e.target.value })}
                        className="w-full bg-white dark:bg-[#0d1424] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brandCyan cursor-pointer"
                      >
                        <option value="GOVERNMENT">Government</option>
                        <option value="PRIVATE">Private</option>
                        <option value="SEMI_GOVERNMENT">Semi Government</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g. Engineering, Management, General"
                      className="w-full bg-white dark:bg-[#0d1424] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brandCyan"
                    />
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-white/5 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl border border-slate-200 dark:border-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-brandCyan to-brandIndigo hover:brightness-110 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-brandCyan/10 active:scale-95"
                >
                  Save Element
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNodesPage;
