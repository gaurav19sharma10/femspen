import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';
import { NegativeBalancePolicy } from '../../types';
import {
  X,
  Settings,
  Shield,
  ShieldAlert,
  Lock,
  Unlock,
  AlertTriangle,
  Check,
  User,
  Coins,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface WalletSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletSettingsModal: React.FC<WalletSettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    currentWallet,
    allFamilyWallets,
    spendingLimits,
    familyPolicy,
    updateSpendingLimits,
    updateFamilyPolicy,
    freezeWallet,
    unfreezeWallet,
  } = useWallet();
  const { userProfile, family, user } = useAuth();

  const isHead = userProfile?.familyRole === 'head';
  const otherMembers = (family?.members || []).filter((m) => m.uid !== user?.uid);

  // Selected member for Head to configure
  const [selectedMemberUid, setSelectedMemberUid] = useState<string>(otherMembers[0]?.uid || '');

  // Form state for selected member
  const currentMemberLimits = spendingLimits[selectedMemberUid] || {
    allowNegativeBalance: true,
    negativeBalancePolicy: 'ALLOW_UNLIMITED' as NegativeBalancePolicy,
    negativeBalanceLimit: 2000,
    dailyLimit: undefined,
    monthlyLimit: undefined,
    lowBalanceThreshold: 500,
  };

  const selectedWallet = allFamilyWallets.find((w) => w.ownerUserId === selectedMemberUid);
  const isSelectedWalletFrozen = selectedWallet?.status === 'frozen';

  const [dailyLimit, setDailyLimit] = useState<string>(
    currentMemberLimits.dailyLimit ? String(currentMemberLimits.dailyLimit) : ''
  );
  const [monthlyLimit, setMonthlyLimit] = useState<string>(
    currentMemberLimits.monthlyLimit ? String(currentMemberLimits.monthlyLimit) : ''
  );
  const [negativePolicy, setNegativePolicy] = useState<NegativeBalancePolicy>(
    currentMemberLimits.negativeBalancePolicy || 'ALLOW_UNLIMITED'
  );
  const [negativeLimit, setNegativeLimit] = useState<string>(
    currentMemberLimits.negativeBalanceLimit ? String(currentMemberLimits.negativeBalanceLimit) : '2000'
  );
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState<string>(
    String(currentMemberLimits.lowBalanceThreshold || 500)
  );

  // Global policy
  const [allowSelfFunding, setAllowSelfFunding] = useState<boolean>(
    familyPolicy?.allowMemberSelfFunding ?? false
  );

  const [isSaving, setIsSaving] = useState(false);

  const handleMemberChange = (uid: string) => {
    setSelectedMemberUid(uid);
    const mLimits = spendingLimits[uid];
    setDailyLimit(mLimits?.dailyLimit ? String(mLimits.dailyLimit) : '');
    setMonthlyLimit(mLimits?.monthlyLimit ? String(mLimits.monthlyLimit) : '');
    setNegativePolicy(mLimits?.negativeBalancePolicy || 'ALLOW_UNLIMITED');
    setNegativeLimit(mLimits?.negativeBalanceLimit ? String(mLimits.negativeBalanceLimit) : '2000');
    setLowBalanceThreshold(String(mLimits?.lowBalanceThreshold || 500));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (isHead) {
        // Save family policy
        await updateFamilyPolicy({
          allowMemberSelfFunding: allowSelfFunding,
        });

        // Save selected member limits
        if (selectedMemberUid) {
          await updateSpendingLimits(selectedMemberUid, {
            dailyLimit: dailyLimit ? parseFloat(dailyLimit) : undefined,
            monthlyLimit: monthlyLimit ? parseFloat(monthlyLimit) : undefined,
            negativeBalancePolicy: negativePolicy,
            allowNegativeBalance: negativePolicy !== 'BLOCK',
            negativeBalanceLimit: negativePolicy === 'ALLOW_WITH_LIMIT' ? parseFloat(negativeLimit) : undefined,
            lowBalanceThreshold: parseFloat(lowBalanceThreshold) || 500,
          });
        }
      }
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gray-100 text-gray-800 flex items-center justify-center font-bold">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 leading-tight">Wallet Settings & Rules</h2>
              <p className="text-[11px] text-gray-500">
                {isHead ? 'Configure spending policies and limits' : 'View your assigned wallet policies'}
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-gray-700">
          {isHead ? (
            <>
              {/* Family Wide Policies */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3">
                <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                  Household Policies
                </h3>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900">Member Self-Funding</h4>
                    <p className="text-[11px] text-gray-500">Allow family members to directly add money to their wallets</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllowSelfFunding(!allowSelfFunding)}
                    className={`w-11 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                      allowSelfFunding ? 'bg-[#0057FF]' : 'bg-gray-300'
                    }`}
                  >
                    <motion.div
                      layout
                      className="bg-white w-5 h-5 rounded-full shadow-md"
                      animate={{ x: allowSelfFunding ? 20 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              </div>

              {/* Member-Specific Controls */}
              {otherMembers.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-gray-500 uppercase tracking-wider text-[11px]">
                      Member-Specific Controls
                    </label>
                    <select
                      value={selectedMemberUid}
                      onChange={(e) => handleMemberChange(e.target.value)}
                      className="p-1.5 bg-gray-100 border border-gray-200 rounded-xl font-bold text-gray-800"
                    >
                      {otherMembers.map((m) => (
                        <option key={m.uid} value={m.uid}>
                          {m.displayName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Freeze / Unfreeze Action */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {isSelectedWalletFrozen ? (
                        <Lock size={18} className="text-rose-600" />
                      ) : (
                        <Unlock size={18} className="text-emerald-600" />
                      )}
                      <div>
                        <h4 className="font-bold text-gray-900">Wallet Status</h4>
                        <p className="text-[11px] text-gray-600">
                          {isSelectedWalletFrozen ? 'Wallet is currently frozen' : 'Wallet is active and functional'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (isSelectedWalletFrozen) {
                          unfreezeWallet(selectedMemberUid);
                        } else {
                          freezeWallet(selectedMemberUid);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-colors ${
                        isSelectedWalletFrozen
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-rose-600 hover:bg-rose-700 text-white'
                      }`}
                    >
                      {isSelectedWalletFrozen ? 'Unfreeze Wallet' : 'Freeze Wallet'}
                    </button>
                  </div>

                  {/* Negative Balance Policy (Section 9 & 10) */}
                  <div className="space-y-2">
                    <label className="block font-bold text-gray-500 uppercase tracking-wider text-[11px]">
                      Negative Balance Policy
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'ALLOW_UNLIMITED', label: 'Allow Unlimited', hint: 'Alerts head immediately' },
                        { id: 'ALLOW_WITH_LIMIT', label: 'Allow with Limit', hint: 'Set maximum negative cap' },
                        { id: 'BLOCK', label: 'Strict Block', hint: 'Block spending below ₹0' },
                      ].map((pol) => {
                        const isSelected = negativePolicy === pol.id;
                        return (
                          <button
                            key={pol.id}
                            type="button"
                            onClick={() => setNegativePolicy(pol.id as NegativeBalancePolicy)}
                            className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'border-[#0057FF] bg-blue-50/50 text-[#0057FF] font-bold shadow-xs'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <span className="block text-xs font-bold">{pol.label}</span>
                            <span className="text-[10px] text-gray-400 block mt-0.5">{pol.hint}</span>
                          </button>
                        );
                      })}
                    </div>

                    {negativePolicy === 'ALLOW_WITH_LIMIT' && (
                      <div className="pt-1.5">
                        <label className="block font-semibold text-gray-500 text-[11px] mb-1">
                          Maximum Negative Balance Limit (₹)
                        </label>
                        <div className="relative w-36">
                          <span className="absolute left-3 top-2 text-xs font-bold text-gray-400">₹</span>
                          <input
                            type="number"
                            value={negativeLimit}
                            onChange={(e) => setNegativeLimit(e.target.value)}
                            placeholder="2000"
                            className="w-full pl-7 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Spending Limits */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-bold text-gray-500 uppercase tracking-wider text-[11px] mb-1">
                        Daily Limit (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="Unlimited"
                        value={dailyLimit}
                        onChange={(e) => setDailyLimit(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-500 uppercase tracking-wider text-[11px] mb-1">
                        Monthly Limit (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="Unlimited"
                        value={monthlyLimit}
                        onChange={(e) => setMonthlyLimit(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Member Settings (Read-Only) */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3">
                <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                  Your Assigned Wallet Limits
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Wallet Status:</span>
                    <span className="font-bold text-emerald-600">
                      {currentWallet?.status === 'frozen' ? 'Frozen ❄️' : 'Active 🟢'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Negative Balance Policy:</span>
                    <span className="font-bold text-gray-900">
                      {currentMemberLimits.negativeBalancePolicy === 'BLOCK'
                        ? 'Blocked below ₹0'
                        : currentMemberLimits.negativeBalancePolicy === 'ALLOW_WITH_LIMIT'
                        ? `Allowed up to -₹${currentMemberLimits.negativeBalanceLimit?.toLocaleString()}`
                        : 'Allowed (alerts head)'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Daily Spending Limit:</span>
                    <span className="font-bold text-gray-900">
                      {currentMemberLimits.dailyLimit
                        ? formatCurrency(currentMemberLimits.dailyLimit, userProfile?.currency)
                        : 'No daily limit set'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Monthly Spending Limit:</span>
                    <span className="font-bold text-gray-900">
                      {currentMemberLimits.monthlyLimit
                        ? formatCurrency(currentMemberLimits.monthlyLimit, userProfile?.currency)
                        : 'No monthly limit set'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 italic">
                ℹ️ Wallet limits and policies are managed by your Family Head ({family?.headName}).
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 transition-colors cursor-pointer"
          >
            {isHead ? 'Cancel' : 'Close'}
          </button>

          {isHead && (
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-[#0057FF] hover:bg-[#0046D1] text-white text-xs font-bold shadow-md shadow-[#0057FF]/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check size={14} />
              Save Settings
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
