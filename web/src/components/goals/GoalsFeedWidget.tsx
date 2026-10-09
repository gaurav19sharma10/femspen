import React from 'react';
import { motion } from 'framer-motion';
import { useGoal } from '../../context/GoalContext';
import { useAuth } from '../../context/AuthContext';
import { Target, Sparkles, ChevronRight, Plus, Users, Lock } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface GoalsFeedWidgetProps {
  onOpenGoals: () => void;
  onCreateGoal: () => void;
}

export const GoalsFeedWidget: React.FC<GoalsFeedWidgetProps> = ({
  onOpenGoals,
  onCreateGoal,
}) => {
  const { activeGoals, stats, roundUpSettings } = useGoal();
  const { userProfile } = useAuth();

  if (activeGoals.length === 0) {
    return (
      <div className="mb-4 p-4 rounded-3xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white border border-blue-200/60 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0057FF]/10 text-[#0057FF] flex items-center justify-center text-xl font-bold">
            🎯
          </div>
          <div>
            <h3 className="text-xs font-black text-gray-900 leading-tight">
              Start a Goal-Based Saving Target
            </h3>
            <p className="text-[11px] text-gray-500">
              Save for school fees, family trip, or emergencies with automatic spare-change round-ups!
            </p>
          </div>
        </div>

        <button
          onClick={onCreateGoal}
          className="px-4 py-2 rounded-xl bg-[#0057FF] hover:bg-[#0046D1] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Plus size={14} />
          Create Goal
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4 p-4 rounded-3xl bg-white border border-gray-200/80 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-xl bg-blue-50 text-[#0057FF]">
            <Target size={16} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-gray-900">Active Goals</h3>
              <span className="text-[10px] font-bold text-gray-400">
                ({formatCurrency(stats.totalSaved, userProfile?.currency)} saved)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {roundUpSettings.enabled && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
              <Sparkles size={10} className="text-amber-500" />
              Round-up ON
            </span>
          )}

          <button
            onClick={onOpenGoals}
            className="text-xs font-bold text-[#0057FF] hover:text-[#0046D1] flex items-center gap-0.5 cursor-pointer"
          >
            <span>View All ({activeGoals.length})</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel of top active goals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {activeGoals.slice(0, 3).map((goal) => {
          const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) || 0;
          const isGroup = goal.type === 'group';

          return (
            <div
              key={goal.id}
              onClick={onOpenGoals}
              className="p-3 rounded-2xl bg-gray-50/80 hover:bg-gray-100/80 border border-gray-200/70 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base select-none">{goal.icon}</span>
                    <span className="text-xs font-black text-gray-900 truncate max-w-[130px]">
                      {goal.title}
                    </span>
                  </div>
                  {isGroup ? (
                    <Users size={12} className="text-emerald-600" />
                  ) : (
                    <Lock size={11} className="text-[#0057FF]" />
                  )}
                </div>

                <div className="flex items-baseline justify-between text-[11px] mb-1 font-bold">
                  <span className="text-gray-900">
                    {formatCurrency(goal.currentAmount, userProfile?.currency)}
                  </span>
                  <span className="text-gray-400">
                    / {formatCurrency(goal.targetAmount, userProfile?.currency)}
                  </span>
                </div>

                <div className="w-full h-1.5 bg-gray-200/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#0057FF] to-emerald-400 rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold mt-2">
                <span>{percent}% done</span>
                <span>
                  {goal.targetDate
                    ? new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                    : 'Flexible'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
