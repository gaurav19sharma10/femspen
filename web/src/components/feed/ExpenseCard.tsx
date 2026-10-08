import React from 'react';
import { motion } from 'framer-motion';
import { Expense } from '../../types';
import { useExpense } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import { Pin, Calendar, Repeat, UserCheck } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface ExpenseCardProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense, onEdit }) => {
  const { togglePin } = useExpense();
  const { userProfile } = useAuth();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={() => onEdit(expense)}
      className="group relative rounded-2xl p-4 border border-gray-300/60 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
      style={{ backgroundColor: expense.color || '#F8F7F4' }}
    >
      {/* Top Header: Category & Pin button */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-black/5 text-gray-800 backdrop-blur-xs">
          {expense.category}
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            togglePin(expense.id);
          }}
          className={`p-1.5 rounded-full transition-opacity cursor-pointer ${
            expense.isPinned
              ? 'text-[#0057FF] opacity-100'
              : 'text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100'
          }`}
          title={expense.isPinned ? 'Unpin expense' : 'Pin expense to top'}
        >
          <Pin size={15} className={expense.isPinned ? 'fill-current' : ''} />
        </button>
      </div>

      {/* Main Title & Hero Amount */}
      <div className="mb-2.5">
        <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
          {expense.title}
        </h3>
        <p className="text-xl font-bold text-gray-900 tracking-tight mt-1 font-mono">
          {formatCurrency(expense.amount, userProfile?.currency || expense.currency || 'INR')}
        </p>
      </div>

      {/* Notes preview */}
      {expense.notes && (
        <p className="text-xs text-gray-600 line-clamp-3 mb-3 leading-relaxed whitespace-pre-line">
          {expense.notes}
        </p>
      )}

      {/* Receipt Image Thumbnail preview if any */}
      {expense.receiptUrl && (
        <div className="mb-3 rounded-xl overflow-hidden border border-black/10 max-h-36">
          <img
            src={expense.receiptUrl}
            alt="Receipt attachment"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Bottom Footer: Badges & Family Member attribution */}
      <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-black/5 text-[10px] text-gray-500 font-medium">
        <div className="flex items-center gap-1.5 flex-wrap">
          {expense.mode === 'family' && expense.familyMember && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-800">
              <UserCheck size={11} />
              <span>{expense.familyMember}</span>
            </span>
          )}

          {expense.isRecurring && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/10 text-[#0057FF]">
              <Repeat size={11} />
              <span>{expense.recurringInterval || 'Recurring'}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-gray-400 shrink-0">
          <Calendar size={11} />
          <span>{expense.date}</span>
        </div>
      </div>
    </motion.div>
  );
};
