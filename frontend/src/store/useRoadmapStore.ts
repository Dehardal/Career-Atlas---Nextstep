import { create } from 'zustand';
import { api } from '../services/api';
import type { Node, RoadmapPath, Relationship, SavedRoadmap, Bookmark } from '../services/api';

interface RoadmapState {
  startNode: Node | null;
  targetNode: Node | null;
  pathways: RoadmapPath[];
  selectedPathIndex: number;
  bfsTree: Record<number, Node[]> | null;
  loading: boolean;
  error: string | null;

  // Explorer State
  viewMode: 'PATH' | 'EXPLORER';
  explorerNodes: Node[];
  explorerRelationships: Relationship[];
  expandedNodeIds: string[];

  // Theme State
  theme: 'dark' | 'light';

  // Auth State
  user: { name: string; email: string; avatar: string; role: 'STUDENT' | 'ADMIN' } | null;

  // Saved Roadmaps & Bookmarks State
  savedRoadmaps: SavedRoadmap[];
  bookmarks: Bookmark[];

  // Suggestion Modal State
  suggestionModalOpen: boolean;
  setSuggestionModalOpen: (open: boolean) => void;

  setStartNode: (node: Node | null) => void;
  setTargetNode: (node: Node | null) => void;
  setSelectedPathIndex: (index: number) => void;
  fetchBfsTree: (nodeId: string) => Promise<void>;
  fetchPathways: () => Promise<void>;
  clearStore: () => void;

  // Explorer Actions
  setViewMode: (mode: 'PATH' | 'EXPLORER') => void;
  expandNode: (nodeId: string) => Promise<void>;
  collapseNode: (nodeId: string) => void;
  resetExplorer: (startNode: Node) => void;
  toggleTheme: () => void;

  // Auth Actions
  loginWithGoogle: (email: string, name: string, role: 'STUDENT' | 'ADMIN') => void;
  logout: () => void;

  // Saved Roadmaps & Bookmarks Actions
  fetchUserDashboard: () => Promise<void>;
  saveRoadmap: (title: string, description?: string) => Promise<void>;
  deleteSavedRoadmap: (id: string) => Promise<void>;
  addBookmark: (nodeId: string, notes?: string) => Promise<void>;
  deleteBookmark: (id: string) => Promise<void>;
}

