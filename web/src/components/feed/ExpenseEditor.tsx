import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Expense, CATEGORIES, FAMILY_MEMBERS } from '../../types';
import { useExpense } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import { KeepColorPicker } from '../common/KeepColorPicker';
import {
  X,
  Pin,
  Trash2,
  Calendar,
  Tag,
  Users,
  Repeat,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { getCurrencySymbol } from '../../utils/currency';

interface ExpenseEditorProps {
  initialExpense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExpenseEditor: React.FC<ExpenseEditorProps> = ({
  initialExpense,
  isOpen,
  onClose,
}) => {
  const { addExpense, updateExpense, deleteExpense, currentMode } = useExpense();
  const { userProfile, family } = useAuth();

  const memberOptions = React.useMemo(() => {
    if (family?.members && family.members.length > 0) {
      return ['Shared Household', ...family.members.map((m) => m.displayName)];
    }
    return FAMILY_MEMBERS;
  }, [family]);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [color, setColor] = useState('#F8F7F4');
  const [isPinned, setIsPinned] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [familyMember, setFamilyMember] = useState(FAMILY_MEMBERS[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialExpense) {
      setTitle(initialExpense.title);
      setAmount(initialExpense.amount.toString());
      setCategory(initialExpense.category || CATEGORIES[0].name);
      setColor(initialExpense.color || '#F8F7F4');
      setIsPinned(initialExpense.isPinned || false);
      setDate(initialExpense.date || new Date().toISOString().split('T')[0]);
      setNotes(initialExpense.notes || '');
      setFamilyMember(initialExpense.familyMember || FAMILY_MEMBERS[0]);
      setIsRecurring(Boolean(initialExpense.isRecurring));
      setRecurringInterval(initialExpense.recurringInterval || 'monthly');
      setReceiptUrl(initialExpense.receiptUrl);
    } else {
      setTitle('');
      setAmount('');
      setCategory(CATEGORIES[0].name);
      setColor('#F8F7F4');
      setIsPinned(false);
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setFamilyMember(FAMILY_MEMBERS[0]);
      setIsRecurring(false);
      setRecurringInterval('monthly');
      setReceiptUrl(undefined);
    }
  }, [initialExpense, isOpen]);

  if (!isOpen) return null;

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() && !amount) {
      onClose();
      return;
    }

    const parsedAmount = parseFloat(amount) || 0;
    setIsSubmitting(true);

    try {
      if (initialExpense) {
        await updateExpense(initialExpense.id, {
          title: title.trim() || 'Untitled Expense',
          amount: parsedAmount,
          category,
          color,
          isPinned,
          date,
          notes: notes.trim(),
          familyMember: currentMode === 'family' ? familyMember : undefined,
          isRecurring,
          recurringInterval: isRecurring ? recurringInterval : undefined,
          receiptUrl,
        });
      } else {
        await addExpense({
          title: title.trim() || 'Untitled Expense',
          amount: parsedAmount,
          currency: userProfile?.currency || 'INR',
          category,
          mode: currentMode,
          color,
          isPinned,
          date,
          notes: notes.trim(),
          familyMember: currentMode === 'family' ? familyMember : undefined,
          isRecurring,
          recurringInterval: isRecurring ? recurringInterval : undefined,
          receiptUrl,
        });
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialExpense) return;
    if (window.confirm('Delete this expense card?')) {
      await deleteExpense(initialExpense.id);
      onClose();
    }
  };

  const currencySymbol = getCurrencySymbol(userProfile?.currency);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="w-full max-w-lg rounded-3xl border border-gray-300/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          style={{ backgroundColor: color }}
        >
          {/* Header Controls */}
          <div className="flex items-center justify-between p-4 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {initialExpense ? 'Edit Expense Note' : 'New Expense Note'}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                className={`p-2 rounded-full cursor-pointer transition-colors ${
                  isPinned ? 'text-[#0057FF] bg-blue-100/50' : 'text-gray-400 hover:text-gray-700'
                }`}
                title={isPinned ? 'Unpin' : 'Pin to top'}
              >
                <Pin size={18} className={isPinned ? 'fill-current' : ''} />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-4 pt-1 flex-1 overflow-y-auto space-y-3.5">
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (e.g. Grocery Run, Coffee, Electric Bill)"
                className="w-full bg-transparent text-lg font-bold text-gray-900 placeholder-gray-400 focus:outline-none"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3 bg-black/5 p-3 rounded-2xl">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Amount ({currencySymbol})
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-1.5 bg-white/80 rounded-xl text-base font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0057FF]/30 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <Calendar size={12} />
                  <span>Date</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white/80 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0057FF]/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <Tag size={12} />
                  <span>Category</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white/80 rounded-xl text-xs font-medium text-gray-800 focus:outline-none border border-black/5"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {currentMode === 'family' && (
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1 flex items-center gap-1">
                    <Users size={12} />
                    <span>Paid By / Member</span>
                  </label>
                  <select
                    value={familyMember}
                    onChange={(e) => setFamilyMember(e.target.value)}
                    className="w-full px-3 py-2 bg-white/80 rounded-xl text-xs font-medium text-gray-800 focus:outline-none border border-black/5"
                  >
                    {memberOptions.map((m, idx) => (
                      <option key={idx} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes or itemized breakdown..."
                className="w-full bg-white/60 focus:bg-white/90 p-3 rounded-2xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none border border-black/5 leading-relaxed resize-none transition-colors"
              />
            </div>

            {receiptUrl && (
              <div className="relative rounded-2xl overflow-hidden border border-black/10 max-h-48 group">
                <img src={receiptUrl} alt="Receipt preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setReceiptUrl(undefined)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
                  title="Remove receipt"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="bg-black/5 p-3 rounded-2xl flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0057FF] focus:ring-0 cursor-pointer"
                />
                <span className="text-xs font-semibold text-gray-800 flex items-center gap-1">
                  <Repeat size={13} className="text-[#0057FF]" />
                  <span>Recurring Bill / Subscription</span>
                </span>
              </label>

              {isRecurring && (
                <select
                  value={recurringInterval}
                  onChange={(e) => setRecurringInterval(e.target.value as any)}
                  className="text-xs bg-white px-2.5 py-1 rounded-lg border border-gray-200 font-medium"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              )}
            </div>
          </form>

          {/* Footer Toolbar */}
          <div className="p-4 pt-3 border-t border-black/10 flex flex-wrap items-center justify-between gap-3 bg-black/5">
            <div className="flex items-center gap-3">
              <KeepColorPicker selectedHex={color} onSelect={setColor} />

              <label className="p-1.5 rounded-full hover:bg-black/10 text-gray-600 hover:text-gray-900 cursor-pointer transition-colors" title="Attach Receipt Photo">
                <ImageIcon size={18} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptUpload}
                  className="hidden"
                />
              </label>

              {initialExpense && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="p-1.5 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Delete note"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="px-5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
            >
              <Check size={14} />
              <span>Done</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
