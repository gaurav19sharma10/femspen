import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoal } from '../../context/GoalContext';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { useAuth } from '../../context/AuthContext';

interface RoundUpToastProps {
  onOpenGoals?: () => void;
}

export const RoundUpToast: React.FC<RoundUpToastProps> = ({ onOpenGoals }) => {
  const { recentRoundUpNotice, dismissRoundUpNotice } = useGoal();
  const { userProfile } = useAuth();

  useEffect(() => {
    if (!recentRoundUpNotice) return;
    const timer = setTimeout(() => {
      dismissRoundUpNotice();
    }, 4500);
    return () => clearTimeout(timer);
  }, [recentRoundUpNotice, dismissRoundUpNotice]);

  return (
    <AnimatePresence>
      {recentRoundUpNotice && (
        <motion.div
          key={recentRoundUpNotice.id}
          initial={{ opacity: 0, y: 50, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="fixed bottom-24 right-6 z-50 max-w-sm bg-gray-900/95 backdrop-blur-md text-white rounded-2xl p-3.5 shadow-2xl border border-gray-700/50 flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
            <Sparkles size={18} />
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-amber-300">
                💰 {formatCurrency(recentRoundUpNotice.amount, userProfile?.currency)} Saved!
              </span>
            </div>
            <p className="text-[11px] text-gray-300 truncate">
              Round-up allocated to <span className="font-semibold text-white">{recentRoundUpNotice.goalTitle}</span>
            </p>
          </div>

          {onOpenGoals && (
            <button
              onClick={() => {
                dismissRoundUpNotice();
                onOpenGoals();
              }}
              className="px-2.5 py-1 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
            >
              View
              <ArrowRight size={12} />
            </button>
          )}

          <button
            onClick={dismissRoundUpNotice}
            className="p-1 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
