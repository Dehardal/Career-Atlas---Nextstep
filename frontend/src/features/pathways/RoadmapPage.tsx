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
  LogIn,
  Star,
  Save,
  ChevronRight,
  RotateCcw,
  Download,
  CheckCircle2,
  PlusCircle
} from 'lucide-react';
import { useRoadmapStore } from '../../store/useRoadmapStore';
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
    setExplorerState,
    user,
    bookmarks,
    saveRoadmap,
    addBookmark,
    deleteBookmark
  } = useRoadmapStore();

  const [qualifications, setQualifications] = useState<ApiNode[]>([]);
  const [careers, setCareers] = useState<ApiNode[]>([]);
  const [streams, setStreams] = useState<ApiNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<ApiNode | null>(null);

  // Eligibility Rules state for warnings
  const [eligibilityRules, setEligibilityRules] = useState<any[]>([]);

  // Drawer & Comparison states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedOwnership, setSelectedOwnership] = useState('ALL');
  const [maxFees, setMaxFees] = useState(2000000);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);

  // Save Pathway states
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveDescription, setSaveDescription] = useState('');

  // Custom Selected Path state
  const [customSelectedNodeIds, setCustomSelectedNodeIds] = useState<string[]>([]);
  const [saveCustomModalOpen, setSaveCustomModalOpen] = useState(false);
  const [saveCustomTitle, setSaveCustomTitle] = useState('');
  const [saveCustomDescription, setSaveCustomDescription] = useState('');
  const [customSaveLoading, setCustomSaveLoading] = useState(false);

  const handleToggleCustomPath = () => {
    if (!selectedNode) return;
    if (customSelectedNodeIds.includes(selectedNode._id)) {
      setCustomSelectedNodeIds(customSelectedNodeIds.filter((id) => id !== selectedNode._id));
    } else {
      setCustomSelectedNodeIds([...customSelectedNodeIds, selectedNode._id]);
    }
  };

  const handleSaveCustomPath = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || customSelectedNodeIds.length === 0) return;

    // Build relationship sequence based on adjacent selected nodes
    const relationshipSequence: string[] = [];
    for (let i = 0; i < customSelectedNodeIds.length - 1; i++) {
      const fromId = customSelectedNodeIds[i];
      const toId = customSelectedNodeIds[i + 1];
      const rel = explorerRelationships.find((r) => {
        const rFrom = typeof r.fromNode === 'string' ? r.fromNode : r.fromNode._id;
        const rTo = typeof r.toNode === 'string' ? r.toNode : r.toNode._id;
        return rFrom === fromId && rTo === toId;
      });
      if (rel) {
        relationshipSequence.push(rel._id);
      }
    }

    setCustomSaveLoading(true);
    try {
      await api.saveRoadmap({
        email: user.email,
        title: saveCustomTitle,
        description: saveCustomDescription,
        nodeSequence: customSelectedNodeIds,
        relationshipSequence,
      });
      // Fetch updated dashboard
      const [roadmaps, bkmarks] = await Promise.all([
        api.getSavedRoadmaps(user.email),
        api.getBookmarks(user.email)
      ]);
      useRoadmapStore.setState({ savedRoadmaps: roadmaps, bookmarks: bkmarks });
      
      setSaveCustomTitle('');
      setSaveCustomDescription('');
      setCustomSelectedNodeIds([]);
      setSaveCustomModalOpen(false);
      alert('Custom path saved successfully!');
    } catch (err: any) {
      console.error('Failed to save custom path', err);
      alert(err.response?.data?.error || 'Failed to save custom path');
    } finally {
      setCustomSaveLoading(false);
    }
  };

  const handleDownloadCustomPath = () => {
    const textLines = [
      `==================================================`,
      `          CAREER ATLAS - MY CUSTOM ROADMAP        `,
      `==================================================`,
      `Generated on: ${new Date().toLocaleDateString()}`,
      `Total Steps: ${customSelectedNodeIds.length}`,
      ``,
      `PATHWAY STEPS:`,
    ];

    customSelectedNodeIds.forEach((id, index) => {
      const nodeObj = explorerNodes.find((n) => n._id === id);
      if (!nodeObj) return;

      const typeLabel = (() => {
        switch (nodeObj.type) {
          case 'QUALIFICATION': return 'Education Level';
          case 'BOARD': return 'Education Board';
          case 'STREAM': return 'Academic Stream';
          case 'SUBJECT_COMBINATION': return 'Required Subjects';
          case 'EXAM': return 'Entrance Exam';
          case 'DEGREE': return 'Degree Course';
          case 'OCCUPATION': return 'Target Career';
          case 'SKILL': return 'Skill Tree';
          case 'INSTITUTE': return 'College / University';
          default: return nodeObj.type;
        }
      })();

      textLines.push(`[Step ${index + 1}] ${nodeObj.name} (${typeLabel})`);
      if (nodeObj.description) {
        textLines.push(`   Description: ${nodeObj.description}`);
      }

      if (nodeObj.type === 'OCCUPATION' && nodeObj.averageSalaryRange) {
        textLines.push(`   Average Salary: INR ${nodeObj.averageSalaryRange.min.toLocaleString()} - INR ${nodeObj.averageSalaryRange.max.toLocaleString()}`);
      }

      textLines.push(``);
    });

    textLines.push(`==================================================`);
    textLines.push(`Thank you for using Career Atlas to plan your career pathway!`);

    const textContent = textLines.join('\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `career-atlas-custom-roadmap.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


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

  // Load dropdown options for inline selection and rules
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const qualsRes = await api.getNodes({ type: 'QUALIFICATION', limit: 100 });
        const careersRes = await api.getNodes({ type: 'OCCUPATION', limit: 100 });
        const streamsRes = await api.getNodes({ type: 'STREAM', limit: 100 });
        const rulesRes = await api.getEligibilityRules();
        setQualifications(qualsRes.nodes);
        setCareers(careersRes.nodes);
        setStreams(streamsRes.nodes);
        setEligibilityRules(rulesRes);
      } catch (err) {
        console.error('Failed to load dropdown options or rules', err);
      }
    };
    loadDropdowns();
  }, []);

  // Fetch pathways when start/target nodes change
  useEffect(() => {
    if (startNode && targetNode) {
      fetchPathways();
    }
  }, [startNode, targetNode, fetchPathways]);

  // Explorer history state to support Undo (Previous), Redo (Next), and Reset
  interface ExplorerHistoryEntry {
    nodes: ApiNode[];
    relationships: Relationship[];
    expandedNodeIds: string[];
  }

  const [explorerHistory, setExplorerHistory] = useState<ExplorerHistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isNavigatingHistory, setIsNavigatingHistory] = useState(false);

  // Explorer history synchronizer
  useEffect(() => {
    if (viewMode !== 'EXPLORER' || !startNode) {
      setExplorerHistory([]);
      setHistoryIndex(-1);
      return;
    }

    if (isNavigatingHistory) {
      setIsNavigatingHistory(false);
      return;
    }

    if (explorerNodes.length === 0) return;

    const currentEntry = explorerHistory[historyIndex];
    const isDifferent =
      !currentEntry ||
      explorerNodes.length !== currentEntry.nodes.length ||
      explorerRelationships.length !== currentEntry.relationships.length ||
      expandedNodeIds.length !== currentEntry.expandedNodeIds.length ||
      !expandedNodeIds.every((id) => currentEntry.expandedNodeIds.includes(id));

    if (isDifferent) {
      const updatedHistory = explorerHistory.slice(0, historyIndex + 1);
      updatedHistory.push({
        nodes: [...explorerNodes],
        relationships: [...explorerRelationships],
        expandedNodeIds: [...expandedNodeIds],
      });
      setExplorerHistory(updatedHistory);
      setHistoryIndex(updatedHistory.length - 1);
    }
  }, [explorerNodes, explorerRelationships, expandedNodeIds, viewMode, startNode]);

  const handlePrevious = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevEntry = explorerHistory[prevIndex];
      setIsNavigatingHistory(true);
      setHistoryIndex(prevIndex);
      setExplorerState(prevEntry.nodes, prevEntry.relationships, prevEntry.expandedNodeIds);
      setSelectedNode(null);
    }
  };

  const handleNext = () => {
    if (historyIndex < explorerHistory.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextEntry = explorerHistory[nextIndex];
      setIsNavigatingHistory(true);
      setHistoryIndex(nextIndex);
      setExplorerState(nextEntry.nodes, nextEntry.relationships, nextEntry.expandedNodeIds);
      setSelectedNode(null);
    }
  };

  const handleResetExplorer = () => {
    if (startNode) {
      resetExplorer(startNode);
      setSelectedNode(null);
    }
  };

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
    const nodeObj = 
      qualifications.find((q) => q._id === id) || 
      streams.find((s) => s._id === id) || 
      null;
    setStartNode(nodeObj);
    setSelectedNode(null);
  };

  const handleTargetChange = (id: string) => {
    const nodeObj = careers.find((c) => c._id === id) || null;
    setTargetNode(nodeObj);
    setSelectedNode(null);
  };

  const handleBookmarkToggle = () => {
    if (!selectedNode) return;
    const isBookmarked = bookmarks.some(
      (b) => b.nodeId?._id === selectedNode._id || (typeof b.nodeId === 'string' && b.nodeId === selectedNode._id)
    );
    if (isBookmarked) {
      const b = bookmarks.find(
        (b) => b.nodeId?._id === selectedNode._id || (typeof b.nodeId === 'string' && b.nodeId === selectedNode._id)
      );
      if (b) deleteBookmark(b._id);
    } else {
      addBookmark(selectedNode._id);
    }
  };

  const handleToggleCompare = (id: string) => {
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter((cid) => cid !== id));
    } else {
      if (compareIds.length >= 3) {
        alert('You can compare up to 3 colleges at once.');
        return;
      }
      setCompareIds([...compareIds, id]);
    }
  };

  const handleSaveRoadmap = async () => {
    if (!saveTitle.trim()) return;
    try {
      await saveRoadmap(saveTitle, saveDescription);
      setSaveModalOpen(false);
      setSaveTitle('');
      setSaveDescription('');
    } catch (err) {
      console.error('Failed to save roadmap', err);
    }
  };

  // Reset comparison when selecting a new node
  useEffect(() => {
    setCompareIds([]);
    setDrawerOpen(false);
  }, [selectedNode]);

  // Derived filtered colleges list
  const filteredColleges = offeringColleges.filter((col) => {
    const matchesState = selectedState === 'ALL' || col.institute?.location?.state === selectedState;
    const matchesOwnership =
      selectedOwnership === 'ALL' ||
      col.institute?.ownership?.toUpperCase() === selectedOwnership.toUpperCase();
    const matchesFees = !col.fees || col.fees <= maxFees;
    return matchesState && matchesOwnership && matchesFees;
  });

  const comparedColleges = offeringColleges.filter((col) => compareIds.includes(col._id));

  const startOptions = [
    ...qualifications.filter((q) => q.name !== 'Class 12').map((q) => ({
      value: q._id,
      label: q.name,
      icon: Search
    })),
    ...streams.map((s) => ({
      value: s._id,
      label: `Class 12 - ${s.name}`,
      icon: Search
    }))
  ];

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

        {/* Save Roadmap Pathway button */}
        {viewMode === 'PATH' && pathways.length > 0 && user && (
          <div className="pt-2">
            <button
              onClick={() => setSaveModalOpen(true)}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border border-brandCyan/30 hover:border-brandCyan/60 hover:bg-brandCyan/5 text-brandCyan text-xs font-bold transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Active Pathway</span>
            </button>
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
                onClick={handleResetExplorer}
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
                highlightedPathNodeIds={viewMode === 'EXPLORER' ? customSelectedNodeIds : activePathNodeIds}
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
                rules={eligibilityRules}
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

              {/* Custom Path Builder Floating Card */}
              {viewMode === 'EXPLORER' && customSelectedNodeIds.length > 0 && (
                <div className="absolute top-16 left-4 z-10 bg-white/95 dark:bg-[#0E1524]/95 backdrop-blur border border-slate-200 dark:border-white/10 p-4 rounded-2xl shadow-xl w-64 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-white flex items-center space-x-1.5">
                      <Map className="w-3.5 h-3.5 text-teal-500" />
                      <span>My Custom Path</span>
                    </span>
                    <span className="text-[10px] bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded-full font-mono font-bold">
                      {customSelectedNodeIds.length} Nodes
                    </span>
                  </div>

                  {/* Mini list of selected nodes */}
                  <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                    {customSelectedNodeIds.map((id, index) => {
                      const nodeObj = explorerNodes.find(n => n._id === id);
                      if (!nodeObj) return null;
                      return (
                        <div key={id} className="flex items-center space-x-2 text-[10px] text-slate-600 dark:text-slate-400">
                          <span className="w-4 h-4 rounded-full bg-teal-500/15 border border-teal-500/30 flex items-center justify-center font-mono font-bold text-[8px] text-teal-600 dark:text-teal-400 shrink-0">
                            {index + 1}
                          </span>
                          <span className="truncate flex-1 font-medium">{nodeObj.name}</span>
                          <button
                            onClick={() => setCustomSelectedNodeIds(customSelectedNodeIds.filter(cid => cid !== id))}
                            className="p-0.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded transition-colors shrink-0"
                            title="Remove"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                    <button
                      onClick={() => setSaveCustomModalOpen(true)}
                      className="flex items-center justify-center space-x-1 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold shadow-md transition-all"
                      title="Save to dashboard"
                    >
                      <Save className="w-3 h-3" />
                      <span>Save Path</span>
                    </button>
                    <button
                      onClick={handleDownloadCustomPath}
                      className="flex items-center justify-center space-x-1 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 text-[10px] font-bold transition-all"
                      title="Download Path"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => setCustomSelectedNodeIds([])}
                      className="col-span-2 text-center py-1 text-[9px] text-slate-400 hover:text-red-500 dark:hover:text-red-400 font-semibold transition-colors"
                    >
                      Clear Path
                    </button>
                  </div>
                </div>
              )}

              {/* Explorer History Controls Bar */}
              {viewMode === 'EXPLORER' && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center space-x-2 bg-white/95 dark:bg-[#0E1524]/95 backdrop-blur border border-slate-200 dark:border-white/10 px-3.5 py-2 rounded-2xl shadow-xl">
                  <button
                    onClick={handlePrevious}
                    disabled={historyIndex <= 0}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 hover:dark:bg-white/5 disabled:opacity-40 transition-all focus:outline-none"
                    title="Go to previous step"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>
                  
                  <div className="w-px h-4 bg-slate-250 dark:bg-white/10" />

                  <button
                    onClick={handleResetExplorer}
                    disabled={explorerNodes.length <= 1 && expandedNodeIds.length === 0}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition-all focus:outline-none"
                    title="Reset explorer map"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>

                  <div className="w-px h-4 bg-slate-250 dark:bg-white/10" />

                  <button
                    onClick={handleNext}
                    disabled={historyIndex >= explorerHistory.length - 1}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 hover:dark:bg-white/5 disabled:opacity-40 transition-all focus:outline-none"
                    title="Go to next step"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
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
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight flex-1 mr-2">
                    {selectedNode.name}
                  </h3>
                  {user && (
                    <button
                      onClick={handleBookmarkToggle}
                      className={`p-1.5 rounded-lg border transition-all shrink-0 ${
                        bookmarks.some((b) => b.nodeId?._id === selectedNode._id || (typeof b.nodeId === 'string' && b.nodeId === selectedNode._id))
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20'
                          : 'border-slate-200 dark:border-white/10 text-slate-400 hover:text-amber-500 hover:bg-slate-100 hover:dark:bg-white/5'
                      }`}
                      title="Bookmark Item"
                    >
                      <Star className={`w-4 h-4 ${bookmarks.some((b) => b.nodeId?._id === selectedNode._id || (typeof b.nodeId === 'string' && b.nodeId === selectedNode._id)) ? 'fill-amber-500' : ''}`} />
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{selectedNode.description}</p>

                {/* Custom Path Selection Toggle Button */}
                {viewMode === 'EXPLORER' && (
                  <div className="mt-4">
                    {customSelectedNodeIds.includes(selectedNode._id) ? (
                      <button
                        onClick={handleToggleCustomPath}
                        className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md focus:outline-none"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>Remove from Custom Path</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleToggleCustomPath}
                        className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border border-teal-500/30 hover:border-teal-500/60 hover:bg-teal-500/5 text-teal-600 dark:text-teal-400 text-xs font-bold transition-all focus:outline-none"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Add to Custom Path</span>
                      </button>
                    )}
                  </div>
                )}
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
                    {/* Offering Colleges Drawer Launcher */}
                    <div className="pt-4 border-t border-slate-200 dark:border-white/5 space-y-3">
                      <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <Landmark className="w-4.5 h-4.5 text-cyan-600 dark:text-brandCyan" />
                        <span>Colleges & Admissions</span>
                      </h4>
                      <button
                        onClick={() => {
                          setSelectedState('ALL');
                          setSelectedOwnership('ALL');
                          setMaxFees(2000000);
                          setCompareIds([]);
                          setDrawerOpen(true);
                        }}
                        className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md"
                      >
                        <Search className="w-4 h-4" />
                        <span>Compare & Match Colleges ({offeringColleges.length})</span>
                      </button>
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

      {/* College Matcher Side Drawer */}
      <AnimatePresence>
        {drawerOpen && selectedNode && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-[#090D16] border-l border-white/10 shadow-2xl h-full flex flex-col z-10"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2.5">
                  <Landmark className="w-5 h-5 text-cyan-455 text-cyan-400" />
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">
                      Explore Offering Colleges
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      For <span className="text-cyan-400 font-semibold">{selectedNode.name}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filters */}
              <div className="p-4 bg-[#0E1524]/60 border-b border-white/5 space-y-3 shrink-0">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Filters & Matcher Settings
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {/* State Select */}
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">State</label>
                    <select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      className="w-full bg-[#0E1524] border border-white/10 text-xs text-white rounded-lg p-2 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="ALL">All States</option>
                      {Array.from(new Set(offeringColleges.map((c) => c.institute?.location?.state).filter(Boolean))).map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  {/* Ownership Select */}
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Ownership</label>
                    <select
                      value={selectedOwnership}
                      onChange={(e) => setSelectedOwnership(e.target.value)}
                      className="w-full bg-[#0E1524] border border-white/10 text-xs text-white rounded-lg p-2 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="ALL">All Categories</option>
                      <option value="GOVERNMENT">Government</option>
                      <option value="PRIVATE">Private</option>
                    </select>
                  </div>

                  {/* Max Fees slider */}
                  <div className="col-span-2 space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Max Fees (Annual)</span>
                      <span className="font-semibold text-cyan-450 text-cyan-400">
                        {maxFees === 2000000 ? 'Any Budget' : `₹${(maxFees / 100000).toFixed(1)}L`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="50000"
                      max="2000000"
                      step="50000"
                      value={maxFees}
                      onChange={(e) => setMaxFees(Number(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Colleges List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {collegesLoading ? (
                  <div className="text-center py-16 text-slate-500 text-xs animate-pulse">
                    Retrieving college profiles...
                  </div>
                ) : filteredColleges.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 text-xs italic">
                    No colleges match your filter criteria.
                  </div>
                ) : (
                  filteredColleges.map((mapping) => {
                    const isComparing = compareIds.includes(mapping._id);
                    return (
                      <div
                        key={mapping._id}
                        className={`bg-[#0E1524]/60 border p-4 rounded-2xl transition-all duration-200 ${
                          isComparing
                            ? 'border-cyan-500/50 bg-[#121b2f]/30'
                            : 'border-white/5 hover:border-white/15'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5 flex-wrap">
                              <h4 className="text-xs font-bold text-white leading-tight truncate max-w-[200px]">
                                {mapping.institute?.name}
                              </h4>
                              {mapping.institute?.nirfRanking && (
                                <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-0.5 rounded font-mono shrink-0">
                                  NIRF #{mapping.institute.nirfRanking}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-cyan-400" />
                              <span className="truncate">{mapping.institute?.location?.city}, {mapping.institute?.location?.state}</span>
                            </p>
                          </div>

                          {/* Compare Checkbox */}
                          <label className="flex items-center space-x-1.5 cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={isComparing}
                              onChange={() => handleToggleCompare(mapping._id)}
                              className="w-4 h-4 accent-cyan-500 border-white/20 rounded focus:ring-0 cursor-pointer bg-slate-900"
                            />
                            <span className="text-[9px] font-bold text-slate-400 select-none">Compare</span>
                          </label>
                        </div>

                        {/* Specs */}
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/5 text-[10px] text-slate-400">
                          <div>
                            <span className="text-[8px] block text-slate-500 uppercase font-mono">Specialization</span>
                            <span className="font-semibold text-slate-200 truncate block">{mapping.specialization}</span>
                          </div>
                          <div>
                            <span className="text-[8px] block text-slate-500 uppercase font-mono">Entrance Exam</span>
                            <span className="font-semibold text-blue-400 truncate block">{mapping.entranceExam?.name || 'Direct'}</span>
                          </div>
                          <div>
                            <span className="text-[8px] block text-slate-500 uppercase font-mono">Estimated Fees</span>
                            <span className="font-semibold text-emerald-450 text-emerald-400">
                              {mapping.fees ? `₹${(mapping.fees / 100000).toFixed(2)}L/yr` : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[8px] block text-slate-500 uppercase font-mono">Seats</span>
                            <span className="font-semibold text-slate-200">{mapping.seats || 'N/A'}</span>
                          </div>
                        </div>

                        {/* Placement stats */}
                        {mapping.placementStats && (
                          <div className="mt-2.5 pt-2 border-t border-dashed border-white/5 flex justify-between text-[9px] text-slate-500">
                            <span>Placements: <strong className="text-teal-400">{mapping.placementStats.placementRate || 80}%</strong></span>
                            <span>Avg Package: <strong className="text-slate-300">{mapping.placementStats.averageSalary ? `₹${(mapping.placementStats.averageSalary / 100000).toFixed(1)}L` : 'N/A'}</strong></span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Comparison Footer Bar */}
              {compareIds.length > 0 && (
                <div className="p-4 border-t border-white/5 bg-[#090D16]/90 flex items-center justify-between shrink-0">
                  <div className="text-xs text-slate-350 text-slate-300">
                    <span className="font-semibold text-cyan-400">{compareIds.length}</span> / 3 selected for comparison
                  </div>
                  <button
                    onClick={() => setComparisonOpen(true)}
                    className="flex items-center space-x-1.5 py-2 px-4.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md"
                  >
                    <span>Compare Matrix</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* College Comparison Matrix Modal */}
      <AnimatePresence>
        {comparisonOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setComparisonOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl bg-[#090D16] border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden z-10 flex flex-col"
              style={{ maxHeight: '80vh' }}
            >
              <div className="flex justify-between items-center pb-4 border-b border-white/5 shrink-0">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Landmark className="w-5 h-5 text-cyan-400" />
                  <span>College Comparison Matrix</span>
                </h3>
                <button
                  onClick={() => setComparisonOpen(false)}
                  className="p-1 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Matrix Table */}
              <div className="flex-1 overflow-auto mt-4 pr-1">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4 min-w-[120px]">Parameter</th>
                      {comparedColleges.map((col) => (
                        <th key={col._id} className="py-3 px-4 min-w-[180px] text-cyan-400 font-bold">
                          {col.institute?.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4 text-slate-400 font-semibold">NIRF Rank</td>
                      {comparedColleges.map((col) => (
                        <td key={col._id} className="py-3 px-4 font-bold text-amber-400">
                          {col.institute?.nirfRanking ? `#${col.institute.nirfRanking}` : 'N/A'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4 text-slate-400 font-semibold">Location</td>
                      {comparedColleges.map((col) => (
                        <td key={col._id} className="py-3 px-4 text-slate-200">
                          {col.institute?.location?.city}, {col.institute?.location?.state}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4 text-slate-400 font-semibold">Ownership</td>
                      {comparedColleges.map((col) => (
                        <td key={col._id} className="py-3 px-4 text-slate-200 uppercase text-[10px]">
                          {col.institute?.ownership || 'N/A'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4 text-slate-400 font-semibold">Annual Fees</td>
                      {comparedColleges.map((col) => (
                        <td key={col._id} className="py-3 px-4 font-bold text-emerald-400">
                          {col.fees ? `₹${(col.fees / 100000).toFixed(2)}L` : 'N/A'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4 text-slate-400 font-semibold">Specialization</td>
                      {comparedColleges.map((col) => (
                        <td key={col._id} className="py-3 px-4 text-slate-200 font-semibold">
                          {col.specialization}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4 text-slate-400 font-semibold">Seats</td>
                      {comparedColleges.map((col) => (
                        <td key={col._id} className="py-3 px-4 text-slate-200">
                          {col.seats || 'N/A'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4 text-slate-400 font-semibold">Admission Gate</td>
                      {comparedColleges.map((col) => (
                        <td key={col._id} className="py-3 px-4 text-blue-400 font-semibold">
                          {col.entranceExam?.name || 'Direct'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4 text-slate-400 font-semibold">Placements</td>
                      {comparedColleges.map((col) => (
                        <td key={col._id} className="py-3 px-4 text-teal-400 font-bold">
                          {col.placementStats?.placementRate ? `${col.placementStats.placementRate}%` : 'N/A'}
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-white/5">
                      <td className="py-3 px-4 text-slate-400 font-semibold">Avg Salary</td>
                      {comparedColleges.map((col) => (
                        <td key={col._id} className="py-3 px-4 font-bold text-slate-200">
                          {col.placementStats?.averageSalary ? `₹${(col.placementStats.averageSalary / 100000).toFixed(1)}L` : 'N/A'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Save Pathway Modal */}
      <AnimatePresence>
        {saveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSaveModalOpen(false)}
              className="absolute inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-6 z-10 space-y-4 transition-colors duration-300"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <Save className="w-4 h-4 text-brandCyan" />
                  <span>Save Pathway Planner</span>
                </h3>
                <button
                  onClick={() => setSaveModalOpen(false)}
                  className="text-slate-400 hover:text-slate-800 hover:dark:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Roadmap Title</label>
                  <input
                    type="text"
                    placeholder="e.g. My AI Engineer Path"
                    value={saveTitle}
                    onChange={(e) => setSaveTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#080C14] border border-slate-200 dark:border-white/5 text-xs text-slate-800 dark:text-white rounded-lg p-2.5 focus:outline-none focus:border-brandCyan dark:focus:border-brandCyan focus:ring-0 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Notes / Description (Optional)</label>
                  <textarea
                    placeholder="Brief notes about your target timeline or classes..."
                    value={saveDescription}
                    onChange={(e) => setSaveDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-[#080C14] border border-slate-200 dark:border-white/5 text-xs text-slate-800 dark:text-white rounded-lg p-2.5 focus:outline-none focus:border-brandCyan dark:focus:border-brandCyan focus:ring-0 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={() => setSaveModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 hover:dark:text-white hover:bg-slate-50 hover:dark:bg-white/5 text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRoadmap}
                  disabled={!saveTitle.trim()}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    saveTitle.trim()
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg'
                      : 'bg-slate-200 dark:bg-slate-850 text-slate-400 dark:text-slate-650 cursor-not-allowed'
                  }`}
                >
                  Save Planner
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Save Custom Pathway Modal */}
      <AnimatePresence>
        {saveCustomModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSaveCustomModalOpen(false)}
              className="absolute inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-6 z-10 space-y-4 transition-colors duration-300"
            >
              <form onSubmit={handleSaveCustomPath} className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                    <Save className="w-4 h-4 text-teal-500" />
                    <span>Save Custom Pathway</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSaveCustomModalOpen(false)}
                    className="text-slate-400 hover:text-slate-800 hover:dark:text-white transition-colors focus:outline-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Roadmap Title</label>
                    <input
                      type="text"
                      placeholder="e.g. My Custom Architecture Path"
                      value={saveCustomTitle}
                      onChange={(e) => setSaveCustomTitle(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-[#080C14] border border-slate-200 dark:border-white/5 text-xs text-slate-800 dark:text-white rounded-lg p-2.5 focus:outline-none focus:border-teal-500 dark:focus:border-teal-500 focus:ring-0 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Notes / Description (Optional)</label>
                    <textarea
                      placeholder="Brief notes about your targeted timeline or milestones..."
                      value={saveCustomDescription}
                      onChange={(e) => setSaveCustomDescription(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 dark:bg-[#080C14] border border-slate-200 dark:border-white/5 text-xs text-slate-800 dark:text-white rounded-lg p-2.5 focus:outline-none focus:border-teal-500 dark:focus:border-teal-500 focus:ring-0 transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSaveCustomModalOpen(false)}
                    className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 hover:dark:text-white hover:bg-slate-50 hover:dark:bg-white/5 text-xs font-semibold transition-all focus:outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!saveCustomTitle.trim() || customSaveLoading}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all focus:outline-none ${
                      saveCustomTitle.trim() && !customSaveLoading
                        ? 'bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white shadow-lg shadow-teal-500/10'
                        : 'bg-slate-200 dark:bg-slate-850 text-slate-400 dark:text-slate-650 cursor-not-allowed'
                    }`}
                  >
                    {customSaveLoading ? 'Saving...' : 'Save Path'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal Trigger for lock overlay */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
};

export default RoadmapPage;
