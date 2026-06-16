import React, { useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomNode from './CustomNode';
import type { Node as ApiNode, Relationship } from '../../services/api';
import { useRoadmapStore } from '../../store/useRoadmapStore';

const nodeTypes = {
  customNode: CustomNode,
};

interface PathwayMapProps {
  nodes: ApiNode[];
  relationships: Relationship[];
  highlightedPathNodeIds?: string[];
  onNodeSelect?: (node: ApiNode) => void;
  // Explorer additions
  viewMode?: 'PATH' | 'EXPLORER';
  expandedNodeIds?: string[];
  onExpandToggle?: (nodeId: string, expanded: boolean) => void;
  startNodeId?: string;
}

export const PathwayMap: React.FC<PathwayMapProps> = ({
  nodes,
  relationships,
  highlightedPathNodeIds = [],
  onNodeSelect,
  viewMode = 'PATH',
  expandedNodeIds = [],
  onExpandToggle,
  startNodeId,
}) => {
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<any>([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<any>([]);
  const { theme } = useRoadmapStore();

  useEffect(() => {
    if (nodes.length === 0) {
      setRfNodes([]);
      setRfEdges([]);
      return;
    }

    // 1. Build adjacency maps
    const adj = new Map<string, string[]>();
    const reverseAdj = new Map<string, string[]>();
    nodes.forEach((node) => {
      adj.set(node._id, []);
      reverseAdj.set(node._id, []);
    });

    relationships.forEach((rel) => {
      const fromId = typeof rel.fromNode === 'string' ? rel.fromNode : rel.fromNode._id;
      const toId = typeof rel.toNode === 'string' ? rel.toNode : rel.toNode._id;

      if (adj.has(fromId) && adj.has(toId)) {
        adj.get(fromId)!.push(toId);
        reverseAdj.get(toId)!.push(fromId);
      }
    });

    // 2. BFS Depth Assignment starting from the root node
    const depths = new Map<string, number>();
    const queue: string[] = [];

    let rootId = startNodeId;
    if (!rootId && highlightedPathNodeIds.length > 0) {
      rootId = highlightedPathNodeIds[0];
    }

    if (rootId && adj.has(rootId)) {
      depths.set(rootId, 0);
      queue.push(rootId);
    } else {
      // Find source nodes (nodes with 0 incoming relationships in the active subset)
      const hasParents = new Set<string>();
      relationships.forEach((rel) => {
        const toId = typeof rel.toNode === 'string' ? rel.toNode : rel.toNode._id;
        hasParents.add(toId);
      });
      nodes.forEach((node) => {
        if (!hasParents.has(node._id)) {
          depths.set(node._id, 0);
          queue.push(node._id);
        }
      });
    }

    if (queue.length === 0 && nodes.length > 0) {
      depths.set(nodes[0]._id, 0);
      queue.push(nodes[0]._id);
    }

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const currDepth = depths.get(curr)!;
      const children = adj.get(curr) || [];

      children.forEach((childId) => {
        const childDepth = depths.get(childId);
        const nextDepth = currDepth + 1;

        if (childDepth === undefined) {
          depths.set(childId, nextDepth);
          queue.push(childId);
        } else if (nextDepth > childDepth) {
          // Always position node at its deepest relative level to resolve backward edges
          depths.set(childId, nextDepth);
          queue.push(childId);
        }
      });
    }

    // Assign fallback depth of 0 to any disconnected nodes
    nodes.forEach((node) => {
      if (!depths.has(node._id)) {
        depths.set(node._id, 0);
      }
    });

    // 3. Group node IDs by depth level
    const maxDepth = Math.max(0, ...Array.from(depths.values()));
    const levels: string[][] = Array.from({ length: maxDepth + 1 }, () => []);
    nodes.forEach((node) => {
      const d = depths.get(node._id) ?? 0;
      levels[d].push(node._id);
    });

    // 4. Align children under parent average X coordinates and resolve 1D overlaps
    const HORIZONTAL_GAP = 280;
    const minSpacing = 320; // card width (280) + gap (40)
    const xPositions = new Map<string, number>();

    // Position level 0
    const level0 = levels[0] || [];
    level0.forEach((nodeId, idx) => {
      const offset = ((level0.length - 1) * HORIZONTAL_GAP) / 2;
      xPositions.set(nodeId, idx * HORIZONTAL_GAP - offset);
    });

    // Process levels 1+
    for (let d = 1; d <= maxDepth; d++) {
      const currentLevel = levels[d] || [];
      if (currentLevel.length === 0) continue;

      const preferredX = new Map<string, number>();
      currentLevel.forEach((nodeId) => {
        const parents = reverseAdj.get(nodeId) || [];
        const positionedParents = parents.filter((pId) => xPositions.has(pId));

        if (positionedParents.length > 0) {
          const avgX =
            positionedParents.reduce((sum, pId) => sum + xPositions.get(pId)!, 0) /
            positionedParents.length;
          preferredX.set(nodeId, avgX);
        } else {
          preferredX.set(nodeId, 0);
        }
      });

      // Sort by preferred coordinate to preserve horizontal order
      currentLevel.sort((a, b) => preferredX.get(a)! - preferredX.get(b)!);

      // Force-directed 1D separation sweep
      const positions = currentLevel.map((nodeId) => ({
        id: nodeId,
        x: preferredX.get(nodeId)!,
      }));

      for (let iter = 0; iter < 12; iter++) {
        for (let i = 0; i < positions.length - 1; i++) {
          const left = positions[i];
          const right = positions[i + 1];
          const overlap = minSpacing - (right.x - left.x);
          if (overlap > 0) {
            left.x -= overlap / 2;
            right.x += overlap / 2;
          }
        }
      }

      positions.forEach((pos) => {
        xPositions.set(pos.id, pos.x);
      });
    }

    // 5. Create flow nodes
    const flowNodes = nodes.map((node) => {
      const d = depths.get(node._id) ?? 0;
      const x = xPositions.get(node._id) ?? 0;
      const y = d * 180 + 40; // Reduced vertical level spacing to 180px

      const isHighlighted = highlightedPathNodeIds.includes(node._id);
      const isRoot = node._id === startNodeId;

      return {
        id: node._id,
        type: 'customNode',
        position: { x, y },
        data: {
          node,
          isHighlighted,
          onNodeSelect,
          viewMode,
          isExpanded: expandedNodeIds.includes(node._id),
          onExpandToggle,
          isRoot,
        },
      };
    });

    // 3. Map relationships to Flow Edges
    const flowEdges = relationships.map((rel) => {
      const fromId = typeof rel.fromNode === 'string' ? rel.fromNode : rel.fromNode._id;
      const toId = typeof rel.toNode === 'string' ? rel.toNode : rel.toNode._id;
      
      const isPathEdge =
        highlightedPathNodeIds.includes(fromId) &&
        highlightedPathNodeIds.includes(toId) &&
        Math.abs(highlightedPathNodeIds.indexOf(fromId) - highlightedPathNodeIds.indexOf(toId)) === 1;

      return {
        id: rel._id,
        source: fromId,
        target: toId,
        animated: isPathEdge,
        label: (() => {
          switch (rel.type) {
            case 'ELIGIBLE_FOR': return 'Eligible for';
            case 'LEADS_TO': return 'Leads to';
            case 'REQUIRES_EXAM': return 'Requires exam';
            case 'OFFERED_BY': return 'Offered by';
            default: return rel.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
          }
        })(),
        labelStyle: { fill: theme === 'dark' ? '#94A3B8' : '#475569', fontSize: 10, fontWeight: 500 },
        labelBgPadding: [4, 2],
        labelBgBorderRadius: 4,
        labelBgStyle: { fill: theme === 'dark' ? '#0E1524' : '#F8FAFC', fillOpacity: 0.85, stroke: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
        style: {
          stroke: isPathEdge ? '#06B6D4' : 'rgba(148, 163, 184, 0.25)',
          strokeWidth: isPathEdge ? 3 : 1.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: isPathEdge ? '#06B6D4' : 'rgba(148, 163, 184, 0.25)',
        },
      };
    });

    setRfNodes(flowNodes);
    setRfEdges(flowEdges);
  }, [
    nodes,
    relationships,
    highlightedPathNodeIds,
    onNodeSelect,
    setRfNodes,
    setRfEdges,
    startNodeId,
    viewMode,
    expandedNodeIds,
    onExpandToggle,
  ]);

  return (
    <div className="w-full h-full min-h-[500px] bg-slate-50 dark:bg-[#080C14] rounded-2xl border border-slate-200 dark:border-white/5 relative overflow-hidden">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
        onlyRenderVisibleElements={true}
      >
        <Background color={theme === 'dark' ? '#1e293b' : '#cbd5e1'} gap={16} size={1} />
        <Controls className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-lg p-1" />
        <MiniMap
          nodeStrokeColor={(n: any) => {
            if (n.data?.node?.type === 'OCCUPATION') return '#10B981';
            if (n.data?.node?.type === 'DEGREE') return '#3B82F6';
            return '#6366F1';
          }}
          nodeColor={() => {
            return theme === 'dark' ? '#0E1524' : '#E2E8F0';
          }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg hidden sm:block"
          style={{ width: 120, height: 90 }}
        />
      </ReactFlow>
    </div>
  );
};

export default PathwayMap;
