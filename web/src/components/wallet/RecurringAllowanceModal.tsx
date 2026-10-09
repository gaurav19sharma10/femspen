import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  CalendarClock,
  Plus,
  Play,
  Pause,
  Trash2,
  Check,
  User,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface RecurringAllowanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecurringAllowanceModal: React.FC<RecurringAllowanceModalProps> = ({ isOpen, onClose }) => {
  const { recurringTransfers, createRecurringTransfer, toggleRecurringTransfer, deleteRecurringTransfer } = useWallet();
  const { family, user, userProfile } = useAuth();

  const otherMembers = (family?.members || []).filter((m) => m.uid !== user?.uid);

  const [recipientUid, setRecipientUid] = useState<string>(otherMembers[0]?.uid || '');
  const [amount, setAmount] = useState<string>('2000');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('Monthly pocket money / allowance');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const parsedAmount = parseFloat(amount) || 0;
  const recipientMember = otherMembers.find((m) => m.uid === recipientUid);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientUid || parsedAmount <= 0) return;

    try {
      await createRecurringTransfer({
        familyId: userProfile?.familyId || '',
        senderUserId: user?.uid || '',
        recipientUserId: recipientUid,
        recipientName: recipientMember?.displayName || 'Member',
        amount: parsedAmount,
        frequency,
        startDate,
        note: note.trim() || undefined,
        status: 'active',
      });
      setIsAdding(false);
      setAmount('2000');
      setNote('');
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
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              <CalendarClock size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 leading-tight">Recurring Allowances</h2>
              <p className="text-[11px] text-gray-500">Automated scheduled transfers to members</p>
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
          {!isAdding ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                  Active Schedules ({recurringTransfers.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#0057FF] hover:bg-[#0046D1] text-white font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Plus size={14} />
                  <span>New Allowance</span>
                </button>
              </div>

              {recurringTransfers.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-2">
                  <Clock size={28} className="mx-auto text-gray-400 opacity-60" />
                  <p className="font-bold text-gray-700 text-xs">No recurring allowances set</p>
                  <p className="text-gray-500 text-[11px]">
                    Schedule automatic weekly or monthly allowances for your family members.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recurringTransfers.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3.5 rounded-2xl border border-gray-200/80 bg-white flex items-center justify-between shadow-2xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-gray-900 text-sm">
                            {formatCurrency(rec.amount, userProfile?.currency)}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 capitalize">
                            Every {rec.frequency}
                          </span>
                          {rec.status === 'paused' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                              Paused
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500">
                          Recipient: <strong className="text-gray-800">{rec.recipientName}</strong>
                          {rec.note && ` • "${rec.note}"`}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleRecurringTransfer(rec.id)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                          title={rec.status === 'paused' ? 'Resume Schedule' : 'Pause Schedule'}
                        >
                          {rec.status === 'paused' ? <Play size={15} /> : <Pause size={15} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRecurringTransfer(rec.id)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete Schedule"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Create Allowance Form */
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Recipient Family Member *
                </label>
                <select
                  value={recipientUid}
                  onChange={(e) => setRecipientUid(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-[#0057FF]"
                >
                  {otherMembers.map((m) => (
                    <option key={m.uid} value={m.uid}>
                      {m.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-[#0057FF]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Frequency *
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-[#0057FF]"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#0057FF]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Note / Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pocket money, Tuition fee..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-[#0057FF]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={parsedAmount <= 0}
                  className="flex-1 py-2.5 rounded-xl bg-[#0057FF] hover:bg-[#0046D1] text-white font-bold cursor-pointer"
                >
                  Schedule Allowance
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
