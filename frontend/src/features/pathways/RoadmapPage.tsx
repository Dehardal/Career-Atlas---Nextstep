import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Map, 
  Activity, 
  DollarSign, 
  Clock, 
  Award, 
  ExternalLink,
  MapPin,
  HelpCircle,
  X,
  TrendingUp,
  Landmark,
  Search,
  Briefcase,
  Lock,
  LogIn
} from 'lucide-react';
import { useRoadmapStore } from '../../store/useRoadmapStore';
import StreamDropdown from '../../components/common/StreamDropdown';
import { api } from '../../services/api';
import type { Node as ApiNode, Relationship, InstituteCourseMapping } from '../../services/api';
import PathwayMap from '../../components/graph/PathwayMap';
import { CustomDropdown } from '../../components/common/CustomDropdown';
import { AuthModal } from '../../components/auth/AuthModal';
import { PathwayLoader } from '../../components/graph/PathwayLoader';

export const RoadmapPage: React.FC = () => {
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const {
    startNode,
    targetNode,
    pathways,
    selectedPathIndex,
    loading,
    error,
    setStartNode,
    setTargetNode,
    setSelectedPathIndex,
    fetchPathways,
    viewMode,
    setViewMode,
    explorerNodes,
    explorerRelationships,
    expandedNodeIds,
    expandNode,
    collapseNode,
    resetExplorer,
    user,
    streamNode,
    setStreamNode
  } = useRoadmapStore();

  const [qualifications, setQualifications] = useState<ApiNode[]>([]);
  const [careers, setCareers] = useState<ApiNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<ApiNode | null>(null);

  // Fetch offering colleges when a DEGREE node is selected
  const [offeringColleges, setOfferingColleges] = useState<InstituteCourseMapping[]>([]);
  const [collegesLoading, setCollegesLoading] = useState(false);

  useEffect(() => {
    if (selectedNode && selectedNode.type === 'DEGREE') {
      const fetchColleges = async () => {
        setCollegesLoading(true);
        try {
          const res = await api.getInstituteCourses({ degree: selectedNode._id });
          setOfferingColleges(res);
        } catch (err) {
          console.error('Failed to load offering colleges', err);
          setOfferingColleges([]);
        } finally {
          setCollegesLoading(false);
        }
      };
      fetchColleges();
    } else {
      setOfferingColleges([]);
    }
  }, [selectedNode]);

  // Load dropdown options for inline selection
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const qualsRes = await api.getNodes({ type: 'QUALIFICATION', limit: 100 });
        const careersRes = await api.getNodes({ type: 'OCCUPATION', limit: 100 });
        setQualifications(qualsRes.nodes);
        setCareers(careersRes.nodes);
      } catch (err) {
        console.error('Failed to load dropdown options', err);
      }
    };
    loadDropdowns();
  }, []);

  // Fetch pathways when start/target nodes change
  useEffect(() => {
    const needStream = startNode?.type === 'STAGE' && startNode?.name === 'Class 12';
    if (startNode && targetNode && (!needStream || (needStream && streamNode))) {
      fetchPathways();
    }
  }, [startNode, targetNode, streamNode, fetchPathways]);

  // Aggregate all nodes and relationships across all pathways
  const allNodes: ApiNode[] = [];
  const allRelationships: Relationship[] = [];

  pathways.forEach((path) => {
    path.steps.forEach((step) => {
      if (!allNodes.some((n) => n._id === step.node._id)) {
        allNodes.push(step.node);
      }
      if (step.relationship) {
        const fromId = typeof step.relationship.fromNode === 'string' 
          ? step.relationship.fromNode 
          : step.relationship.fromNode._id;
        const toId = typeof step.relationship.toNode === 'string' 
          ? step.relationship.toNode 
          : step.relationship.toNode._id;
        
        if (!allRelationships.some((r) => {
          const rFromId = typeof r.fromNode === 'string' ? r.fromNode : r.fromNode._id;
          const rToId = typeof r.toNode === 'string' ? r.toNode : r.toNode._id;
          return rFromId === fromId && rToId === toId;
        })) {
          allRelationships.push(step.relationship);
        }
      }
    });
  });

  const activePathNodeIds = pathways[selectedPathIndex]?.steps.map((s) => s.node._id) || [];

  const handleStartChange = (id: string) => {
    const nodeObj = qualifications.find((q) => q._id === id) || null;
    setStartNode(nodeObj);
    setSelectedNode(null);
  };

  const handleTargetChange = (id: string) => {
    const nodeObj = careers.find((c) => c._id === id) || null;
    setTargetNode(nodeObj);
    setSelectedNode(null);
  };

  const startOptions = qualifications.map((q) => ({
    value: q._id,
    label: q.name,
    icon: Search
  }));

  const targetOptions = careers.map((c) => ({
    value: c._id,
    label: c.name,
    icon: Briefcase
  }));

  // Helper for currency and range formatting
  const formatCurrency = (val?: number) => {
    if (!val) return 'N/A';
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    return `₹${val}`;
  };

  const handleExpandAll = async () => {
    const unexpanded = explorerNodes.filter((n) => !expandedNodeIds.includes(n._id));
    if (unexpanded.length === 0) return;
    await Promise.all(unexpanded.map((n) => expandNode(n._id)));
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden transition-colors duration-300">
      {/* Sidebar Controls */}
      <div className="w-full lg:w-80 border-r border-slate-200 dark:border-white/5 bg-white/85 dark:bg-[#090D16]/80 backdrop-blur-md p-5 flex flex-col space-y-6 overflow-y-auto shrink-0">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        {/* View Mode Toggle */}
        <div className="flex bg-slate-100 dark:bg-[#080C14] p-1 rounded-xl border border-slate-200 dark:border-white/5">
          <button
            onClick={() => setViewMode('PATH')}
            className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'PATH'
                ? 'bg-indigo-100 dark:bg-brandIndigo/25 text-cyan-700 dark:text-brandCyan shadow-glow border border-indigo-200 dark:border-brandCyan/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-950 hover:dark:text-white border border-transparent'
            }`}
          >
            Path Finder
          </button>
          <button
            onClick={() => setViewMode('EXPLORER')}
            className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'EXPLORER'
                ? 'bg-indigo-100 dark:bg-brandIndigo/25 text-cyan-700 dark:text-brandCyan shadow-glow border border-indigo-200 dark:border-brandCyan/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-950 hover:dark:text-white border border-transparent'
            }`}
          >
            Interactive Explorer
          </button>
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
            <Map className="w-5 h-5 text-cyan-600 dark:text-brandCyan" />
            <span>{viewMode === 'EXPLORER' ? 'Explorer Settings' : 'Path Settings'}</span>
          </h2>

          <div className="space-y-4">
            <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Start Point
            </label>
            <CustomDropdown
              options={startOptions}
              value={startNode?._id || ''}
              onChange={handleStartChange}
              placeholder="Select current state..."
              showSearch={true}
            />
          </div>
          {startNode?.type === 'STAGE' && startNode?.name === 'Class 12' && (
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Select Stream
              </label>
              <StreamDropdown selectedStream={streamNode} onSelect={setStreamNode} />
            </div>
          )}

            {viewMode === 'PATH' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Target Career
                </label>
                <CustomDropdown
                  options={targetOptions}
                  value={targetNode?._id || ''}
                  onChange={handleTargetChange}
                  placeholder="Select Dream career..."
                  showSearch={true}
                />
              </div>
            )}
          </div>
        </div>

        {/* Alternative Paths Selection */}
        {viewMode === 'PATH' && pathways.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Discovered Pathways ({pathways.length})
            </h3>
            <div className="space-y-2">
              {pathways.map((path, idx) => {
                const isSelected = selectedPathIndex === idx;
                const pathLength = path.steps.length;
                
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedPathIndex(idx);
                      setSelectedNode(null);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-brandIndigo/10 border-cyan-600 dark:border-brandCyan text-cyan-700 dark:text-brandCyan shadow-glow'
                        : 'bg-slate-100/65 dark:bg-[#0E1524]/60 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 hover:dark:bg-[#121B2F]'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Pathway #{idx + 1}</span>
                      <span className="text-[10px] bg-slate-200 dark:bg-white/5 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">
                        {pathLength} steps
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {path.steps.map((s) => s.node.name).join(' → ')}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Explorer Actions */}
        {viewMode === 'EXPLORER' && startNode && (
          <div className="space-y-3 border-t border-slate-200 dark:border-white/5 pt-4">
            <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Explorer Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={handleExpandAll}
                disabled={loading}
                className="w-full text-center bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-brandCyan text-xs font-bold py-2.5 rounded-xl border border-cyan-500/20 dark:border-brandCyan/20 transition-all disabled:opacity-50"
              >
                Expand All Branches
              </button>
              <button
                onClick={() => {
                  resetExplorer(startNode);
                  setSelectedNode(null);
                }}
                disabled={loading}
                className="w-full text-center bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold py-2.5 rounded-xl border border-slate-200 dark:border-white/10 transition-all disabled:opacity-50"
              >
                Collapse All / Reset root
              </button>
            </div>
            
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed italic bg-slate-100 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5">
              Tip: Click '+ Expand' on any milestone inside the canvas to dynamically load and connect academic paths, tests, and colleges.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500 dark:text-slate-400 space-y-2">
            <Activity className="w-6 h-6 animate-pulse text-cyan-600 dark:text-brandCyan" />
            <span className="text-xs font-medium">
              {viewMode === 'EXPLORER' ? 'Expanding pathways...' : 'Calculating pathways...'}
            </span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-xs text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {viewMode === 'PATH' && (!startNode || !targetNode) && (
          <div className="p-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl text-center">
            <HelpCircle className="w-6 h-6 mx-auto mb-2 text-slate-400 dark:text-slate-500" />
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Select both a starting qualification and target career to visualize the pathway map.
            </p>
          </div>
        )}

        {viewMode === 'EXPLORER' && !startNode && (
          <div className="p-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl text-center">
            <HelpCircle className="w-6 h-6 mx-auto mb-2 text-slate-400 dark:text-slate-500" />
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Select a starting qualification in the sidebar to begin building your interactive tree.
            </p>
          </div>
        )}
      </div>

      {/* Main Map View Area */}
      <div className="flex-1 relative flex flex-col h-full bg-slate-50 dark:bg-[#080C14] transition-colors duration-300">
        {user ? (
          ((viewMode === 'EXPLORER' && startNode && explorerNodes.length > 0) || 
           (viewMode === 'PATH' && startNode && targetNode && pathways.length > 0)) ? (
            <div className="w-full h-full relative">
              <PathwayMap
                nodes={viewMode === 'EXPLORER' ? explorerNodes : allNodes}
                relationships={viewMode === 'EXPLORER' ? explorerRelationships : allRelationships}
                highlightedPathNodeIds={viewMode === 'EXPLORER' ? [] : activePathNodeIds}
                onNodeSelect={(node) => setSelectedNode(node)}
                viewMode={viewMode}
                expandedNodeIds={expandedNodeIds}
                onExpandToggle={(nodeId, expanded) => {
                  if (expanded) {
                    expandNode(nodeId);
                  } else {
                    collapseNode(nodeId);
                  }
                }}
                startNodeId={startNode?._id}
              />

              {/* Quick Tutorial Overlay banner */}
              <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-[#0E1524]/90 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-lg text-xs text-slate-700 dark:text-slate-300 flex items-center space-x-2 pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-cyan-600 dark:bg-brandCyan animate-ping" />
                <span>
                  {viewMode === 'EXPLORER'
                    ? 'Explorer mode: expand or collapse milestones on demand'
                    : `Blue path represents alternative #${selectedPathIndex + 1}`}
                </span>
              </div>
            </div>
          ) : (loading && (
            (viewMode === 'EXPLORER' && explorerNodes.length === 0) ||
            (viewMode === 'PATH' && pathways.length === 0)
          )) ? (
            <PathwayLoader />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-slate-50 dark:bg-[#080C14]">
              <Map className="w-16 h-16 text-slate-300 dark:text-slate-700 animate-pulse" />
              <div className="max-w-md">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {viewMode === 'EXPLORER' ? 'Select Start Point' : 'No Roadmap Loaded'}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  {viewMode === 'EXPLORER'
                    ? 'Choose a starting milestone in the sidebar to build your infinite career roadmap.'
                    : 'Choose parameters in the sidebar to draw dynamic visual structures, analyze connection constraints, and inspect educational pathways.'}
                </p>
              </div>
            </div>
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-6 bg-slate-100/30 dark:bg-[#080C14]/30 backdrop-blur-md z-30">
            {/* Grid pattern background */}
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="max-w-md w-full glass p-8 rounded-3xl border border-slate-200 dark:border-white/10 text-center shadow-2xl bg-white/80 dark:bg-slate-900/80 relative overflow-hidden"
            >
              {/* Glow design elements */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-brandCyan/20 rounded-full filter blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-brandIndigo/20 rounded-full filter blur-2xl pointer-events-none" />

              <div className="w-14 h-14 rounded-2xl bg-brandCyan/10 text-brandCyan flex items-center justify-center mx-auto mb-6 border border-brandCyan/30">
                <Lock className="w-6 h-6 animate-pulse" />
              </div>

              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Roadmap Designer Locked
              </h3>
              
              <p className="text-slate-600 dark:text-slate-400 mt-3 text-sm leading-relaxed max-w-sm mx-auto">
                Sign in with Google to unlock complete interactive roadmaps, custom search navigators, academic requirements, and offering colleges.
              </p>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setAuthModalOpen(true)}
                className="mt-8 w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-brandCyan via-brandIndigo to-purple-500 text-white font-bold text-sm shadow-lg shadow-brandIndigo/20 hover:brightness-105 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Unlock with Google Sign-In</span>
              </motion.button>
            </motion.div>
          </div>
        )}
      </div>

      {/* Slide-out Node Inspector Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full lg:w-96 border-l border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A0F1D] p-6 flex flex-col h-full shadow-2xl relative overflow-y-auto shrink-0 z-20"
          >
            {/* Header Close */}
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-4 mb-4">
              <span className="text-[10px] font-bold tracking-wider text-cyan-700 dark:text-brandCyan uppercase bg-cyan-100 dark:bg-brandCyan/10 border border-cyan-200 dark:border-brandCyan/20 px-2.5 py-1 rounded-md">
                {(() => {
                  switch (selectedNode.type) {
                    case 'QUALIFICATION': return 'Education Level';
                    case 'BOARD': return 'Education Board';
                    case 'STREAM': return 'Academic Stream';
                    case 'SUBJECT_COMBINATION': return 'Required Subjects';
                    case 'EXAM': return 'Entrance Exam';
                    case 'DEGREE': return 'Degree Course';
                    case 'OCCUPATION': return 'Target Career';
                    case 'SKILL': return 'Skill Tree';
                    case 'INSTITUTE': return 'College / University';
                    default: return selectedNode.type;
                  }
                })()}
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{selectedNode.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{selectedNode.description}</p>
              </div>

              {/* Dynamic properties inspector */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/5">
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Details & Requirements
                </h4>

                {selectedNode.type === 'OCCUPATION' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-100 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
                        <span>Average Salary</span>
                      </div>
                      <span className="text-sm font-bold text-slate-800 dark:text-white">
                        {formatCurrency(selectedNode.averageSalaryRange?.min)} - {formatCurrency(selectedNode.averageSalaryRange?.max)}
                      </span>
                    </div>

                    <div className="bg-slate-100 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-cyan-600 dark:text-brandCyan" />
                        <span>Growth Index</span>
                      </div>
                      <span className="text-sm font-bold text-slate-800 dark:text-white">{selectedNode.growthRate || 'HIGH'}</span>
                    </div>

                    <div className="col-span-2 bg-slate-100 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Industry Sector</span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-white">{selectedNode.sector}</span>
                    </div>
                  </div>
                )}

                {selectedNode.type === 'DEGREE' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-100 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                        <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                          <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />
                          <span>Duration</span>
                        </div>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{selectedNode.durationYears} Years</span>
                      </div>

                      <div className="bg-slate-100 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                        <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                          <Award className="w-3.5 h-3.5 text-pink-600 dark:text-pink-500" />
                          <span>Level</span>
                        </div>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{selectedNode.level}</span>
                      </div>
                    </div>

                    {/* Offering Colleges list */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <Landmark className="w-4 h-4 text-cyan-600 dark:text-brandCyan" />
                        <span>Top Colleges & Institutes ({offeringColleges.length})</span>
                      </h4>

                      {collegesLoading ? (
                        <div className="text-xs text-slate-500 dark:text-slate-400 animate-pulse py-2">
                          Retrieving college profiles...
                        </div>
                      ) : offeringColleges.length === 0 ? (
                        <div className="text-xs text-slate-500 dark:text-slate-400 italic py-2">
                          No colleges registered for this degree course.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {offeringColleges.map((mapping) => (
                            <div 
                              key={mapping._id}
                              className="bg-slate-100 hover:bg-slate-200 dark:bg-[#0E1524]/60 dark:hover:bg-[#121B2F] border border-slate-200 dark:border-white/5 p-3 rounded-xl transition-all space-y-1.5 group relative"
                            >
                              <div className="flex justify-between items-start">
                                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-brandCyan transition-colors">
                                  {mapping.institute?.name}
                                </span>
                                {mapping.institute?.nirfRanking && (
                                  <span className="text-[9px] bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-1.5 py-0.5 rounded font-mono shrink-0 ml-1">
                                    NIRF #{mapping.institute.nirfRanking}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-600 dark:text-slate-400 flex items-center space-x-1">
                                <MapPin className="w-3 h-3 text-cyan-600 dark:text-cyan-500" />
                                <span>{mapping.institute?.location?.city}, {mapping.institute?.location?.state}</span>
                              </div>
                              <div className="pt-1 border-t border-slate-200 dark:border-white/5 flex justify-between text-[9px] text-slate-500">
                                <span>Spec: <strong className="text-teal-700 dark:text-teal-400">{mapping.specialization}</strong></span>
                                <span>Exam: <strong className="text-blue-700 dark:text-blue-400">{mapping.entranceExam?.name || 'Direct'}</strong></span>
                              </div>
                              <div className="flex justify-between text-[9px] text-slate-500">
                                <span>Fees: <strong className="text-slate-800 dark:text-slate-300">{mapping.fees ? `₹${(mapping.fees / 100000).toFixed(2)}L` : 'N/A'}</strong></span>
                                <span>Seats: <strong className="text-slate-800 dark:text-slate-300">{mapping.seats || 'N/A'}</strong></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedNode.type === 'EXAM' && (
                  <div className="space-y-3">
                    <div className="bg-slate-100 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Conducting Authority</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{selectedNode.conductingBody}</span>
                    </div>

                    {selectedNode.frequency && (
                      <div className="bg-slate-100 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Frequency</span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{selectedNode.frequency}</span>
                      </div>
                    )}

                    {selectedNode.eligibilityDescription && (
                      <div className="bg-slate-100 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Eligibility Criteria</span>
                        <span className="text-xs text-slate-850 dark:text-slate-200 leading-relaxed block italic">{selectedNode.eligibilityDescription}</span>
                      </div>
                    )}

                    {selectedNode.streamRequirements && selectedNode.streamRequirements.length > 0 && (
                      <div className="bg-slate-100 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Stream Requirements</span>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">{selectedNode.streamRequirements.join(', ')}</span>
                      </div>
                    )}

                    {selectedNode.subjectRequirements && selectedNode.subjectRequirements.length > 0 && (
                      <div className="bg-slate-100 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Mandatory Subjects</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {selectedNode.subjectRequirements.map((sub, i) => (
                            <span key={i} className="text-[10px] bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/20 px-2 py-0.5 rounded-md">
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {(selectedNode.ageMin || selectedNode.ageMax) && (selectedNode.ageMax && selectedNode.ageMax < 90) && (
                      <div className="bg-slate-100 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Age Limits</span>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          {selectedNode.ageMin || 17} to {selectedNode.ageMax} Years
                        </span>
                      </div>
                    )}

                    {selectedNode.maxAttempts && selectedNode.maxAttempts < 10 && (
                      <div className="bg-slate-100 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Max Attempt Limit</span>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">{selectedNode.maxAttempts} Attempts</span>
                      </div>
                    )}

                    {selectedNode.website && (
                      <a
                        href={selectedNode.website.startsWith('http') ? selectedNode.website : `https://${selectedNode.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between bg-slate-100 hover:bg-slate-200 dark:bg-[#0E1524] dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-cyan-500/35 dark:hover:border-brandCyan/35 px-3 py-2.5 rounded-xl text-xs text-cyan-600 dark:text-brandCyan transition-all mt-4 font-bold"
                      >
                        <span>Official Exam Portal</span>
                        <ExternalLink className="w-3.5 h-3.5 text-cyan-600 dark:text-brandCyan" />
                      </a>
                    )}
                  </div>
                )}

                {selectedNode.type === 'INSTITUTE' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-100 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">NIRF Rank</span>
                        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">#{selectedNode.nirfRanking || 'N/A'}</span>
                      </div>
                      <div className="bg-slate-100 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Ownership</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedNode.ownership}</span>
                      </div>
                    </div>

                    <div className="bg-slate-100 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5 flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Location</span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {selectedNode.location?.city}, {selectedNode.location?.state}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedNode.type === 'SUBJECT_COMBINATION' && selectedNode.subjects && (
                  <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/5 space-y-2">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Core Subjects</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedNode.subjects.map((sub, i) => (
                        <span
                          key={i}
                          className="text-xs bg-teal-100 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/20 px-2 py-0.5 rounded-md"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Info / Description length check */}
                <div className="text-[11px] text-slate-500 italic mt-6">
                  Created at: {new Date(selectedNode.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal Trigger for lock overlay */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
};

export default RoadmapPage;
