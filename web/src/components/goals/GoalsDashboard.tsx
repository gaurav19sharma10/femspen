import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoal } from '../../context/GoalContext';
import { useAuth } from '../../context/AuthContext';
import { Goal } from '../../types';
import {
  Target,
  Plus,
  Sparkles,
  Lock,
  Users,
  Calendar,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  X,
  Coins,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { CreateGoalWizard } from './CreateGoalWizard';
import { GoalDetailModal } from './GoalDetailModal';
import { AutomaticSavingsModal } from './AutomaticSavingsModal';

interface GoalsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoalsDashboard: React.FC<GoalsDashboardProps> = ({ isOpen, onClose }) => {
  const {
    goals,
    activeGoals,
    completedGoals,
    individualGoals,
    groupGoals,
    stats,
    pendingApprovalCount,
  } = useGoal();
  const { userProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'all' | 'individual' | 'group' | 'completed'>('all');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isAutoSavingsOpen, setIsAutoSavingsOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filtered goals based on tab
  const displayedGoals = goals.filter((g) => {
    if (activeTab === 'individual') return g.type === 'individual' && g.status !== 'closed';
    if (activeTab === 'group') return g.type === 'group' && g.status !== 'closed';
    if (activeTab === 'completed') return g.status === 'completed';
    return g.status !== 'closed';
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-[#F8F7F4] rounded-3xl max-w-5xl w-full shadow-2xl border border-gray-200/80 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Top Header */}
        <div className="px-6 py-4.5 bg-white border-b border-gray-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0057FF]/10 text-[#0057FF] flex items-center justify-center font-bold text-xl shadow-inner">
              🎯
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-gray-900 leading-tight">Goals</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0057FF] border border-blue-200 uppercase tracking-wider">
                  Target Savings
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Save toward future objectives, individually or together with family
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setIsAutoSavingsOpen(true)}
              className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Configure Round-Ups & Schedules"
            >
              <Sparkles size={14} className="text-amber-600" />
              <span>Automatic Savings</span>
            </button>

            <button
              onClick={() => setIsWizardOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#0057FF] hover:bg-[#0046D1] text-white text-xs font-bold shadow-md shadow-[#0057FF]/25 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Create Goal</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Dashboard Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-gray-700">
          {/* Pending Approval Alert Banner */}
          {pendingApprovalCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 shadow-xs flex items-center justify-between gap-3 text-amber-900"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-amber-200/70 text-amber-800">
                  <ShieldCheck size={20} />
                </span>
                <div>
                  <h4 className="font-bold text-xs">
                    {pendingApprovalCount} Withdrawal Request{pendingApprovalCount > 1 ? 's' : ''} Pending Your Approval
                  </h4>
                  <p className="text-[11px] text-amber-700">
                    Group goal funds cannot be spent until every participating family member approves.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('group')}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer transition-colors shrink-0"
              >
                Review Requests
              </button>
            </motion.div>
          )}

          {/* Top Summary Metrics Bar (Section 7 of Prompt) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Saved */}
            <div className="p-4 rounded-2xl bg-white border border-gray-200/70 shadow-2xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Total Saved
              </span>
              <span className="text-xl sm:text-2xl font-black text-gray-900 mt-1 block">
                {formatCurrency(stats.totalSaved, userProfile?.currency)}
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                <TrendingUp size={12} /> Across all goals
              </span>
            </div>

            {/* Active Goals */}
            <div className="p-4 rounded-2xl bg-white border border-gray-200/70 shadow-2xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Active Goals
              </span>
              <span className="text-xl sm:text-2xl font-black text-gray-900 mt-1 block">
                {stats.activeGoalsCount}
              </span>
              <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 mt-1">
                <Target size={12} /> {completedGoals.length} completed
              </span>
            </div>

            {/* Saved This Month */}
            <div className="p-4 rounded-2xl bg-white border border-gray-200/70 shadow-2xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Saved This Month
              </span>
              <span className="text-xl sm:text-2xl font-black text-[#0057FF] mt-1 block">
                {formatCurrency(stats.savedThisMonth, userProfile?.currency)}
              </span>
              <span className="text-[11px] text-gray-500 font-medium mt-1 block">
                Current billing cycle
              </span>
            </div>

            {/* Round-ups This Month */}
            <div className="p-4 rounded-2xl bg-white border border-gray-200/70 shadow-2xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Round-ups This Month
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-600 mt-1 block">
                {formatCurrency(stats.roundUpsThisMonth, userProfile?.currency)}
              </span>
              <span className="text-[11px] text-amber-700/80 font-semibold flex items-center gap-1 mt-1">
                <Sparkles size={12} /> Spare change saved
              </span>
            </div>
          </div>

          {/* Tab Filter Navigation */}
          <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
            {[
              { id: 'all', label: 'All Goals', count: goals.length },
              { id: 'individual', label: 'My Goals 🔒', count: individualGoals.length },
              { id: 'group', label: 'Family Goals 👨‍👩‍👧‍👦', count: groupGoals.length },
              { id: 'completed', label: 'Completed 🎉', count: completedGoals.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-[#0057FF] text-white shadow-xs'
                    : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200/80'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Goal Cards Grid (Section 8 of Prompt) */}
          {displayedGoals.length === 0 ? (
            /* Empty State */
            <div className="p-8 sm:p-12 text-center bg-white rounded-3xl border border-dashed border-gray-300 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#0057FF] flex items-center justify-center text-3xl mx-auto shadow-inner">
                🎯
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-black text-gray-900">
                  {activeTab === 'completed'
                    ? 'No completed goals yet'
                    : 'Start saving toward your dreams!'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Create a dedicated goal for school fees, family trips, a new gadget, or emergencies.
                  Watch small savings compound effortlessly!
                </p>
              </div>

              {/* Suggested Goal Ideas */}
              <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto pt-2">
                {[
                  { name: '🎓 School Fees', amt: '₹25,000' },
                  { name: '🏖️ Family Trip', amt: '₹50,000' },
                  { name: '📱 New Phone', amt: '₹30,000' },
                  { name: '🚗 New Car', amt: '₹5,00,000' },
                  { name: '💰 Emergency Fund', amt: '₹50,000' },
                ].map((idea) => (
                  <span
                    key={idea.name}
                    className="px-3 py-1 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700"
                  >
                    {idea.name} ({idea.amt})
                  </span>
                ))}
              </div>

              <div className="pt-3">
                <button
                  onClick={() => setIsWizardOpen(true)}
                  className="px-6 py-2.5 rounded-2xl bg-[#0057FF] hover:bg-[#0046D1] text-white text-xs font-bold shadow-lg shadow-[#0057FF]/30 transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <Plus size={16} />
                  <span>Create Your First Goal</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedGoals.map((goal) => {
                const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) || 0;
                const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
                const isGroup = goal.type === 'group';

                return (
                  <motion.div
                    key={goal.id}
                    layout
                    whileHover={{ y: -3 }}
                    onClick={() => setSelectedGoalId(goal.id)}
                    className="p-5 rounded-3xl bg-white border border-gray-200/90 hover:border-[#0057FF]/50 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      {/* Card Top: Icon & Type Badge */}
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-2xl p-2 rounded-2xl bg-gray-50 border border-gray-100 select-none group-hover:scale-110 transition-transform">
                          {goal.icon}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {isGroup ? (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                              <Users size={11} />
                              <span>{goal.participants.length}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-[#0057FF] border border-blue-200 text-[10px] font-bold">
                              <Lock size={10} />
                              <span>Private 🔒</span>
                            </div>
                          )}

                          {goal.status === 'completed' && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                              Completed 🎉
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Goal Title & Category */}
                      <h3 className="font-black text-gray-900 text-base leading-tight group-hover:text-[#0057FF] transition-colors">
                        {goal.title}
                      </h3>
                      <span className="text-[11px] text-gray-400 font-semibold block mb-3">
                        {goal.category}
                      </span>

                      {/* Amounts */}
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-lg font-black text-gray-900">
                          {formatCurrency(goal.currentAmount, userProfile?.currency)}
                        </span>
                        <span className="text-xs font-bold text-gray-400">
                          / {formatCurrency(goal.targetAmount, userProfile?.currency)}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden mb-2">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#0057FF] to-emerald-400 transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      {/* Progress Text & Remaining */}
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-[#0057FF] font-bold">{percent}%</span>
                        <span className="text-gray-500">
                          {remaining > 0
                            ? `${formatCurrency(remaining, userProfile?.currency)} remaining`
                            : 'Achieved! 🎉'}
                        </span>
                      </div>
                    </div>

                    {/* Card Footer: Deadline & Avatar stack */}
                    <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-gray-400" />
                        <span>
                          {goal.targetDate
                            ? new Date(goal.targetDate).toLocaleDateString('en-US', {
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'No deadline'}
                        </span>
                      </div>

                      {isGroup ? (
                        <div className="flex items-center -space-x-1.5">
                          {goal.participants.slice(0, 4).map((p, idx) => (
                            <div
                              key={p.uid || idx}
                              title={p.name}
                              className="w-5 h-5 rounded-full bg-blue-100 text-[#0057FF] border border-white text-[9px] font-bold flex items-center justify-center overflow-hidden"
                            >
                              {p.photoUrl ? (
                                <img src={p.photoUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                p.name[0]?.toUpperCase()
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          Owner: You
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Goal Creation Wizard Modal */}
      <CreateGoalWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onGoalCreated={(newId) => {
          setSelectedGoalId(newId);
        }}
      />

      {/* Automatic Savings Settings Modal */}
      {isAutoSavingsOpen && (
        <AutomaticSavingsModal onClose={() => setIsAutoSavingsOpen(false)} />
      )}

      {/* Goal Detail Modal */}
      {selectedGoalId && (
        <GoalDetailModal
          goalId={selectedGoalId}
          isOpen={Boolean(selectedGoalId)}
          onClose={() => setSelectedGoalId(null)}
        />
      )}
    </div>
  );
};
