import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Coins,
  ArrowRight,
  Check,
  Building2,
  Banknote,
  Smartphone,
  CreditCard,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface AddMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddMoneyModal: React.FC<AddMoneyModalProps> = ({ isOpen, onClose }) => {
  const { addMoney, currentWallet } = useWallet();
  const { userProfile } = useAuth();

  const [amount, setAmount] = useState<string>('');
  const [fundingSource, setFundingSource] = useState<string>('Bank Transfer');
  const [note, setNote] = useState<string>('');
  const [step, setStep] = useState<'input' | 'confirm'>('input');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedAmount = parseFloat(amount) || 0;
  const currentBalance = currentWallet?.balance ?? 0;
  const resultingBalance = Math.round((currentBalance + parsedAmount) * 100) / 100;

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0) return;
    setStep('confirm');
  };

  const handleConfirm = async () => {
    if (parsedAmount <= 0) return;
    setIsSubmitting(true);
    try {
      await addMoney(parsedAmount, fundingSource, note.trim() || undefined);
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0057FF]/10 text-[#0057FF] flex items-center justify-center font-bold">
              <Coins size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 leading-tight">Add Money</h2>
              <p className="text-[11px] text-gray-500">Record funds to your wallet ledger</p>
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
          <AnimatePresence mode="wait">
            {step === 'input' ? (
              <motion.form
                key="step-input"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                onSubmit={handleNext}
                className="space-y-4.5"
              >
                {/* Ledger Disclaimer */}
                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/60 flex items-start gap-2.5 text-blue-900">
                  <ShieldCheck size={16} className="text-[#0057FF] shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Manual Ledger Entry:</strong> This records money already deposited or transferred into your
                    household accounts. No bank credentials are required.
                  </p>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Enter Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-2.5 text-2xl font-black text-gray-400">₹</span>
                    <input
                      type="number"
                      step="any"
                      placeholder="5,000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      autoFocus
                      required
                      className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200/90 rounded-2xl text-2xl font-black text-gray-900 focus:outline-none focus:bg-white focus:border-[#0057FF] focus:ring-2 focus:ring-[#0057FF]/20"
                    />
                  </div>

                  {/* Quick Chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {[500, 1000, 2000, 5000, 10000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmount(String(amt))}
                        className="px-2.5 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-[11px] font-bold text-gray-700 cursor-pointer"
                      >
                        +₹{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Funding Source Selector */}
                <div>
                  <label className="block font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Funding Source
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'Bank Transfer', label: 'Bank Transfer', icon: Building2 },
                      { id: 'Cash Deposit', label: 'Cash Deposit', icon: Banknote },
                      { id: 'UPI Payment', label: 'UPI / GPay / PhonePe', icon: Smartphone },
                      { id: 'Online Gateway', label: 'Online Card / NetBanking', icon: CreditCard },
                    ].map((src) => {
                      const isSelected = fundingSource === src.id;
                      const Icon = src.icon;
                      return (
                        <button
                          key={src.id}
                          type="button"
                          onClick={() => setFundingSource(src.id)}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#0057FF] bg-blue-50/50 text-[#0057FF] font-bold shadow-xs'
                              : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                          }`}
                        >
                          <Icon size={16} className={isSelected ? 'text-[#0057FF]' : 'text-gray-400'} />
                          <span className="text-xs truncate">{src.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Note */}
                <div>
                  <label className="block font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Optional Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Salary deposit, ATM cash, bonus..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-[#0057FF]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={parsedAmount <= 0}
                    className="w-full py-2.5 rounded-xl bg-[#0057FF] hover:bg-[#0046D1] disabled:bg-gray-300 text-white font-bold transition-all shadow-md shadow-[#0057FF]/30 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Continue</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </motion.form>
            ) : (
              /* Confirmation Screen (Section 5) */
              <motion.div
                key="step-confirm"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-4"
              >
                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3.5">
                  <h3 className="text-sm font-black text-gray-900 text-center">
                    Add {formatCurrency(parsedAmount, userProfile?.currency)} to your wallet?
                  </h3>

                  <div className="space-y-2 pt-2 border-t border-gray-200 text-xs">
                    <div className="flex justify-between text-gray-500">
                      <span>Funding Source:</span>
                      <span className="font-bold text-gray-900">{fundingSource}</span>
                    </div>

                    <div className="flex justify-between text-gray-500">
                      <span>Current Balance:</span>
                      <span className="font-bold text-gray-900">
                        {formatCurrency(currentBalance, userProfile?.currency)}
                      </span>
                    </div>

                    <div className="flex justify-between text-gray-500">
                      <span>Resulting Balance:</span>
                      <span className="font-black text-emerald-600 text-sm">
                        {formatCurrency(resultingBalance, userProfile?.currency)}
                      </span>
                    </div>

                    {note && (
                      <div className="flex justify-between text-gray-500">
                        <span>Note:</span>
                        <span className="font-medium text-gray-700 italic">"{note}"</span>
                      </div>
                    )}
                  </div>
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
                    className="flex-1 py-2.5 rounded-xl bg-[#0057FF] hover:bg-[#0046D1] text-white font-bold shadow-md shadow-[#0057FF]/30 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting ? (
                      'Processing...'
                    ) : (
                      <>
                        <Check size={14} />
                        Confirm Top-Up
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
