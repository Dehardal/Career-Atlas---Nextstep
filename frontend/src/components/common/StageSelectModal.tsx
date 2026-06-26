import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GraduationCap, ArrowRight, Loader2, MapPin, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import type { Node } from '../../services/api';
import { useRoadmapStore } from '../../store/useRoadmapStore';

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

const getStreamDisplayNameAndEmoji = (name: string) => {
  if (name.includes('Science')) return { label: 'Science', emoji: '🧪' };
  if (name.includes('Commerce')) return { label: 'Commerce', emoji: '💼' };
  if (name.includes('Arts') || name.includes('Humanities')) return { label: 'Arts & Humanities', emoji: '🎨' };
  return { label: name, emoji: '✨' };
};

export const StageSelectModal: React.FC<StageSelectModalProps> = ({
  isOpen,
  onClose,
  targetCareer,
  onConfirm,
}) => {
  const { theme } = useRoadmapStore();
  const [qualifications, setQualifications] = useState<Node[]>([]);
  const [streams, setStreams] = useState<Node[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Node | null>(null);
  const [selectedStream, setSelectedStream] = useState<Node | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelected(null);
    setSelectedStream(null);
    const fetchQualsAndStreams = async () => {
      setLoading(true);
      try {
        const [qualsRes, streamsRes] = await Promise.all([
          api.getNodes({ type: 'QUALIFICATION', limit: 100 }),
          api.getNodes({ type: 'STREAM', limit: 100 }),
        ]);
        setQualifications(qualsRes.nodes);
        setStreams(streamsRes.nodes);
      } catch (err) {
        console.error('Failed to load qualifications or streams', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQualsAndStreams();
  }, [isOpen]);

  const isClass12 = selected?.name === 'Class 12';
  const canConfirm = selected && (!isClass12 || selectedStream);

  const handleConfirm = () => {
    if (!selected || !targetCareer || !canConfirm) return;
    if (isClass12) {
      if (!selectedStream) return;
      onConfirm(selectedStream, targetCareer);
    } else {
      onConfirm(selected, targetCareer);
    }
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
            className="absolute inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 24 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="relative w-full max-w-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col transition-colors duration-300"
            style={{ maxHeight: '90vh' }}
          >
            {/* Decorative glows */}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none opacity-50 dark:opacity-100" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none opacity-50 dark:opacity-100" />

            {/* Header */}
            <div className="relative p-6 pb-4 border-b border-slate-100 dark:border-white/5">
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0" />

              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    Where are you right now?
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Select your current education stage to map your path to{' '}
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {targetCareer?.name ?? 'this career'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Stage List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
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
                <div className="space-y-2">
                  {qualifications.map((qual, idx) => {
                    const isSelected = selected?._id === qual._id;
                    const icon = getStageIcon(qual.name);

                    return (
                      <motion.button
                        key={qual._id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04, duration: 0.25 }}
                        onClick={() => {
                          setSelected(qual);
                          setSelectedStream(null); // Reset stream on stage change
                        }}
                        className={`w-full flex items-center space-x-3 p-3.5 rounded-xl border text-left transition-all duration-200 group ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_0_1px_rgba(52,211,153,0.2)]'
                            : 'border-slate-200 dark:border-white/5 hover:border-slate-300 hover:dark:border-white/15 hover:bg-slate-50 hover:dark:bg-white/3'
                        }`}
                      >
                        {/* Icon */}
                        <span
                          className={`text-xl w-9 h-9 flex items-center justify-center rounded-lg shrink-0 transition-colors ${
                            isSelected ? 'bg-emerald-500/20' : 'bg-slate-100 dark:bg-white/5 group-hover:bg-slate-200 dark:group-hover:bg-white/8'
                          }`}
                        >
                          {icon}
                        </span>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-semibold truncate transition-colors ${
                              isSelected ? 'text-emerald-600 dark:text-emerald-300 font-bold' : 'text-slate-700 dark:text-slate-200 group-hover:text-slate-900 group-hover:dark:text-white'
                            }`}
                          >
                            {qual.name}
                          </p>
                          {qual.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 group-hover:text-slate-700 group-hover:dark:text-slate-400 transition-colors">
                              {qual.description}
                            </p>
                          )}
                        </div>

                        {/* Selection indicator */}
                        <div
                          className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-500'
                              : 'border-slate-300 dark:border-slate-650 group-hover:border-slate-400'
                          }`}
                        >
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-1.5 h-1.5 rounded-full bg-white dark:bg-[#0B1120]"
                            />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Stream Selection Section */}
              <AnimatePresence>
                {isClass12 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="border-t border-slate-100 dark:border-white/5 pt-4 space-y-3"
                  >
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Select your Class 12 Stream
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {streams.map((stream) => {
                        const isStreamSelected = selectedStream?._id === stream._id;
                        const info = getStreamDisplayNameAndEmoji(stream.name);
                        return (
                          <button
                            key={stream._id}
                            type="button"
                            onClick={() => setSelectedStream(stream)}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-200 ${
                              isStreamSelected
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
                                : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:bg-slate-50 dark:hover:bg-white/3 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                          >
                            <span className="text-xl mb-1">{info.emoji}</span>
                            <span className="text-[10px] font-bold tracking-tight leading-tight">
                              {info.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-[#070C19]/60 backdrop-blur-sm">
              {selected && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-2 mb-3 px-1"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Mapping{' '}
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {isClass12 && selectedStream
                        ? `Class 12 (${getStreamDisplayNameAndEmoji(selectedStream.name).label} Stream)`
                        : selected.name}
                    </span>
                    {' → '}
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{targetCareer?.name}</span>
                  </p>
                </motion.div>
              )}

              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 hover:dark:text-white hover:border-slate-300 hover:dark:border-white/20 text-xs font-semibold hover:bg-slate-100/50 hover:dark:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: canConfirm ? 1.02 : 1 }}
                  whileTap={{ scale: canConfirm ? 0.97 : 1 }}
                  onClick={handleConfirm}
                  disabled={!canConfirm}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    canConfirm
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg dark:shadow-emerald-900/40'
                      : 'bg-slate-200 dark:bg-slate-850 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {canConfirm ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Chart My Path</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <span>
                      {isClass12 ? 'Choose a Stream' : 'Select a Stage'}
                    </span>
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
