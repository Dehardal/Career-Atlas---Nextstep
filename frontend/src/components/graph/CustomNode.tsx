import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { 
  GraduationCap, 
  FileText, 
  Briefcase, 
  Wrench, 
  Landmark, 
  Layers, 
  BookOpen,
  Award,
  MapPin,
  TrendingUp
} from 'lucide-react';
import type { Node as ApiNode } from '../../services/api';
import { useRoadmapStore } from '../../store/useRoadmapStore';

const typeConfigs: Record<string, { 
  label: string; 
  color: string; 
  bg: string; 
  border: string; 
  icon: React.ComponentType<any> 
}> = {
  QUALIFICATION: { label: 'Education Level', color: '#EC4899', bg: 'bg-pink-500/10', border: 'border-pink-500/30', icon: Award },
  BOARD: { label: 'Education Board', color: '#8B5CF6', bg: 'bg-violet-500/10', border: 'border-violet-500/30', icon: Layers },
  STREAM: { label: 'Academic Stream', color: '#F59E0B', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: Layers },
  SUBJECT_COMBINATION: { label: 'Required Subjects', color: '#14B8A6', bg: 'bg-teal-500/10', border: 'border-teal-500/30', icon: BookOpen },
  EXAM: { label: 'Entrance Exam', color: '#EF4444', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: FileText },
  DEGREE: { label: 'Degree Course', color: '#3B82F6', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: GraduationCap },
  OCCUPATION: { label: 'Target Career', color: '#10B981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: Briefcase },
  SKILL: { label: 'Skill Tree', color: '#64748B', bg: 'bg-slate-500/10', border: 'border-slate-500/30', icon: Wrench },
  INSTITUTE: { label: 'College / University', color: '#06B6D4', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', icon: Landmark }
};

interface CustomNodeProps {
  data: {
    node: ApiNode;
    isHighlighted?: boolean;
    onNodeSelect?: (node: ApiNode) => void;
    // Explorer addition
    viewMode?: 'PATH' | 'EXPLORER';
    isExpanded?: boolean;
    onExpandToggle?: (nodeId: string, expanded: boolean) => void;
    isRoot?: boolean;
  };
  selected?: boolean;
}

export const CustomNode: React.FC<CustomNodeProps> = ({ data, selected }) => {
  const { node, isHighlighted, onNodeSelect, viewMode, isExpanded, onExpandToggle, isRoot } = data;
  const config = typeConfigs[node.type] || { label: node.type, color: '#94A3B8', bg: 'bg-slate-500/10', border: 'border-slate-500/30', icon: Layers };
  const Icon = config.icon;
  const { theme } = useRoadmapStore();

  // Render type-specific details in mini view
  const renderDetails = () => {
    switch (node.type) {
      case 'OCCUPATION':
        if (node.averageSalaryRange) {
          const formatSalary = (val: number) => {
            if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
            return `₹${val}`;
          };
          return (
            <div className="flex items-center space-x-2 mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                <TrendingUp className="w-3 h-3 mr-1" />
                {node.growthRate || 'HIGH'}
              </span>
              <span>•</span>
              <span>
                {formatSalary(node.averageSalaryRange.min)} - {formatSalary(node.averageSalaryRange.max)}
              </span>
            </div>
          );
        }
        break;
      case 'DEGREE':
        return (
          <div className="flex items-center space-x-2 mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">
            <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-1 rounded text-[9px] font-bold">
              {node.level || 'UG'}
            </span>
            <span>•</span>
            <span>{node.durationYears} Years</span>
          </div>
        );
      case 'EXAM':
        return (
          <div className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400 truncate">
            {node.conductingBody || 'National Level'}
          </div>
        );
      case 'INSTITUTE':
        return (
          <div className="flex items-center space-x-1.5 mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">
            <MapPin className="w-3 h-3 text-cyan-500 dark:text-cyan-400" />
            <span className="truncate">{node.location?.city}, {node.location?.state}</span>
            {node.nirfRanking && (
              <>
                <span>•</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">NIRF #{node.nirfRanking}</span>
              </>
            )}
          </div>
        );
      case 'SUBJECT_COMBINATION':
        if (node.subjects && node.subjects.length > 0) {
          return (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {node.subjects.slice(0, 3).map((sub, i) => (
                <span key={i} className="text-[8px] bg-teal-100 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/20 px-1 rounded">
                  {sub}
                </span>
              ))}
              {node.subjects.length > 3 && (
                <span className="text-[8px] text-slate-500 dark:text-slate-400 font-medium">+{node.subjects.length - 3} more</span>
              )}
            </div>
          );
        }
        break;
      default:
        break;
    }
    return null;
  };

  const getDarkerColor = (color: string, isLight: boolean) => {
    if (!isLight) return color;
    const darkMap: Record<string, string> = {
      '#EC4899': '#C2185B', // pink
      '#8B5CF6': '#6D28D9', // violet
      '#F59E0B': '#B45309', // amber
      '#14B8A6': '#0F766E', // teal
      '#EF4444': '#B91C1C', // red
      '#3B82F6': '#1D4ED8', // blue
      '#10B981': '#047857', // emerald
      '#64748B': '#475569', // slate
      '#06B6D4': '#0891B2', // cyan
    };
    return darkMap[color] || color;
  };

  return (
    <div 
      onClick={() => onNodeSelect?.(node)}
      className={`relative w-[230px] p-3 rounded-xl border text-left cursor-pointer transition-all duration-300 backdrop-blur-md ${
        selected 
          ? 'bg-blue-50/95 dark:bg-[#18233C]/95 border-brandCyan shadow-[0_0_15px_rgba(6,182,212,0.25)] scale-[1.03] text-slate-900 dark:text-white' 
          : isHighlighted
            ? 'bg-indigo-50/95 dark:bg-[#142340]/95 border-brandIndigo shadow-[0_0_12px_rgba(99,102,241,0.2)] scale-[1.02] text-slate-900 dark:text-white'
            : 'bg-white/90 dark:bg-[#0B0F19]/80 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 hover:dark:border-slate-700 hover:bg-slate-50 hover:dark:bg-[#121B2F]/80 text-slate-800 dark:text-slate-100 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)]'
      }`}
    >
      {/* Decorative Left Colored Strip */}
      <div 
        className="absolute top-0 left-0 bottom-0 w-1 rounded-l-xl" 
        style={{ backgroundColor: config.color }}
      />

      {/* Left Target Handles */}
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{ background: config.color, width: 8, height: 8, border: '2px solid ' + (theme === 'dark' ? '#090D16' : '#ffffff') }} 
      />

      {/* Content */}
      <div className="pl-1.5">
        <div className="flex items-center justify-between">
          {/* Badge */}
          <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-wide uppercase ${config.bg} ${config.border}`} style={{ color: getDarkerColor(config.color, theme === 'light') }}>
            <Icon className="w-2.5 h-2.5" />
            <span>{config.label}</span>
          </div>
        </div>

        <h3 className="text-xs font-bold text-slate-900 dark:text-white mt-2 leading-snug line-clamp-1">
          {node.name}
        </h3>

        <p className="text-[10px] text-slate-600 dark:text-slate-400/90 mt-1 line-clamp-2 leading-tight">
          {node.description}
        </p>

        {renderDetails()}

        {viewMode === 'EXPLORER' && onExpandToggle && !isRoot && (
          <div className="mt-2.5 border-t border-slate-200 dark:border-white/5 pt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExpandToggle(node._id, !isExpanded);
              }}
              className={`w-full text-center py-1 px-2.5 rounded-lg text-[10px] font-bold border transition-all ${
                isExpanded
                  ? 'bg-red-500/10 hover:bg-red-500/20 dark:hover:bg-red-500/25 text-red-600 dark:text-red-400 border-red-500/20 dark:border-red-500/25 hover:border-red-500/40 hover:dark:border-red-500/50'
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 dark:hover:bg-cyan-500/25 text-cyan-600 dark:text-brandCyan border-cyan-500/20 dark:border-brandCyan/25 hover:border-cyan-500/40 hover:dark:border-brandCyan/50'
              }`}
            >
              {isExpanded ? '- Collapse' : '+ Expand'}
            </button>
          </div>
        )}
      </div>

      {/* Right Source Handles */}
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ background: config.color, width: 8, height: 8, border: '2px solid ' + (theme === 'dark' ? '#090D16' : '#ffffff') }} 
      />
    </div>
  );
};

export default memo(CustomNode);
