import React, { useEffect, useRef } from 'react';
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
  rules?: any[];
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
  rules = [],
}) => {
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<any>([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<any>([]);
  const { theme } = useRoadmapStore();
  const customPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Clear custom positions when startNodeId changes to reset layout for a new starting node
  useEffect(() => {
    customPositionsRef.current.clear();
  }, [startNodeId]);

  const onNodeDragStop = (_event: React.MouseEvent, node: any) => {
    if (node && node.position) {
      customPositionsRef.current.set(node.id, node.position);
    }
  };

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

    const checkEligibility = (fromId: string, toId: string): { eligible: boolean; exception?: string } => {
      if (!rules || rules.length === 0) return { eligible: true };

      const targetRules = rules.filter((rule) => {
        const ruleTargetId = typeof rule.targetNode === 'string' 
          ? rule.targetNode 
          : rule.targetNode?._id || (rule.targetNode as any)?.toString();
        return ruleTargetId === toId;
      });

      if (targetRules.length === 0) return { eligible: true };

      const pathNodeIds = new Set<string>();
      pathNodeIds.add(fromId);
      const queue = [fromId];
      const visited = new Set<string>([fromId]);
      
      while (queue.length > 0) {
        const curr = queue.shift()!;
        const parents = reverseAdj.get(curr) || [];
        parents.forEach((pId) => {
          if (!visited.has(pId)) {
            visited.add(pId);
            pathNodeIds.add(pId);
            queue.push(pId);
          }
        });
      }

      const blockRules = targetRules.filter((rule) => rule.ruleType === 'BLOCK');
      for (const rule of blockRules) {
        const sourceId = typeof rule.sourceNode === 'string' 
          ? rule.sourceNode 
          : rule.sourceNode?._id || (rule.sourceNode as any)?.toString();
        
        if (pathNodeIds.has(sourceId)) {
          return {
            eligible: false,
            exception: rule.exceptions || `Blocked: ${rule.sourceNode?.name || 'Prerequisite'} is in conflict.`
          };
        }
      }

      const allowRules = targetRules.filter((rule) => rule.ruleType === 'ALLOW');
      if (allowRules.length === 0) return { eligible: true };

      let satisfiedAnyAllow = false;
      let firstAllowException = '';

      for (const rule of allowRules) {
        const sourceId = typeof rule.sourceNode === 'string' 
          ? rule.sourceNode 
          : rule.sourceNode?._id || (rule.sourceNode as any)?.toString();

        if (pathNodeIds.has(sourceId)) {
          satisfiedAnyAllow = true;
          break;
        }
        if (!firstAllowException && rule.exceptions) {
          firstAllowException = rule.exceptions;
        }
      }

      if (!satisfiedAnyAllow) {
        return {
          eligible: false,
          exception: firstAllowException || `Requires prerequisite: ${allowRules.map(r => r.sourceNode?.name || 'Required step').join(' or ')}.`
        };
      }

      return { eligible: true };
    };

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

    // 4. Align children under parent average Y coordinates and resolve 1D overlaps
    const VERTICAL_GAP = 140;
    const minSpacing = 150; // card height + vertical gap
    const yPositions = new Map<string, number>();

    // Position level 0
    const level0 = levels[0] || [];
    level0.forEach((nodeId, idx) => {
      const offset = ((level0.length - 1) * VERTICAL_GAP) / 2;
      yPositions.set(nodeId, idx * VERTICAL_GAP - offset);
    });

    // Process levels 1+
    for (let d = 1; d <= maxDepth; d++) {
      const currentLevel = levels[d] || [];
      if (currentLevel.length === 0) continue;

      const preferredY = new Map<string, number>();
      currentLevel.forEach((nodeId) => {
        const parents = reverseAdj.get(nodeId) || [];
        const positionedParents = parents.filter((pId) => yPositions.has(pId));

        if (positionedParents.length > 0) {
          const avgY =
            positionedParents.reduce((sum, pId) => sum + yPositions.get(pId)!, 0) /
            positionedParents.length;
          preferredY.set(nodeId, avgY);
        } else {
          preferredY.set(nodeId, 0);
        }
      });

      // Sort by preferred coordinate to preserve vertical order
      currentLevel.sort((a, b) => preferredY.get(a)! - preferredY.get(b)!);

      // Force-directed 1D separation sweep along the Y axis
      const positions = currentLevel.map((nodeId) => ({
        id: nodeId,
        y: preferredY.get(nodeId)!,
      }));

      for (let iter = 0; iter < 12; iter++) {
        for (let i = 0; i < positions.length - 1; i++) {
          const top = positions[i];
          const bottom = positions[i + 1];
          const overlap = minSpacing - (bottom.y - top.y);
          if (overlap > 0) {
            top.y -= overlap / 2;
            bottom.y += overlap / 2;
          }
        }
      }

      positions.forEach((pos) => {
        yPositions.set(pos.id, pos.y);
      });
    }

    // 5. Create flow nodes
    const flowNodes = nodes.map((node) => {
      const d = depths.get(node._id) ?? 0;
      const x = d * 310 + 40; // Horizontal gap of 310px per depth level
      const y = yPositions.get(node._id) ?? 0;

      // Check if this node has a user-dragged position
      const customPos = customPositionsRef.current.get(node._id);
      const finalPosition = customPos ? customPos : { x, y };

      const isHighlighted = highlightedPathNodeIds.includes(node._id);
      const isRoot = node._id === startNodeId;

      return {
        id: node._id,
        type: 'customNode',
        position: finalPosition,
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

      const eligibility = checkEligibility(fromId, toId);

      return {
        id: rel._id,
        source: fromId,
        target: toId,
        animated: isPathEdge && eligibility.eligible,
        label: !eligibility.eligible ? (
          <div 
            title={eligibility.exception}
            className="flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-red-500 bg-red-100 dark:bg-red-950/80 border border-red-200 dark:border-red-900/50 cursor-help select-none"
          >
            <span>⚠️</span>
            <span>Blocked</span>
          </div>
        ) : (
          (() => {
            switch (rel.type) {
              case 'ELIGIBLE_FOR': return 'Eligible for';
              case 'LEADS_TO': return 'Leads to';
              case 'REQUIRES_EXAM': return 'Requires exam';
              case 'OFFERED_BY': return 'Offered by';
              default: return rel.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
            }
          })()
        ),
        labelStyle: !eligibility.eligible 
          ? { display: 'none' } 
          : { fill: theme === 'dark' ? '#94A3B8' : '#475569', fontSize: 10, fontWeight: 500 },
        labelBgPadding: [4, 2],
        labelBgBorderRadius: 4,
        labelBgStyle: !eligibility.eligible 
          ? { fillOpacity: 0, strokeOpacity: 0 } 
          : { fill: theme === 'dark' ? '#0E1524' : '#F8FAFC', fillOpacity: 0.85, stroke: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
        style: {
          stroke: !eligibility.eligible 
            ? '#EF4444' 
            : (isPathEdge ? '#06B6D4' : 'rgba(148, 163, 184, 0.25)'),
          strokeWidth: isPathEdge ? 3 : 1.5,
          strokeDasharray: !eligibility.eligible ? '5,5' : undefined,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: !eligibility.eligible 
            ? '#EF4444' 
            : (isPathEdge ? '#06B6D4' : 'rgba(148, 163, 184, 0.25)'),
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
    rules,
  ]);

  return (
    <div className="w-full h-full min-h-[500px] bg-slate-50 dark:bg-[#080C14] rounded-2xl border border-slate-200 dark:border-white/5 relative overflow-hidden">
      {/* Floating UX Instruction Tooltip */}
      <div className="absolute top-4 right-4 z-10 bg-white/80 dark:bg-[#0E1524]/85 backdrop-blur-md border border-slate-200 dark:border-white/5 px-3.5 py-2 rounded-xl pointer-events-none flex items-center space-x-2 text-[10px] text-slate-500 dark:text-slate-400 shadow-lg">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
        <span>Drag to pan • Scroll to zoom • Use node buttons to explore</span>
      </div>

      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
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
