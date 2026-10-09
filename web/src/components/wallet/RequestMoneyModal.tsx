import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Send,
  AlertCircle,
  Clock,
  Sparkles,
  Check,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface RequestMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RequestMoneyModal: React.FC<RequestMoneyModalProps> = ({ isOpen, onClose }) => {
  const { sendMoneyRequest, currentWallet } = useWallet();
  const { family, userProfile } = useAuth();

  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('Education');
  const [urgency, setUrgency] = useState<'Low' | 'Medium' | 'High' | 'Emergency'>('Medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const parsedAmount = parseFloat(amount) || 0;
  const headName = family?.headName || 'Family Head';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0 || !reason.trim()) return;

    setIsSubmitting(true);
    try {
      await sendMoneyRequest(
        parsedAmount,
        reason.trim(),
        description.trim() || undefined,
        category,
        urgency
      );
      onClose();
      setAmount('');
      setReason('');
      setDescription('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Send size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 leading-tight">Request Money</h2>
              <p className="text-[11px] text-gray-500">Ask {headName} for funds</p>
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-gray-700">
          {/* Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-bold text-gray-500 uppercase tracking-wider">
                Requested Amount *
              </label>
              <span className="text-[11px] text-gray-400">
                Your Wallet: {formatCurrency(currentWallet?.balance || 0, userProfile?.currency)}
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-2.5 text-2xl font-black text-gray-400">₹</span>
              <input
                type="number"
                step="any"
                placeholder="1,500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                required
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200/90 rounded-2xl text-2xl font-black text-gray-900 focus:outline-none focus:bg-white focus:border-[#0057FF] focus:ring-2 focus:ring-[#0057FF]/20"
              />
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[500, 1000, 1500, 2500, 5000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(String(amt))}
                  className="px-2.5 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-[11px] font-bold text-gray-700 cursor-pointer"
                >
                  ₹{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block font-bold text-gray-500 uppercase tracking-wider mb-1">
              Reason / Purpose *
            </label>
            <input
              type="text"
              placeholder="e.g. School supplies, College books, Train ticket, Groceries..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#0057FF]"
            />
          </div>

          {/* Category & Urgency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-500 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-[#0057FF]"
              >
                {['Education', 'Food & Groceries', 'Health & Medical', 'Transport', 'Shopping', 'Bills', 'Other'].map(
                  (c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-500 uppercase tracking-wider mb-1">
                Urgency
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-[#0057FF]"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium</option>
                <option value="High">High Urgency</option>
                <option value="Emergency">🚨 Emergency</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-gray-500 uppercase tracking-wider mb-1">
              Additional Details (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Provide extra details for the family head..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-[#0057FF]"
            />
          </div>

          {/* Info Banner */}
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
            <Clock size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <p>
              Your request will be sent to <strong>{headName}</strong> for approval. You'll receive an instant notification
              when they respond.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || parsedAmount <= 0 || !reason.trim()}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white font-bold transition-all shadow-md shadow-amber-500/30 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                'Sending Request...'
              ) : (
                <>
                  <Send size={14} />
                  <span>Send Money Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
