import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Bookmark as BookmarkIcon, 
  Map, 
  Trash2, 
  GraduationCap, 
  Briefcase, 
  FileText, 
  Landmark, 
  ChevronRight, 
  Compass, 
  User as UserIcon,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useRoadmapStore } from '../../store/useRoadmapStore';
import type { SavedRoadmap, Bookmark } from '../../services/api';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    user, 
    savedRoadmaps, 
    bookmarks, 
    fetchUserDashboard, 
    deleteSavedRoadmap, 
    deleteBookmark,
    setStartNode,
    setTargetNode
  } = useRoadmapStore();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchUserDashboard();
  }, [user, navigate, fetchUserDashboard]);

  if (!user) return null;

  const handleLoadRoadmap = (roadmap: SavedRoadmap) => {
    if (roadmap.nodeSequence.length >= 2) {
      const start = roadmap.nodeSequence[0];
      const target = roadmap.nodeSequence[roadmap.nodeSequence.length - 1];
      setStartNode(start);
      setTargetNode(target);
      navigate('/roadmap');
    }
  };

  const getBookmarkIcon = (type: string) => {
    switch (type) {
      case 'OCCUPATION': return <Briefcase className="w-4 h-4 text-emerald-500" />;
      case 'DEGREE': return <GraduationCap className="w-4 h-4 text-blue-500" />;
      case 'EXAM': return <FileText className="w-4 h-4 text-red-500" />;
      case 'INSTITUTE': return <Landmark className="w-4 h-4 text-cyan-500" />;
      default: return <BookmarkIcon className="w-4 h-4 text-pink-500" />;
    }
  };

  const getBookmarkColorClass = (type: string) => {
    switch (type) {
      case 'OCCUPATION': return 'bg-emerald-500/10 border-emerald-500/20';
      case 'DEGREE': return 'bg-blue-500/10 border-blue-500/20';
      case 'EXAM': return 'bg-red-500/10 border-red-500/20';
      case 'INSTITUTE': return 'bg-cyan-500/10 border-cyan-500/20';
      default: return 'bg-pink-500/10 border-pink-500/20';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Welcome Banner */}
      <div className="glass p-8 rounded-3xl border border-slate-200 dark:border-white/5 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        {/* Glow Details */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-brandCyan/10 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brandIndigo/10 rounded-full filter blur-3xl pointer-events-none" />

        <div className="flex items-center space-x-5 text-center md:text-left flex-col md:flex-row">
          <img 
            src={user.avatar} 
            alt={user.name} 
            className="w-20 h-20 rounded-full border-2 border-brandCyan bg-slate-300 dark:bg-slate-700 shadow-md mb-4 md:mb-0"
          />
          <div>
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                Welcome back, {user.name}!
              </h1>
              <Sparkles className="w-5 h-5 text-brandCyan animate-pulse" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Analyze your educational planners, compare matched colleges, and customize your path maps.
            </p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/roadmap')}
          className="flex items-center space-x-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all"
        >
          <Compass className="w-4 h-4" />
          <span>Launch Atlas Explorer</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Grid: Saved Roadmaps & Bookmarks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Column 1 & 2: Saved Roadmaps (Wider) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Map className="w-5 h-5 text-brandCyan" />
              <span>My Saved Roadmap Planners ({savedRoadmaps.length})</span>
            </h2>
          </div>

          {savedRoadmaps.length === 0 ? (
            <div className="glass p-12 text-center text-slate-500 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
              <Map className="w-12 h-12 text-slate-400 mx-auto mb-4 animate-bounce" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No saved roadmaps yet.</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Chart a route on the Roadmap Explorer and click the "Save Pathway" button to store it here.
              </p>
              <button 
                onClick={() => navigate('/roadmap')}
                className="mt-5 inline-flex items-center space-x-1.5 text-xs text-brandCyan font-semibold hover:underline"
              >
                <span>Find custom roadmaps now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedRoadmaps.map((roadmap) => (
                <motion.div
                  key={roadmap._id}
                  whileHover={{ y: -3 }}
                  className="glass p-5 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col justify-between hover:border-brandCyan/40 hover:bg-slate-50/50 hover:dark:bg-[#121B2F]/40 transition-all duration-300 group shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-brandCyan transition-colors truncate">
                        {roadmap.title}
                      </h3>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSavedRoadmap(roadmap._id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                        title="Delete Roadmap"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {roadmap.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {roadmap.description}
                      </p>
                    )}

                    {/* Nodes flow path preview tags */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-2">
                      {roadmap.nodeSequence.map((node, i) => (
                        <React.Fragment key={node._id}>
                          <span className="text-[10px] bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 px-2 py-0.5 rounded-md font-medium text-slate-600 dark:text-slate-300 max-w-[120px] truncate">
                            {node.name}
                          </span>
                          {i < roadmap.nodeSequence.length - 1 && (
                            <ChevronRight className="w-3 h-3 text-slate-400" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-100 dark:border-white/5 pt-3.5 flex justify-end">
                    <button
                      onClick={() => handleLoadRoadmap(roadmap)}
                      className="flex items-center space-x-1.5 text-xs text-brandCyan font-bold group-hover:underline"
                    >
                      <span>Load in Roadmap</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Column 3: Bookmarks (Slightly narrower) */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <BookmarkIcon className="w-5 h-5 text-brandCyan" />
            <span>Bookmarked Items ({bookmarks.length})</span>
          </h2>

          {bookmarks.length === 0 ? (
            <div className="glass p-12 text-center text-slate-500 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
              <BookmarkIcon className="w-10 h-10 text-slate-400 mx-auto mb-4" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No bookmarked nodes yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Click bookmark/favorite icons on colleges, degrees, or exams to keep track of them here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookmarks.map((bookmark) => {
                const node = bookmark.nodeId;
                if (!node) return null;
                
                return (
                  <motion.div
                    key={bookmark._id}
                    whileHover={{ x: 3 }}
                    className="glass p-4 rounded-xl border border-slate-200 dark:border-white/5 flex items-start justify-between space-x-3 transition-all duration-200 hover:border-brandCyan/20"
                  >
                    <div className="flex items-start space-x-3 min-w-0">
                      <div className={`p-2 rounded-xl border shrink-0 ${getBookmarkColorClass(node.type)}`}>
                        {getBookmarkIcon(node.type)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-950 dark:text-white leading-tight truncate">
                          {node.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate uppercase tracking-wider font-mono">
                          {node.type}
                        </p>
                        {bookmark.notes && (
                          <p className="text-[10px] italic text-slate-500 dark:text-slate-400 mt-1 border-l-2 border-brandCyan/40 pl-1.5 leading-tight">
                            "{bookmark.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => deleteBookmark(bookmark._id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                      title="Remove Bookmark"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
