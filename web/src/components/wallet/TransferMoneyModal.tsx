import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Send,
  ArrowRight,
  Check,
  AlertCircle,
  User,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface TransferMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddMoney?: () => void;
  initialRecipientUid?: string;
}

export const TransferMoneyModal: React.FC<TransferMoneyModalProps> = ({
  isOpen,
  onClose,
  onOpenAddMoney,
  initialRecipientUid,
}) => {
  const { transferMoney, currentWallet, allFamilyWallets } = useWallet();
  const { family, user } = useAuth();
  const { userProfile } = useAuth();

  const otherMembers = (family?.members || []).filter((m) => m.uid !== user?.uid);

  const [recipientUid, setRecipientUid] = useState<string>(
    initialRecipientUid || (otherMembers[0]?.uid || '')
  );
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [step, setStep] = useState<'input' | 'confirm'>('input');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedAmount = parseFloat(amount) || 0;
  const headBalance = currentWallet?.balance ?? 0;
  const isInsufficient = parsedAmount > headBalance;

  const recipientMember = family?.members?.find((m) => m.uid === recipientUid);
  const recipientWallet = allFamilyWallets.find((w) => w.ownerUserId === recipientUid);
  const recipientCurrentBalance = recipientWallet?.balance ?? 0;
  const recipientResultingBalance = Math.round((recipientCurrentBalance + parsedAmount) * 100) / 100;
  const headResultingBalance = Math.round((headBalance - parsedAmount) * 100) / 100;

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientUid || parsedAmount <= 0 || isInsufficient) return;
    setStep('confirm');
  };

  const handleConfirm = async () => {
    if (!recipientUid || parsedAmount <= 0 || isInsufficient) return;
    setIsSubmitting(true);
    try {
      await transferMoney(recipientUid, parsedAmount, note.trim() || undefined);
      onClose();
      setStep('input');
      setAmount('');
      setNote('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <Send size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 leading-tight">Transfer Money</h2>
              <p className="text-[11px] text-gray-500">Send funds to family members</p>
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
          {otherMembers.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                <User size={24} />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">No Family Members Found</h3>
              <p className="text-gray-500 text-xs">
                Invite household members using your family invite code from the Profile screen first.
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {step === 'input' ? (
                <motion.form
                  key="step-input"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  onSubmit={handleNext}
                  className="space-y-4"
                >
                  {/* Select Recipient */}
                  <div>
                    <label className="block font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Select Recipient *
                    </label>
                    <div className="space-y-1.5">
                      {otherMembers.map((member) => {
                        const isSelected = recipientUid === member.uid;
                        const mWallet = allFamilyWallets.find((w) => w.ownerUserId === member.uid);
                        const mBal = mWallet?.balance ?? 0;

                        return (
                          <div
                            key={member.uid}
                            onClick={() => setRecipientUid(member.uid)}
                            className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                              isSelected
                                ? 'border-[#0057FF] bg-blue-50/50 shadow-xs'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0057FF] font-bold text-xs flex items-center justify-center overflow-hidden shrink-0">
                                {member.photoUrl ? (
                                  <img src={member.photoUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  member.displayName[0]?.toUpperCase()
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-gray-900 block text-xs">
                                  {member.displayName}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  Current Balance: {formatCurrency(mBal, userProfile?.currency)}
                                </span>
                              </div>
                            </div>

                            <input
                              type="radio"
                              name="recipient"
                              checked={isSelected}
                              onChange={() => setRecipientUid(member.uid)}
                              className="text-[#0057FF] focus:ring-[#0057FF]"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Transfer Amount */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block font-bold text-gray-500 uppercase tracking-wider">
                        Amount to Transfer *
                      </label>
                      <span className="text-[11px] text-gray-500">
                        Available: <strong className="text-gray-900">{formatCurrency(headBalance, userProfile?.currency)}</strong>
                      </span>
                    </div>

                    <div className="relative">
                      <span className="absolute left-4 top-2.5 text-2xl font-black text-gray-400">₹</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="2,000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200/90 rounded-2xl text-2xl font-black text-gray-900 focus:outline-none focus:bg-white focus:border-[#0057FF] focus:ring-2 focus:ring-[#0057FF]/20"
                      />
                    </div>

                    {/* Insufficient funds warning banner (Section 6) */}
                    {isInsufficient && parsedAmount > 0 && (
                      <div className="mt-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold">
                          <AlertCircle size={14} className="text-rose-600" />
                          <span>You don't have enough available balance for this transfer.</span>
                        </div>
                        <p className="text-gray-600">
                          Short by {formatCurrency(parsedAmount - headBalance, userProfile?.currency)}.
                        </p>
                        {onOpenAddMoney && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenAddMoney();
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-[10px] hover:bg-rose-700 cursor-pointer"
                          >
                            + Add Money to Head Wallet
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Optional Note */}
                  <div>
                    <label className="block font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Optional Note / Purpose
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Monthly allowance, School project, Groceries..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-[#0057FF]"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={parsedAmount <= 0 || isInsufficient || !recipientUid}
                      className="w-full py-2.5 rounded-xl bg-[#0057FF] hover:bg-[#0046D1] disabled:bg-gray-300 text-white font-bold transition-all shadow-md shadow-[#0057FF]/30 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Review Transfer</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </motion.form>
              ) : (
                /* Review & Confirmation Screen */
                <motion.div
                  key="step-confirm"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  className="space-y-4"
                >
                  <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3.5">
                    <h3 className="text-sm font-black text-gray-900 text-center">
                      Confirm Transfer of {formatCurrency(parsedAmount, userProfile?.currency)}
                    </h3>

                    <div className="space-y-2 pt-2 border-t border-gray-200 text-xs">
                      <div className="flex justify-between text-gray-500">
                        <span>Recipient:</span>
                        <span className="font-bold text-gray-900">{recipientMember?.displayName}</span>
                      </div>

                      <div className="flex justify-between text-gray-500">
                        <span>Your Resulting Balance:</span>
                        <span className="font-bold text-gray-900">
                          {formatCurrency(headResultingBalance, userProfile?.currency)}
                        </span>
                      </div>

                      <div className="flex justify-between text-gray-500">
                        <span>Recipient Resulting Balance:</span>
                        <span className="font-black text-emerald-600">
                          {formatCurrency(recipientResultingBalance, userProfile?.currency)}
                        </span>
                      </div>

                      {note && (
                        <div className="flex justify-between text-gray-500">
                          <span>Note:</span>
                          <span className="font-medium text-gray-700 italic">"{note}"</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] text-gray-400 text-center italic pt-1">
                      🔐 Atomic ledger transfer: Sender debited and recipient credited together.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setStep('input')}
                      className="flex-1 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleConfirm}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/30 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isSubmitting ? (
                        'Transferring...'
                      ) : (
                        <>
                          <Check size={14} />
                          Send Money
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
};