export const useRoadmapStore = create<RoadmapState>((set, get) => ({
  startNode: null,
  targetNode: null,
  pathways: [],
  selectedPathIndex: 0,
  bfsTree: null,
  loading: false,
  error: null,

  // Explorer State Initial
  viewMode: 'PATH',
  explorerNodes: [],
  explorerRelationships: [],
  expandedNodeIds: [],
  theme: (localStorage.getItem('theme') as 'dark' | 'light') || 'dark',

  // Saved Roadmaps & Bookmarks Initial
  savedRoadmaps: [],
  bookmarks: [],
  suggestionModalOpen: false,

  // Auth State Init
  user: (() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  })(),

  setStartNode: (node: Node | null) => {
    set({ startNode: node, pathways: [], selectedPathIndex: 0 });
    // Auto-initialize explorer when setting startNode if we are in explorer mode
    if (node) {
      if (get().viewMode === 'EXPLORER') {
        get().resetExplorer(node);
      }
    }
  },
  setTargetNode: (node: Node | null) => set({ targetNode: node, pathways: [], selectedPathIndex: 0 }),
  setSelectedPathIndex: (index: number) => set({ selectedPathIndex: index }),

  fetchBfsTree: async (nodeId: string) => {
    set({ loading: true, error: null });
    try {
      const { bfsTree } = await api.getBfsTree(nodeId);
      set({ bfsTree, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to fetch BFS tree', loading: false });
    }
  },

  fetchPathways: async () => {
    const { startNode, targetNode } = get();
    if (!startNode || !targetNode) return;

    set({ loading: true, error: null });
    try {
      const { paths } = await api.getAlternativePaths(startNode._id, targetNode._id);
      set({ pathways: paths, selectedPathIndex: 0, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to fetch pathways', loading: false });
    }
  },

  clearStore: () => set({
    startNode: null,
    targetNode: null,
    pathways: [],
    selectedPathIndex: 0,
    bfsTree: null,
    loading: false,
    error: null,
    viewMode: 'PATH',
    explorerNodes: [],
    explorerRelationships: [],
    expandedNodeIds: [],
    savedRoadmaps: [],
    bookmarks: []
  }),

  // Explorer Actions Implementations
  setViewMode: (viewMode: 'PATH' | 'EXPLORER') => {
    set({ viewMode });
    if (viewMode === 'EXPLORER') {
      const { startNode } = get();
      if (startNode) {
        get().resetExplorer(startNode);
      }
    }
  },

  expandNode: async (nodeId: string) => {
    const { expandedNodeIds, explorerNodes, explorerRelationships } = get();
    if (expandedNodeIds.includes(nodeId)) return;

    set({ loading: true, error: null });
    try {
      const newExpanded = [...expandedNodeIds, nodeId];
      const newNodes = [...explorerNodes];
      const newRels = [...explorerRelationships];

      // Fetch standard outgoing relationships
      const rels = await api.getRelationships({ fromNode: nodeId });
      
      rels.forEach((rel) => {
        const targetNode = typeof rel.toNode === 'object' ? rel.toNode : null;
        if (targetNode) {
          if (!newNodes.some((n) => n._id === targetNode._id)) {
            newNodes.push(targetNode);
          }
        }

        const fromId = typeof rel.fromNode === 'string' ? rel.fromNode : rel.fromNode._id;
        const toId = typeof rel.toNode === 'string' ? rel.toNode : rel.toNode._id;

        if (!newRels.some((r) => {
          const rFromId = typeof r.fromNode === 'string' ? r.fromNode : r.fromNode._id;
          const rToId = typeof r.toNode === 'string' ? r.toNode : r.toNode._id;
          return rFromId === fromId && rToId === toId;
        })) {
          newRels.push(rel);
        }
      });

      // Special Case: If this is a DEGREE node, fetch its offering institutes and entrance exams
      const expandedNode = explorerNodes.find((n) => n._id === nodeId);
      if (expandedNode && expandedNode.type === 'DEGREE') {
        const mappings = await api.getInstituteCourses({ degree: nodeId });
        
        mappings.forEach((mapping) => {
          if (mapping.institute) {
            // Add institute node
            if (!newNodes.some((n) => n._id === mapping.institute._id)) {
              newNodes.push(mapping.institute);
            }
            
            // Add OFFERS edge (from institute to degree)
            const offersRelId = `offers-${mapping.institute._id}-${nodeId}`;
            if (!newRels.some((r) => r._id === offersRelId)) {
              newRels.push({
                _id: offersRelId,
                fromNode: mapping.institute,
                toNode: expandedNode,
                type: 'OFFERS',
                metadata: {
                  description: `Offers ${mapping.specialization}`
                }
              });
            }

            // Add Entrance Exam if available
            if (mapping.entranceExam) {
              if (!newNodes.some((n) => n._id === mapping.entranceExam!._id)) {
                newNodes.push(mapping.entranceExam);
              }
              
              // Add ELIGIBLE_FOR edge from exam to institute
              const examRelId = `exam-${mapping.entranceExam._id}-${mapping.institute._id}`;
              if (!newRels.some((r) => r._id === examRelId)) {
                newRels.push({
                  _id: examRelId,
                  fromNode: mapping.entranceExam,
                  toNode: mapping.institute,
                  type: 'ELIGIBLE_FOR',
                  metadata: {
                    description: 'Accepted Exam'
                  }
                });
              }
            }
          }
        });
      }

      set({
        expandedNodeIds: newExpanded,
        explorerNodes: newNodes,
        explorerRelationships: newRels,
        loading: false
      });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to expand node', loading: false });
    }
  },

  collapseNode: (nodeId: string) => {
    const { expandedNodeIds, explorerNodes, explorerRelationships, startNode } = get();
    if (!startNode) return;

    const newExpanded = expandedNodeIds.filter((id) => id !== nodeId);

    // Reachability calculation starting from startNode using only edges from newExpanded nodes
    const reachableNodeIds = new Set<string>();
    reachableNodeIds.add(startNode._id);

    const queue = [startNode._id];
    const visited = new Set<string>();
    visited.add(startNode._id);

    while (queue.length > 0) {
      const currentId = queue.shift()!;

      if (newExpanded.includes(currentId)) {
        const outboundRels = explorerRelationships.filter((rel) => {
          const fromId = typeof rel.fromNode === 'string' ? rel.fromNode : rel.fromNode._id;
          return fromId === currentId;
        });

        outboundRels.forEach((rel) => {
          const toId = typeof rel.toNode === 'string' ? rel.toNode : rel.toNode._id;
          if (!visited.has(toId)) {
            visited.add(toId);
            reachableNodeIds.add(toId);
            queue.push(toId);
          }
        });
      }
    }

    const newNodes = explorerNodes.filter((n) => reachableNodeIds.has(n._id));
    const newRels = explorerRelationships.filter((rel) => {
      const fromId = typeof rel.fromNode === 'string' ? rel.fromNode : rel.fromNode._id;
      const toId = typeof rel.toNode === 'string' ? rel.toNode : rel.toNode._id;
      return reachableNodeIds.has(fromId) && reachableNodeIds.has(toId);
    });

    set({
      expandedNodeIds: newExpanded,
      explorerNodes: newNodes,
      explorerRelationships: newRels
    });
  },

  resetExplorer: (startNode: Node) => {
    set({
      viewMode: 'EXPLORER',
      startNode,
      explorerNodes: [startNode],
      explorerRelationships: [],
      expandedNodeIds: [],
      selectedPathIndex: 0,
      pathways: []
    });
    get().expandNode(startNode._id);
  },
  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme: nextTheme });
  },
  loginWithGoogle: (email, name, role) => {
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || email)}`;
    const user = { name, email, avatar, role };
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
    get().fetchUserDashboard();
  },
  logout: () => {
    localStorage.removeItem('user');
    set({ user: null, savedRoadmaps: [], bookmarks: [] });
  },

  // Saved Roadmaps & Bookmarks implementation
  fetchUserDashboard: async () => {
    const { user } = get();
    if (!user) return;
    set({ loading: true, error: null });
    try {
      const [roadmaps, bookmarks] = await Promise.all([
        api.getSavedRoadmaps(user.email),
        api.getBookmarks(user.email)
      ]);
      set({ savedRoadmaps: roadmaps, bookmarks, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to fetch dashboard data', loading: false });
    }
  },
  saveRoadmap: async (title: string, description?: string) => {
    const { user, pathways, selectedPathIndex } = get();
    if (!user) return;
    const path = pathways[selectedPathIndex];
    if (!path) return;

    const nodeSequence = path.steps.map((s) => s.node._id);
    const relationshipSequence = path.steps
      .map((s) => s.relationship?._id)
      .filter((id): id is string => !!id);

    set({ loading: true, error: null });
    try {
      await api.saveRoadmap({
        email: user.email,
        title,
        description,
        nodeSequence,
        relationshipSequence
      });
      await get().fetchUserDashboard();
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to save roadmap', loading: false });
    }
  },
  deleteSavedRoadmap: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await api.deleteSavedRoadmap(id);
      await get().fetchUserDashboard();
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to delete roadmap', loading: false });
    }
  },
  addBookmark: async (nodeId: string, notes?: string) => {
    const { user } = get();
    if (!user) return;
    set({ loading: true, error: null });
    try {
      await api.addBookmark({ email: user.email, nodeId, notes });
      await get().fetchUserDashboard();
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to add bookmark', loading: false });
    }
  },
  deleteBookmark: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await api.deleteBookmark(id);
      await get().fetchUserDashboard();
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to delete bookmark', loading: false });
    }
  },
  setSuggestionModalOpen: (open: boolean) => set({ suggestionModalOpen: open })
}));
export default useRoadmapStore;
