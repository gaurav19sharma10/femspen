import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Goal, GoalTransaction, SpendingRequest } from '../../types';
import { useGoal } from '../../context/GoalContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Plus,
  Lock,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Play,
  Pause,
  Trash2,
  Check,
  Coins,
  History,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface GoalDetailModalProps {
  goalId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const GoalDetailModal: React.FC<GoalDetailModalProps> = ({
  goalId,
  isOpen,
  onClose,
}) => {
  const {
    goals,
    contributeToGoal,
    requestSpending,
    respondSpendingRequest,
    executeWithdrawal,
    togglePauseGoal,
    closeGoal,
    deleteGoal,
    fetchTransactions,
    transactions,
  } = useGoal();
  const { user, userProfile } = useAuth();

  const goal = goals.find((g) => g.id === goalId);

  // Contribution state
  const [addAmount, setAddAmount] = useState<string>('');
  const [addNotes, setAddNotes] = useState<string>('');
  const [isContributing, setIsContributing] = useState(false);

  // Spending Request Modal state
  const [isSpendModalOpen, setIsSpendModalOpen] = useState(false);
  const [spendAmount, setSpendAmount] = useState<string>('');
  const [spendReason, setSpendReason] = useState<string>('');
  const [spendNotes, setSpendNotes] = useState<string>('');
  const [isSubmittingSpend, setIsSubmittingSpend] = useState(false);

  // Tab: Overview vs Activity
  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview');

  useEffect(() => {
    if (goalId) {
      fetchTransactions(goalId);
    }
  }, [goalId]);

  if (!isOpen || !goal) return null;

  const myUid = user?.uid;
  const isOwner = goal.ownerUid === myUid;
  const isGroup = goal.type === 'group';

  // Progress metrics
  const progressPercent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) || 0;
  const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
  const isCompleted = goal.currentAmount >= goal.targetAmount;

  // Timeline / Transactions
  const goalTxList = transactions[goal.id] || [];

  // Active pending spending requests
  const pendingRequests = (goal.spendingRequests || []).filter((r) => r.status === 'PENDING');
  const pastRequests = (goal.spendingRequests || []).filter((r) => r.status !== 'PENDING');

  // Breakdown of contributions per user (for group goals)
  const memberContributions: Record<string, { name: string; amount: number; photoUrl?: string }> = {};
  if (isGroup) {
    goal.participants.forEach((p) => {
      memberContributions[p.uid] = { name: p.name, amount: 0, photoUrl: p.photoUrl };
    });
    goalTxList.forEach((tx) => {
      if (['MANUAL_CONTRIBUTION', 'DAILY_CONTRIBUTION', 'MONTHLY_CONTRIBUTION', 'ROUND_UP'].includes(tx.type)) {
        if (!memberContributions[tx.userId]) {
          memberContributions[tx.userId] = { name: tx.userName, amount: 0 };
        }
        memberContributions[tx.userId].amount += tx.amount;
      }
    });
  }

  // Handle Add Money
  const handleContribute = async (customAmt?: number) => {
    const amt = customAmt !== undefined ? customAmt : parseFloat(addAmount);
    if (!amt || amt <= 0) return;

    setIsContributing(true);
    try {
      await contributeToGoal(goal.id, amt, 'MANUAL_CONTRIBUTION', undefined, addNotes.trim() || undefined);
      setAddAmount('');
      setAddNotes('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsContributing(false);
    }
  };

  // Handle Spend / Withdraw
  const handleSpendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(spendAmount);
    if (!amt || amt <= 0) return;
    if (amt > goal.currentAmount) {
      alert('Cannot spend more than current goal balance');
      return;
    }
    if (!spendReason.trim()) {
      alert('Please provide a reason for this expenditure');
      return;
    }

    setIsSubmittingSpend(true);
    try {
      if (isGroup) {
        await requestSpending(goal.id, amt, spendReason.trim(), spendNotes.trim() || undefined);
        alert('Spending request submitted to all group members for unanimous approval! 🔐');
      } else {
        await executeWithdrawal(goal.id, amt, spendReason.trim());
      }
      setIsSpendModalOpen(false);
      setSpendAmount('');
      setSpendReason('');
      setSpendNotes('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmittingSpend(false);
    }
  };

  // Handle Voting on spending request
  const handleVote = async (requestId: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      await respondSpendingRequest(goal.id, requestId, decision);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 bg-blue-50 border border-blue-100 rounded-2xl select-none">
              {goal.icon}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-gray-900 leading-tight">{goal.title}</h2>
                {isGroup ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <Users size={11} /> Family Group ({goal.participants.length})
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0057FF] border border-blue-200 flex items-center gap-1">
                    <Lock size={11} /> Private Goal 🔒
                  </span>
                )}
                {goal.status === 'paused' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Paused
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {goal.category} • Created by {goal.ownerName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Pause / Resume button */}
            <button
              onClick={() => togglePauseGoal(goal.id)}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              title={goal.status === 'paused' ? 'Resume Goal' : 'Pause Goal'}
            >
              {goal.status === 'paused' ? <Play size={17} /> : <Pause size={17} />}
            </button>

            {/* Delete / Close Goal (owner only) */}
            {isOwner && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this goal?')) {
                    deleteGoal(goal.id);
                    onClose();
                  }
                }}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                title="Delete Goal"
              >
                <Trash2 size={17} />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 px-6 bg-white text-xs font-bold text-gray-500">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-[#0057FF] text-[#0057FF]'
                : 'border-transparent hover:text-gray-900'
            }`}
          >
            <Sparkles size={14} />
            Overview & Save
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'activity'
                ? 'border-[#0057FF] text-[#0057FF]'
                : 'border-transparent hover:text-gray-900'
            }`}
          >
            <History size={14} />
            Activity Log ({goalTxList.length})
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-gray-700">
          {activeTab === 'overview' ? (
            <>
              {/* 100% Completion Celebration Banner */}
              {isCompleted && (
                <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🎉</span>
                    <div>
                      <h3 className="font-black text-base">Goal Achieved!</h3>
                      <p className="text-xs text-emerald-100">
                        You hit the target of {formatCurrency(goal.targetAmount, userProfile?.currency)}!
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsSpendModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-white text-emerald-800 text-xs font-bold shadow-md hover:bg-emerald-50 transition-colors cursor-pointer"
                    >
                      Spend Money
                    </button>
                  </div>
                </div>
              )}

              {/* Pending Group Spending Requests Banner (Unanimous Approval Roster) */}
              {isGroup && pendingRequests.length > 0 && (
                <div className="space-y-3">
                  {pendingRequests.map((req) => {
                    const approvedCount = Object.values(req.approvals).filter((v) => v === 'APPROVED').length;
                    const totalParticipants = goal.participantUids.length;
                    const hasMyVote = req.approvals[myUid || ''] && req.approvals[myUid || ''] !== 'PENDING';
                    const isRejected = Object.values(req.approvals).some((v) => v === 'REJECTED');

                    return (
                      <div
                        key={req.id}
                        className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 shadow-xs space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-amber-200/70 text-amber-800">
                              <ShieldCheck size={16} />
                            </span>
                            <div>
                              <h4 className="text-xs font-black text-amber-900">
                                Spending Request: {formatCurrency(req.amount, userProfile?.currency)}
                              </h4>
                              <p className="text-[11px] text-amber-700">
                                Reason: <span className="font-semibold">{req.reason}</span> • Requested by{' '}
                                <span className="font-semibold">{req.requestedByName}</span>
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                            {approvedCount}/{totalParticipants} Approved
                          </span>
                        </div>

                        {/* Approval Roster */}
                        <div className="pt-2 border-t border-amber-200/60 flex flex-wrap gap-2 text-xs">
                          {goal.participants.map((p) => {
                            const status = req.approvals[p.uid] || 'PENDING';
                            return (
                              <div
                                key={p.uid}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border ${
                                  status === 'APPROVED'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : status === 'REJECTED'
                                    ? 'bg-red-100 text-red-800 border-red-300'
                                    : 'bg-white text-gray-600 border-gray-200'
                                }`}
                              >
                                <span>{p.name}:</span>
                                <span>
                                  {status === 'APPROVED' && '✓ Approved'}
                                  {status === 'REJECTED' && '✕ Rejected'}
                                  {status === 'PENDING' && '⏳ Waiting'}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Action buttons for current user if not yet voted */}
                        {!hasMyVote && !isRejected && (
                          <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
                            <span className="text-[11px] text-amber-800 font-semibold">
                              Everyone must approve before money is released:
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleVote(req.id, 'APPROVED')}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Check size={14} /> Approve
                              </button>
                              <button
                                onClick={() => handleVote(req.id, 'REJECTED')}
                                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <X size={14} /> Reject
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Visual Progress Dashboard Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-gray-900 to-blue-950 text-white shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                      Saved Amount
                    </span>
                    <span className="text-3xl font-black text-white">
                      {formatCurrency(goal.currentAmount, userProfile?.currency)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                      Target
                    </span>
                    <span className="text-xl font-bold text-gray-300">
                      {formatCurrency(goal.targetAmount, userProfile?.currency)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden p-0.5">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
                    <span>{progressPercent}% Complete</span>
                    <span>
                      {remainingAmount > 0
                        ? `${formatCurrency(remainingAmount, userProfile?.currency)} remaining`
                        : 'Target reached! 🎉'}
                    </span>
                  </div>
                </div>

                {/* Deadline & Pace Footer */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-300">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-blue-400" />
                    <span>
                      {goal.targetDate
                        ? `Target: ${new Date(goal.targetDate).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric',
                          })}`
                        : 'No deadline'}
                    </span>
                  </div>

                  {remainingAmount > 0 && goal.targetDate && (
                    <span className="text-emerald-400 font-bold">
                      ~₹{Math.ceil(remainingAmount / Math.max(1, (new Date(goal.targetDate).getFullYear() - new Date().getFullYear()) * 12 + (new Date(goal.targetDate).getMonth() - new Date().getMonth()))).toLocaleString()}/mo needed
                    </span>
                  )}
                </div>
              </div>

              {/* Smart Goal Insights (Section 17) */}
              {(() => {
                const totalContributed = goal.currentAmount;
                const isTargetReached = totalContributed >= goal.targetAmount;
                if (isTargetReached) return null;

                let insightMsg = '';
                let insightIcon = '💡';
                let insightClass = 'bg-blue-50/80 border-blue-200/80 text-blue-900';

                if (goal.targetDate) {
                  const today = new Date();
                  const target = new Date(goal.targetDate);
                  const monthsLeft = Math.max(1, (target.getFullYear() - today.getFullYear()) * 12 + (target.getMonth() - today.getMonth()));
                  const neededPerMonth = Math.ceil(remainingAmount / monthsLeft);

                  if (goal.currentAmount >= (goal.targetAmount / 2) && monthsLeft > 6) {
                    insightIcon = '🚀';
                    insightMsg = `Great! You're ahead of your target. Keeping this pace will achieve the goal well before ${target.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}.`;
                    insightClass = 'bg-emerald-50/80 border-emerald-200/80 text-emerald-900';
                  } else if (monthsLeft <= 2 && remainingAmount > (neededPerMonth * 1.5)) {
                    insightIcon = '⚠️';
                    insightMsg = `You're slightly behind your planned savings. Adding ₹${Math.ceil(neededPerMonth * 0.25).toLocaleString()} more this month will keep you on track.`;
                    insightClass = 'bg-amber-50/80 border-amber-200/80 text-amber-900';
                  } else {
                    insightIcon = '💡';
                    insightMsg = `You need ₹${neededPerMonth.toLocaleString()}/month. At this rate, you'll reach your goal in approximately ${monthsLeft} month${monthsLeft > 1 ? 's' : ''}.`;
                  }
                } else {
                  insightIcon = '🌱';
                  insightMsg = `Flexible goal with no strict deadline. Every spare-change round-up and manual deposit moves you closer!`;
                }

                return (
                  <div className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs ${insightClass}`}>
                    <span className="text-base select-none mt-0.5">{insightIcon}</span>
                    <div className="flex-1">
                      <span className="font-bold block mb-0.5 uppercase tracking-wider text-[10px]">
                        Smart Goal Insight
                      </span>
                      <p className="font-medium leading-relaxed">{insightMsg}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Add Money Section */}
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                    <Coins size={16} className="text-[#0057FF]" />
                    Add Money to Goal
                  </h3>
                  <button
                    onClick={() => setIsSpendModalOpen(true)}
                    className="text-xs font-bold text-gray-600 hover:text-gray-900 underline cursor-pointer"
                  >
                    {isGroup ? 'Request Withdrawal' : 'Withdraw / Spend'}
                  </button>
                </div>

                {/* Quick Chips */}
                <div className="grid grid-cols-4 gap-2">
                  {[100, 500, 1000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      disabled={isContributing}
                      onClick={() => handleContribute(amt)}
                      className="py-2 px-1 rounded-xl bg-white border border-gray-200 hover:border-[#0057FF] hover:bg-blue-50/50 text-xs font-bold text-gray-800 transition-all cursor-pointer shadow-2xs"
                    >
                      +₹{amt.toLocaleString()}
                    </button>
                  ))}
                </div>

                {/* Custom Amount Input & Submit */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-2.5 text-sm font-bold text-gray-400">₹</span>
                    <input
                      type="number"
                      placeholder="Custom amount..."
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0057FF]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleContribute()}
                    disabled={isContributing || !addAmount}
                    className="px-5 py-2 rounded-xl bg-[#0057FF] hover:bg-[#0046D1] disabled:bg-gray-300 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    {isContributing ? 'Adding...' : 'Add Money'}
                  </button>
                </div>
              </div>

              {/* Group Goal Contributors Roster (Who contributed what) */}
              {isGroup && (
                <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-3">
                  <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center justify-between">
                    <span>Family Contributions</span>
                    <span className="text-[11px] text-gray-500 font-normal">
                      {goal.participants.length} contributors
                    </span>
                  </h3>

                  <div className="space-y-2.5">
                    {Object.entries(memberContributions).map(([uid, info]) => {
                      const sharePercent =
                        goal.currentAmount > 0 ? Math.round((info.amount / goal.currentAmount) * 100) : 0;
                      return (
                        <div key={uid} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-gray-800">{info.name}</span>
                            <span className="font-extrabold text-gray-900">
                              {formatCurrency(info.amount, userProfile?.currency)}{' '}
                              <span className="text-[10px] text-gray-400 font-normal">({sharePercent}%)</span>
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${sharePercent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ACTIVITY LOG TAB */
            <div className="space-y-3">
              {goalTxList.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <History size={36} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No activity recorded yet for this goal.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {goalTxList.map((tx) => (
                    <div key={tx.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            tx.type === 'ROUND_UP'
                              ? 'bg-amber-100 text-amber-700'
                              : tx.type === 'WITHDRAWAL' || tx.type === 'SPENDING_APPROVED'
                              ? 'bg-red-100 text-red-700'
                              : tx.type === 'SPENDING_REQUEST'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {tx.type === 'ROUND_UP' && <Sparkles size={14} />}
                          {tx.type === 'MANUAL_CONTRIBUTION' && <Plus size={14} />}
                          {(tx.type === 'WITHDRAWAL' || tx.type === 'SPENDING_APPROVED') && <ArrowUpRight size={14} />}
                          {tx.type === 'SPENDING_REQUEST' && <ShieldCheck size={14} />}
                          {tx.type === 'SPENDING_REJECTED' && <X size={14} />}
                        </span>

                        <div>
                          <p className="font-bold text-gray-900 leading-snug">
                            {tx.type === 'ROUND_UP' && (
                              <span>
                                {tx.userName} saved {formatCurrency(tx.amount, userProfile?.currency)} spare change
                              </span>
                            )}
                            {tx.type === 'MANUAL_CONTRIBUTION' && (
                              <span>
                                {tx.userName} added {formatCurrency(tx.amount, userProfile?.currency)}
                              </span>
                            )}
                            {tx.type === 'SPENDING_REQUEST' && (
                              <span>
                                {tx.userName} requested withdrawal of {formatCurrency(tx.amount, userProfile?.currency)}
                              </span>
                            )}
                            {tx.type === 'SPENDING_APPROVED' && (
                              <span>
                                Withdrawal of {formatCurrency(tx.amount, userProfile?.currency)} unanimously approved
                              </span>
                            )}
                            {tx.type === 'SPENDING_REJECTED' && (
                              <span>
                                Withdrawal of {formatCurrency(tx.amount, userProfile?.currency)} rejected
                              </span>
                            )}
                            {tx.type === 'WITHDRAWAL' && (
                              <span>
                                {tx.userName} withdrew {formatCurrency(tx.amount, userProfile?.currency)}
                              </span>
                            )}
                          </p>
                          {tx.notes && <p className="text-[11px] text-gray-500 mt-0.5">{tx.notes}</p>}
                          <span className="text-[10px] text-gray-400 block mt-1">
                            {new Date(tx.timestamp).toLocaleString('en-US', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`font-black shrink-0 ${
                          tx.type === 'WITHDRAWAL' || tx.type === 'SPENDING_APPROVED'
                            ? 'text-red-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {tx.type === 'WITHDRAWAL' || tx.type === 'SPENDING_APPROVED' ? '-' : '+'}
                        {formatCurrency(tx.amount, userProfile?.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SPENDING REQUEST / WITHDRAWAL MODAL */}
        <AnimatePresence>
          {isSpendModalOpen && (
            <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-gray-900 text-base">
                    {isGroup ? 'Request Group Spending' : 'Spend Goal Savings'}
                  </h3>
                  <button
                    onClick={() => setIsSpendModalOpen(false)}
                    className="p-1 text-gray-400 hover:text-gray-700 rounded-full"
                  >
                    <X size={18} />
                  </button>
                </div>

                {isGroup && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-start gap-2">
                    <ShieldCheck size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      🔐 <strong>Group Goal Rule:</strong> Every participant in this goal must approve this request before
                      any money is released.
                    </span>
                  </div>
                )}

                <form onSubmit={handleSpendSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Amount to Spend * (Available: {formatCurrency(goal.currentAmount, userProfile?.currency)})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-sm font-bold text-gray-400">₹</span>
                      <input
                        type="number"
                        max={goal.currentAmount}
                        placeholder="20,000"
                        value={spendAmount}
                        onChange={(e) => setSpendAmount(e.target.value)}
                        required
                        className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#0057FF]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Reason / What is this money for? *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hotel booking, Tuition fee, Car down payment..."
                      value={spendReason}
                      onChange={(e) => setSpendReason(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-800 focus:outline-none focus:border-[#0057FF]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Optional Notes
                    </label>
                    <textarea
                      placeholder="Additional details for family members..."
                      value={spendNotes}
                      onChange={(e) => setSpendNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-[#0057FF]"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSpendModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-gray-600 font-bold hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingSpend}
                      className="px-5 py-2.5 rounded-xl bg-[#0057FF] hover:bg-[#0046D1] text-white font-bold shadow-md shadow-[#0057FF]/30"
                    >
                      {isSubmittingSpend
                        ? 'Submitting...'
                        : isGroup
                        ? 'Request Approval'
                        : 'Release Funds'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
