import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GraduationCap, ArrowRight, Loader2, MapPin, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import type { Node } from '../../services/api';

interface StageSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The career (target) the user wants to chart a path toward */
  targetCareer: Node | null;
  /** Called when user confirms their stage — provides both start + target */
  onConfirm: (startNode: Node, targetNode: Node) => void;
}

// Map node types/names to icon emojis for a friendlier feel
const STAGE_ICONS: Record<string, string> = {
  '10th': '📘',
  '12th': '📗',
  'diploma': '📜',
  'bachelor': '🎓',
  'b.tech': '🎓',
  'b.e': '🎓',
  'master': '🏆',
  'm.tech': '🏆',
  'phd': '🔬',
  'default': '🎯',
};

const getStageIcon = (name: string): string => {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(STAGE_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return STAGE_ICONS['default'];
};

export const StageSelectModal: React.FC<StageSelectModalProps> = ({
  isOpen,
  onClose,
  targetCareer,
  onConfirm,
}) => {
  const [qualifications, setQualifications] = useState<Node[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Node | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelected(null);
    const fetchQuals = async () => {
      setLoading(true);
      try {
        const res = await api.getNodes({ type: 'QUALIFICATION', limit: 100 });
        setQualifications(res.nodes);
      } catch (err) {
        console.error('Failed to load qualifications', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuals();
  }, [isOpen]);

  const handleConfirm = () => {
    if (!selected || !targetCareer) return;
    onConfirm(selected, targetCareer);
  };

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 24 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="relative w-full max-w-lg bg-[#0B1120] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col"
            style={{ maxHeight: '90vh' }}
          >
            {/* Decorative glows */}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="relative p-6 pb-4 border-b border-white/5">
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0" />

              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white leading-tight">
                    Where are you right now?
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select your current education stage to map your path to{' '}
                    <span className="text-emerald-400 font-semibold">
                      {targetCareer?.name ?? 'this career'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Stage List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mb-3 text-emerald-500" />
                  <span className="text-xs">Loading education stages...</span>
                </div>
              ) : qualifications.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No qualification stages found.
                </div>
              ) : (
                qualifications.map((qual, idx) => {
                  const isSelected = selected?._id === qual._id;
                  const icon = getStageIcon(qual.name);

                  return (
                    <motion.button
                      key={qual._id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04, duration: 0.25 }}
                      onClick={() => setSelected(qual)}
                      className={`w-full flex items-center space-x-3 p-3.5 rounded-xl border text-left transition-all duration-200 group ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_0_1px_rgba(52,211,153,0.2)]'
                          : 'border-white/5 hover:border-white/15 hover:bg-white/3'
                      }`}
                    >
                      {/* Icon */}
                      <span
                        className={`text-xl w-9 h-9 flex items-center justify-center rounded-lg shrink-0 transition-colors ${
                          isSelected ? 'bg-emerald-500/20' : 'bg-white/5 group-hover:bg-white/8'
                        }`}
                      >
                        {icon}
                      </span>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-semibold truncate transition-colors ${
                            isSelected ? 'text-emerald-300' : 'text-slate-200 group-hover:text-white'
                          }`}
                        >
                          {qual.name}
                        </p>
                        {qual.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 group-hover:text-slate-400 transition-colors">
                            {qual.description}
                          </p>
                        )}
                      </div>

                      {/* Selection indicator */}
                      <div
                        className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'border-emerald-400 bg-emerald-400'
                            : 'border-slate-600 group-hover:border-slate-400'
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-1.5 h-1.5 rounded-full bg-[#0B1120]"
                          />
                        )}
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 bg-[#070C19]/60 backdrop-blur-sm">
              {selected && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-2 mb-3 px-1"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <p className="text-xs text-slate-400">
                    Mapping{' '}
                    <span className="text-emerald-400 font-semibold">{selected.name}</span>
                    {' → '}
                    <span className="text-emerald-400 font-semibold">{targetCareer?.name}</span>
                  </p>
                </motion.div>
              )}

              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: selected ? 1.02 : 1 }}
                  whileTap={{ scale: selected ? 0.97 : 1 }}
                  onClick={handleConfirm}
                  disabled={!selected}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    selected
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-900/40'
                      : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {selected ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Chart My Path</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <span>Select a Stage First</span>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default StageSelectModal;
