import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GoalType,
  GoalFundingMethod,
  GoalParticipant,
  FamilyMember,
  GOAL_CATEGORIES,
  POPULAR_GOAL_EMOJIS,
} from '../../types';
import { useGoal } from '../../context/GoalContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Calendar,
  Lock,
  Users,
  User,
  Sparkles,
  Coins,
  Clock,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface CreateGoalWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onGoalCreated?: (goalId: string) => void;
}

export const CreateGoalWizard: React.FC<CreateGoalWizardProps> = ({
  isOpen,
  onClose,
  onGoalCreated,
}) => {
  const { createGoal } = useGoal();
  const { user, userProfile, family } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Identity & Category
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('🎓');
  const [category, setCategory] = useState('Education');
  const [customCategory, setCustomCategory] = useState('');

  // Step 2: Target & Timeline
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>('');

  // Step 3: Type & Members
  const [goalType, setGoalType] = useState<GoalType>('individual');
  const [selectedMemberUids, setSelectedMemberUids] = useState<string[]>([user?.uid || '']);

  // Step 4: Funding Strategy
  const [manual, setManual] = useState(true);
  const [enableDaily, setEnableDaily] = useState(false);
  const [dailyAmount, setDailyAmount] = useState('100');
  const [enableMonthly, setEnableMonthly] = useState(false);
  const [monthlyAmount, setMonthlyAmount] = useState('3000');
  const [monthlyDay, setMonthlyDay] = useState(5);
  const [enableRoundUp, setEnableRoundUp] = useState(true);

  if (!isOpen) return null;

  // Calculate monthly needed pace for Step 2
  const parsedTarget = parseFloat(targetAmount) || 0;
  let monthsRemaining = 0;
  let monthlyNeeded = 0;

  if (targetDate && parsedTarget > 0) {
    const today = new Date();
    const target = new Date(targetDate);
    const diffMonths = (target.getFullYear() - today.getFullYear()) * 12 + (target.getMonth() - today.getMonth());
    monthsRemaining = Math.max(1, diffMonths);
    monthlyNeeded = Math.ceil(parsedTarget / monthsRemaining);
  }

  // Handle member toggle for Group Goal
  const toggleMember = (uid: string) => {
    if (uid === user?.uid) return; // Creator cannot uncheck themselves
    if (selectedMemberUids.includes(uid)) {
      setSelectedMemberUids(selectedMemberUids.filter((id) => id !== uid));
    } else {
      setSelectedMemberUids([...selectedMemberUids, uid]);
    }
  };

  const handleNext = () => {
    if (step === 1 && !title.trim()) return;
    if (step === 2 && parsedTarget <= 0) return;
    setStep((prev) => Math.min(5, prev + 1));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    if (!title.trim() || parsedTarget <= 0) return;
    setIsSubmitting(true);

    try {
      const finalCategory = customCategory.trim() || category;

      // Prepare participants
      const participants: GoalParticipant[] = [];
      const currentUid = user?.uid || 'user';
      const currentName = userProfile?.displayName || userProfile?.email || 'Me';

      participants.push({
        uid: currentUid,
        name: currentName,
        photoUrl: userProfile?.photoUrl,
        role: 'owner',
      });

      if (goalType === 'group' && family?.members) {
        family.members.forEach((m: FamilyMember) => {
          if (m.uid !== currentUid && selectedMemberUids.includes(m.uid)) {
            participants.push({
              uid: m.uid,
              name: m.displayName,
              photoUrl: m.photoUrl,
              role: 'contributor',
            });
          }
        });
      }

      const fundingMethod: GoalFundingMethod = {
        manual,
        dailySaving: enableDaily
          ? {
              enabled: true,
              amount: parseFloat(dailyAmount) || 100,
            }
          : undefined,
        monthlySaving: enableMonthly
          ? {
              enabled: true,
              amount: parseFloat(monthlyAmount) || 3000,
              dayOfMonth: monthlyDay,
            }
          : undefined,
        roundUpSaving: {
          enabled: enableRoundUp,
        },
      };

      const newGoalId = await createGoal({
        title: title.trim(),
        icon,
        category: finalCategory,
        targetAmount: parsedTarget,
        targetDate: targetDate || undefined,
        type: goalType,
        ownerUid: currentUid,
        ownerName: currentName,
        participantUids: goalType === 'group' ? selectedMemberUids : [currentUid],
        participants,
        familyId: goalType === 'group' ? userProfile?.familyId : undefined,
        fundingMethod,
      });

      if (onGoalCreated) {
        onGoalCreated(newGoalId);
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to create goal:', err);
      alert('Could not create goal: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Wizard Header & Progress Bar */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-[#0057FF]/10 text-[#0057FF] flex items-center justify-center font-bold text-xs">
                {step}/5
              </span>
              <div>
                <h2 className="text-base font-black text-gray-900 leading-tight">
                  {step === 1 && 'What are you saving for?'}
                  {step === 2 && 'Set the Target'}
                  {step === 3 && 'Who is saving for this goal?'}
                  {step === 4 && 'How would you like to save?'}
                  {step === 5 && 'Review & Confirm'}
                </h2>
                <p className="text-[11px] text-gray-500">
                  {step === 1 && 'Step 1: Choose a name, icon, and category'}
                  {step === 2 && 'Step 2: Choose target amount and optional deadline'}
                  {step === 3 && 'Step 3: Keep it private or share with family'}
                  {step === 4 && 'Step 4: Pick funding rules and round-up savings'}
                  {step === 5 && 'Step 5: Ready to launch your new Goal'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Stepper Dots */}
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s <= step ? 'bg-[#0057FF]' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Wizard Step Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-gray-700">
          <AnimatePresence mode="wait">
            {/* STEP 1: What are you saving for? */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                {/* Goal Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Goal Name *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xl select-none">{icon}</span>
                    <input
                      type="text"
                      placeholder="e.g. School Fees, Family Trip, New Phone, Car..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      autoFocus
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200/90 rounded-2xl text-base font-bold text-gray-900 focus:outline-none focus:bg-white focus:border-[#0057FF] focus:ring-2 focus:ring-[#0057FF]/20"
                    />
                  </div>
                </div>

                {/* Popular Emojis */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Select Icon / Emoji
                  </label>
                  <div className="flex flex-wrap gap-2 p-2.5 bg-gray-50/70 border border-gray-200/60 rounded-2xl">
                    {POPULAR_GOAL_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setIcon(emoji)}
                        className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer ${
                          icon === emoji
                            ? 'bg-[#0057FF] text-white shadow-md scale-110'
                            : 'bg-white hover:bg-gray-100 text-gray-800'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Suggested Categories */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Category
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {GOAL_CATEGORIES.map((cat) => {
                      const isSelected = category === cat.name && !customCategory;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setCategory(cat.name);
                            setIcon(cat.icon);
                            setCustomCategory('');
                          }}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#0057FF] bg-blue-50/50 text-[#0057FF] font-bold shadow-xs'
                              : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                          }`}
                        >
                          <span className="text-base">{cat.icon}</span>
                          <span className="text-xs truncate">{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Category Input */}
                  <div className="mt-2.5">
                    <input
                      type="text"
                      placeholder="Or enter custom category name..."
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-[#0057FF]"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Set the Target */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                {/* Target Amount */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Target Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-2xl font-black text-gray-400">₹</span>
                    <input
                      type="number"
                      placeholder="50,000"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      autoFocus
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200/90 rounded-2xl text-2xl font-black text-gray-900 focus:outline-none focus:bg-white focus:border-[#0057FF] focus:ring-2 focus:ring-[#0057FF]/20"
                    />
                  </div>

                  {/* Quick Amount Chips */}
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {[10000, 25000, 50000, 100000, 500000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTargetAmount(String(amt))}
                        className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                      >
                        ₹{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Target Date */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Target Date (Optional)
                  </label>
                  <div className="relative">
                    <Calendar size={18} className="absolute left-3.5 top-3 text-gray-400" />
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#0057FF]"
                    />
                  </div>
                </div>

                {/* Smart Goal Pace Feedback Banner */}
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/60 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0057FF]/10 text-[#0057FF] flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    {targetDate && monthlyNeeded > 0 ? (
                      <>
                        <h4 className="text-xs font-bold text-gray-900">
                          You need ₹{monthlyNeeded.toLocaleString()}/month to reach this goal.
                        </h4>
                        <p className="text-[11px] text-gray-600 mt-0.5">
                          In {monthsRemaining} month{monthsRemaining > 1 ? 's' : ''} by{' '}
                          {new Date(targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}.
                        </p>
                      </>
                    ) : (
                      <>
                        <h4 className="text-xs font-bold text-gray-900">No deadline — save whenever you can.</h4>
                        <p className="text-[11px] text-gray-600 mt-0.5">
                          Set your own pace with automatic round-ups and spare change.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Individual vs Group */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                    Who is saving for this goal?
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Option: Just Me */}
                    <button
                      type="button"
                      onClick={() => setGoalType('individual')}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        goalType === 'individual'
                          ? 'border-[#0057FF] bg-blue-50/50 shadow-md ring-2 ring-[#0057FF]/20'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="w-10 h-10 rounded-2xl bg-blue-100 text-[#0057FF] flex items-center justify-center font-bold text-lg mb-3">
                          🙋
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm">Just Me</h3>
                        <p className="text-[11px] text-gray-500 mt-1">
                          Private goal. Only you can view, add money, track, and withdraw. Other family members
                          cannot see this.
                        </p>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-[#0057FF]">
                        <Lock size={12} />
                        <span>Private Goal 🔒</span>
                      </div>
                    </button>

                    {/* Option: With Family */}
                    <button
                      type="button"
                      onClick={() => setGoalType('group')}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        goalType === 'group'
                          ? 'border-[#0057FF] bg-blue-50/50 shadow-md ring-2 ring-[#0057FF]/20'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg mb-3">
                          👨‍👩‍👧‍👦
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm">With Family</h3>
                        <p className="text-[11px] text-gray-500 mt-1">
                          Shared goal with selected family members. All members see progress. Spending requires 100%
                          unanimous approval.
                        </p>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                        <ShieldCheck size={13} />
                        <span>Unanimous Approval Required</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* If Group Goal selected */}
                {goalType === 'group' && (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Select Participating Family Members:
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {selectedMemberUids.length} selected
                      </span>
                    </div>

                    {!userProfile?.familyId ? (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                        <AlertCircle size={16} />
                        <span>You have not created or joined a family yet in Profile. Create a family to invite members!</span>
                      </div>
                    ) : family?.members && family.members.length > 0 ? (
                      <div className="space-y-2">
                        {family.members.map((member: FamilyMember) => {
                          const isCreator = member.uid === user?.uid;
                          const isChecked = selectedMemberUids.includes(member.uid);
                          return (
                            <label
                              key={member.uid}
                              className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-colors ${
                                isChecked ? 'bg-white border-blue-200 shadow-xs' : 'bg-gray-100/70 border-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-blue-100 text-[#0057FF] font-bold text-xs flex items-center justify-center overflow-hidden">
                                  {member.photoUrl ? (
                                    <img src={member.photoUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    member.displayName[0]?.toUpperCase()
                                  )}
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-gray-900 block">
                                    {member.displayName} {isCreator && '(You - Owner)'}
                                  </span>
                                  <span className="text-[10px] text-gray-500 capitalize">
                                    {member.role === 'head' ? '👑 Head of Family' : 'Member'}
                                  </span>
                                </div>
                              </div>

                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={isCreator}
                                onChange={() => toggleMember(member.uid)}
                                className="w-4 h-4 text-[#0057FF] rounded-md focus:ring-[#0057FF]"
                              />
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No other family members in your household yet.</p>
                    )}

                    <p className="text-[11px] text-gray-500 italic">
                      🔐 Only selected members become participants in this goal. Spending requires everyone to approve.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 4: How would you like to save? */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                    Funding Methods (Choose any or all)
                  </label>

                  {/* Option A: Manual */}
                  <div className="p-3.5 bg-white border border-gray-200 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#0057FF] flex items-center justify-center">
                        <Coins size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">Add Money Manually</h4>
                        <p className="text-[11px] text-gray-500">Transfer any amount whenever you wish</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#0057FF] bg-blue-50 px-2 py-1 rounded-lg">
                      Always Active
                    </span>
                  </div>

                  {/* Option B: Daily Saving */}
                  <div className="p-3.5 bg-white border border-gray-200 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <Clock size={18} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900">Daily Saving</h4>
                          <p className="text-[11px] text-gray-500">Commit a small daily amount</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={enableDaily}
                        onChange={(e) => setEnableDaily(e.target.checked)}
                        className="w-4 h-4 text-[#0057FF] rounded-md focus:ring-[#0057FF]"
                      />
                    </div>

                    {enableDaily && (
                      <div className="pl-12 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Save</span>
                          <div className="relative w-28">
                            <span className="absolute left-2.5 top-1.5 text-xs text-gray-400">₹</span>
                            <input
                              type="number"
                              value={dailyAmount}
                              onChange={(e) => setDailyAmount(e.target.value)}
                              className="w-full pl-6 pr-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                            />
                          </div>
                          <span className="text-xs text-gray-500">every day</span>
                        </div>
                        <p className="text-[11px] text-emerald-600 font-semibold">
                          💡 Est. ₹{(parseFloat(dailyAmount || '0') * 30).toLocaleString()}/month, ₹
                          {(parseFloat(dailyAmount || '0') * 365).toLocaleString()}/year!
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Option C: Monthly Saving */}
                  <div className="p-3.5 bg-white border border-gray-200 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900">Monthly Saving</h4>
                          <p className="text-[11px] text-gray-500">Automated recurring monthly deposit</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={enableMonthly}
                        onChange={(e) => setEnableMonthly(e.target.checked)}
                        className="w-4 h-4 text-[#0057FF] rounded-md focus:ring-[#0057FF]"
                      />
                    </div>

                    {enableMonthly && (
                      <div className="pl-12 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Save</span>
                        <div className="relative w-28">
                          <span className="absolute left-2.5 top-1.5 text-xs text-gray-400">₹</span>
                          <input
                            type="number"
                            value={monthlyAmount}
                            onChange={(e) => setMonthlyAmount(e.target.value)}
                            className="w-full pl-6 pr-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                          />
                        </div>
                        <span className="text-xs text-gray-500">on day</span>
                        <select
                          value={monthlyDay}
                          onChange={(e) => setMonthlyDay(parseInt(e.target.value))}
                          className="p-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                        >
                          {[1, 5, 10, 15, 20, 25, 28].map((d) => (
                            <option key={d} value={d}>
                              {d}th
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Option D: Round-Up Savings */}
                  <div className="p-3.5 bg-amber-50/50 border border-amber-200/60 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">Round-Up Savings</h4>
                        <p className="text-[11px] text-gray-600">
                          Automatically funnel spare change from daily expenses to this goal
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableRoundUp}
                      onChange={(e) => setEnableRoundUp(e.target.checked)}
                      className="w-4 h-4 text-[#0057FF] rounded-md focus:ring-[#0057FF]"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 5: Review & Confirmation */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Preview Card */}
                <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-600 via-[#0057FF] to-indigo-700 text-white shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl p-2 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner">
                      {icon}
                    </span>
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-md flex items-center gap-1">
                      {goalType === 'individual' ? (
                        <>
                          <Lock size={11} /> Private Goal
                        </>
                      ) : (
                        <>
                          <Users size={11} /> Family Group ({selectedMemberUids.length})
                        </>
                      )}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-black">{title || 'Untitled Goal'}</h3>
                    <p className="text-xs text-blue-100/90">{customCategory || category}</p>
                  </div>

                  <div className="pt-2 border-t border-white/20 flex items-end justify-between">
                    <div>
                      <span className="text-[10px] text-blue-200 uppercase tracking-wider block font-bold">
                        Target Amount
                      </span>
                      <span className="text-2xl font-black">
                        {formatCurrency(parsedTarget, userProfile?.currency)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-blue-200 uppercase tracking-wider block font-bold">
                        Deadline
                      </span>
                      <span className="text-xs font-bold">
                        {targetDate
                          ? new Date(targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                          : 'No Deadline'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Summary checklist */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-gray-700">
                    <span className="text-gray-500">Savings Type:</span>
                    <span className="font-bold">
                      {goalType === 'individual' ? '🙋 Just Me (Private)' : `👨‍👩‍👧‍👦 With Family (${selectedMemberUids.length} members)`}
                    </span>
                  </div>
                  {targetDate && monthlyNeeded > 0 && (
                    <div className="flex items-center justify-between text-gray-700">
                      <span className="text-gray-500">Pace Needed:</span>
                      <span className="font-bold text-[#0057FF]">₹{monthlyNeeded.toLocaleString()}/month</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-gray-700">
                    <span className="text-gray-500">Round-Up Savings:</span>
                    <span className="font-bold text-emerald-600">
                      {enableRoundUp ? 'Enabled (Spare change)' : 'Disabled'}
                    </span>
                  </div>
                  {goalType === 'group' && (
                    <div className="pt-2 border-t border-gray-200 text-gray-500 text-[11px]">
                      🔐 <strong>Spending Policy:</strong> Withdrawals require unanimous approval from every participant.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Wizard Footer Navigation */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft size={14} />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={(step === 1 && !title.trim()) || (step === 2 && parsedTarget <= 0)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0057FF] hover:bg-[#0046D1] disabled:bg-gray-300 text-white shadow-md shadow-[#0057FF]/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              Continue
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0057FF] hover:bg-[#0046D1] disabled:bg-gray-400 text-white shadow-md shadow-[#0057FF]/30 transition-all cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Creating Goal...</span>
              ) : (
                <>
                  <Check size={16} />
                  <span>Create Goal 🎉</span>
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
