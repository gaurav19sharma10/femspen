import React from 'react';
import { motion } from 'framer-motion';
import { Expense } from '../../types';
import { useExpense } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/currency';
import { X, CalendarClock, Repeat, Plus } from 'lucide-react';

interface RecurringBillsProps {
  onClose: () => void;
  onEditExpense: (expense: Expense) => void;
  onOpenNew: () => void;
}

export const RecurringBills: React.FC<RecurringBillsProps> = ({
  onClose,
  onEditExpense,
  onOpenNew,
}) => {
  const { expenses } = useExpense();
  const { userProfile } = useAuth();

  const recurringList = expenses.filter((e) => e.isRecurring);
  const totalRecurringMonthly = recurringList.reduce((sum, e) => {
    if (e.recurringInterval === 'yearly') return sum + e.amount / 12;
    if (e.recurringInterval === 'weekly') return sum + e.amount * 4.33;
    return sum + e.amount;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-white rounded-3xl border border-gray-200/90 shadow-2xl p-6 overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-[#0057FF]">
              <CalendarClock size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Recurring Bills & Subscriptions
              </h2>
              <p className="text-xs text-gray-500">
                Fixed monthly commitments and renewal dues
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Burn Rate Banner */}
        <div className="my-4 p-4 rounded-2xl bg-[#0057FF] text-white flex items-center justify-between shadow-md shadow-[#0057FF]/20">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block">
              Estimated Monthly Burn
            </span>
            <span className="text-2xl font-bold font-mono">
              {formatCurrency(totalRecurringMonthly, userProfile?.currency)}
            </span>
          </div>
          <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-medium">
            {recurringList.length} active bills
          </span>
        </div>

        {/* List of Subscriptions */}
        <div className="flex-1 overflow-y-auto space-y-2.5 py-1">
          {recurringList.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Repeat size={32} className="mx-auto mb-2 opacity-50 text-gray-300" />
              <p className="text-xs font-medium">No recurring subscriptions tracked yet</p>
              <button
                onClick={() => {
                  onClose();
                  onOpenNew();
                }}
                className="mt-3 text-xs text-[#0057FF] font-semibold hover:underline"
              >
                + Add your first subscription
              </button>
            </div>
          ) : (
            recurringList.map((bill) => (
              <div
                key={bill.id}
                onClick={() => {
                  onClose();
                  onEditExpense(bill);
                }}
                className="p-3.5 rounded-2xl border border-gray-200/80 hover:border-[#0057FF]/40 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between"
                style={{ backgroundColor: bill.color || '#F8F7F4' }}
              >
                <div>
                  <h4 className="text-xs font-bold text-gray-900">{bill.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-black/5 text-gray-700">
                      {bill.category}
                    </span>
                    <span className="text-[10px] text-gray-500 capitalize">
                      {bill.recurringInterval || 'Monthly'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900 font-mono">
                    {formatCurrency(bill.amount, bill.currency || userProfile?.currency)}
                  </span>
                  <span className="block text-[10px] text-gray-400">
                    due on {bill.date}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenNew();
            }}
            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-[#0057FF] text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Subscription</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
