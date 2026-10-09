import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGoal } from '../../context/GoalContext';
import { useAuth } from '../../context/AuthContext';
import { X, Sparkles, Check, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface AutomaticSavingsModalProps {
  onClose: () => void;
}

export const AutomaticSavingsModal: React.FC<AutomaticSavingsModalProps> = ({ onClose }) => {
  const { roundUpSettings, updateRoundUpSettings, activeGoals } = useGoal();
  const { userProfile } = useAuth();

  const [enabled, setEnabled] = useState(roundUpSettings.enabled);
  const [roundTo, setRoundTo] = useState<number>(roundUpSettings.roundTo || 100);
  const [customRoundTo, setCustomRoundTo] = useState<string>(
    [10, 50, 100, 500].includes(roundUpSettings.roundTo) ? '' : String(roundUpSettings.roundTo || '')
  );
  const [destination, setDestination] = useState<'all' | 'specific'>(roundUpSettings.destination || 'all');
  const [targetGoalId, setTargetGoalId] = useState<string>(
    roundUpSettings.targetGoalId || (activeGoals[0]?.id || '')
  );
  const [dailySavingEnabled, setDailySavingEnabled] = useState(roundUpSettings.dailySavingEnabled ?? true);
  const [monthlySavingEnabled, setMonthlySavingEnabled] = useState(roundUpSettings.monthlySavingEnabled ?? true);

  // Playground simulation state
  const [testAmount, setTestAmount] = useState<string>('480');

  const parsedTest = parseFloat(testAmount) || 0;
  const currentRounding = customRoundTo ? parseFloat(customRoundTo) || roundTo : roundTo;
  const simulatedCeil = currentRounding > 0 ? Math.ceil(parsedTest / currentRounding) * currentRounding : parsedTest;
  const simulatedSaved = Math.max(0, simulatedCeil - parsedTest);

  const handleSave = () => {
    const finalRoundTo = customRoundTo ? parseFloat(customRoundTo) || 100 : roundTo;
    updateRoundUpSettings({
      enabled,
      roundTo: finalRoundTo,
      destination,
      targetGoalId: destination === 'specific' ? targetGoalId : undefined,
      dailySavingEnabled,
      monthlySavingEnabled,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50/60 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 leading-tight">Automatic Savings</h2>
              <p className="text-xs text-gray-500">Painless spare-change round-ups</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-gray-700">
          {/* Main Master Switch */}
          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200/80 rounded-2xl">
            <div>
              <h3 className="font-bold text-gray-900">Enable Round-Up Savings</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Automatically allocate spare change every time you record an expense
              </p>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`w-13 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                enabled ? 'bg-[#0057FF]' : 'bg-gray-300'
              }`}
            >
              <motion.div
                layout
                className="bg-white w-5 h-5 rounded-full shadow-md"
                animate={{ x: enabled ? 24 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          {enabled && (
            <>
              {/* Rounding Level Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                  Round Up Each Expense To:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { label: 'Nearest ₹10', value: 10, hint: '₹127 → ₹130' },
                    { label: 'Nearest ₹50', value: 50, hint: '₹127 → ₹150' },
                    { label: 'Nearest ₹100', value: 100, hint: 'Default (₹480 → ₹500)' },
                    { label: 'Nearest ₹500', value: 500, hint: '₹451 → ₹500' },
                  ].map((opt) => {
                    const isSelected = roundTo === opt.value && !customRoundTo;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setRoundTo(opt.value);
                          setCustomRoundTo('');
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#0057FF] bg-blue-50/50 shadow-xs'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-bold text-xs ${isSelected ? 'text-[#0057FF]' : 'text-gray-900'}`}>
                            {opt.label}
                          </span>
                          {isSelected && <Check size={14} className="text-[#0057FF]" />}
                        </div>
                        <span className="text-[10px] text-gray-400 block">{opt.hint}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom round-up input */}
                <div className="mt-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Or custom rounding:</span>
                    <div className="relative w-28">
                      <span className="absolute left-2.5 top-2 text-xs text-gray-400">₹</span>
                      <input
                        type="number"
                        placeholder="e.g. 250"
                        value={customRoundTo}
                        onChange={(e) => setCustomRoundTo(e.target.value)}
                        className="w-full pl-6 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0057FF] focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Destination Goal Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                  Where should round-up savings go?
                </label>
                <div className="space-y-2">
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      destination === 'all'
                        ? 'border-[#0057FF] bg-blue-50/40 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="destination"
                      checked={destination === 'all'}
                      onChange={() => setDestination('all')}
                      className="mt-0.5 text-[#0057FF] focus:ring-[#0057FF]"
                    />
                    <div>
                      <span className="font-bold text-gray-900 text-xs block">
                        All Active Goals (Split Evenly)
                      </span>
                      <span className="text-[11px] text-gray-500">
                        Distributes spare change across all of your active personal & family goals
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      destination === 'specific'
                        ? 'border-[#0057FF] bg-blue-50/40 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="destination"
                      checked={destination === 'specific'}
                      onChange={() => setDestination('specific')}
                      className="mt-0.5 text-[#0057FF] focus:ring-[#0057FF]"
                    />
                    <div className="flex-1">
                      <span className="font-bold text-gray-900 text-xs block">
                        Select a Specific Goal
                      </span>
                      <span className="text-[11px] text-gray-500 block mb-2">
                        Channel 100% of spare change to a dedicated high-priority goal
                      </span>

                      {destination === 'specific' && (
                        <select
                          value={targetGoalId}
                          onChange={(e) => setTargetGoalId(e.target.value)}
                          className="w-full mt-1.5 p-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0057FF]"
                        >
                          {activeGoals.length === 0 ? (
                            <option value="">No active goals found</option>
                          ) : (
                            activeGoals.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.icon} {g.title} ({formatCurrency(g.currentAmount, userProfile?.currency)} saved)
                              </option>
                            ))
                          )}
                        </select>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Interactive Live Preview Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 to-orange-50/40 border border-amber-200/60">
                <div className="flex items-center gap-2 mb-2 text-amber-800">
                  <Sparkles size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Live Savings Simulator</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/90 p-3 rounded-xl border border-amber-200/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">If you spend:</span>
                    <div className="relative w-24">
                      <span className="absolute left-2.5 top-1.5 text-xs text-gray-400">₹</span>
                      <input
                        type="number"
                        value={testAmount}
                        onChange={(e) => setTestAmount(e.target.value)}
                        className="w-full pl-6 pr-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  <ArrowRight size={16} className="text-gray-400 hidden sm:block" />

                  <div className="text-right flex items-center gap-2">
                    <span className="text-xs text-gray-500">FemSpen saves:</span>
                    <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      +₹{simulatedSaved} 🎯
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-amber-700/80 mt-2">
                  Expense rounded to ₹{simulatedCeil}. Difference of ₹{simulatedSaved} automatically grows your goals!
                </p>
              </div>

              {/* Recurring Scheduled Saving Controls (Section 18) */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Automated Saving Schedules
                </h4>

                {/* Daily Saving Toggle */}
                <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200/80 rounded-2xl">
                  <div>
                    <h5 className="font-bold text-gray-900 text-xs">Daily Saving Rules</h5>
                    <p className="text-[11px] text-gray-500">Allow daily auto-savings configured in goals</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDailySavingEnabled(!dailySavingEnabled)}
                    className={`w-11 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                      dailySavingEnabled ? 'bg-[#0057FF]' : 'bg-gray-300'
                    }`}
                  >
                    <motion.div
                      layout
                      className="bg-white w-5 h-5 rounded-full shadow-md"
                      animate={{ x: dailySavingEnabled ? 20 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                {/* Monthly Saving Toggle */}
                <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200/80 rounded-2xl">
                  <div>
                    <h5 className="font-bold text-gray-900 text-xs">Monthly Deposit Rules</h5>
                    <p className="text-[11px] text-gray-500">Allow monthly scheduled contributions</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMonthlySavingEnabled(!monthlySavingEnabled)}
                    className={`w-11 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                      monthlySavingEnabled ? 'bg-[#0057FF]' : 'bg-gray-300'
                    }`}
                  >
                    <motion.div
                      layout
                      className="bg-white w-5 h-5 rounded-full shadow-md"
                      animate={{ x: monthlySavingEnabled ? 20 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0057FF] hover:bg-[#0046D1] text-white shadow-md shadow-[#0057FF]/30 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Check size={14} />
            Save Preferences
          </button>
        </div>
      </motion.div>
    </div>
  );
};
