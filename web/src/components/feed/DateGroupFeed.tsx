import React from 'react';
import { Expense } from '../../types';
import { useExpense } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import { ExpenseCard } from './ExpenseCard';
import { EmptyFeedArt } from '../common/VectorArt';
import { formatCurrency } from '../../utils/currency';
import { Pin, Plus, Receipt } from 'lucide-react';

interface DateGroupFeedProps {
  onOpenNew: () => void;
  onEditExpense: (expense: Expense) => void;
}

export const DateGroupFeed: React.FC<DateGroupFeedProps> = ({
  onOpenNew,
  onEditExpense,
}) => {
  const { dateGroups, expenses, currentMode } = useExpense();
  const { userProfile } = useAuth();

  const pinnedExpenses = expenses.filter((e) => e.isPinned);
  const hasExpenses = expenses.length > 0;

  return (
    <div className="space-y-8 pb-24">
      {/* Google Keep Quick Note Bar */}
      <div className="max-w-xl mx-auto">
        <div
          onClick={onOpenNew}
          className="bg-white hover:bg-gray-50 border border-gray-200/90 rounded-2xl shadow-xs p-3.5 px-4 flex items-center justify-between cursor-pointer transition-all hover:shadow-sm"
        >
          <span className="text-sm font-medium text-gray-400 select-none">
            Record a new {currentMode} expense...
          </span>
          <div className="flex items-center gap-2 text-gray-500">
            <button
              type="button"
              className="p-1.5 rounded-lg hover:bg-gray-100 text-[#0057FF] transition-colors"
              title="Add Expense"
            >
              <Plus size={18} />
            </button>
            <button
              type="button"
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              title="Add Receipt"
            >
              <Receipt size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State Artwork */}
      {!hasExpenses && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <EmptyFeedArt size={170} className="mb-4" />
          <h3 className="text-base font-bold text-gray-800">
            No {currentMode} expenses recorded
          </h3>
          <p className="text-xs text-gray-500 max-w-xs mt-1">
            Keep track of your daily coffee, utility bills, or household groceries by recording an expense card.
          </p>
          <button
            onClick={onOpenNew}
            className="mt-4 px-4 py-2 bg-[#0057FF] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-[#0057FF]/20 hover:bg-[#0046D1] cursor-pointer transition-all"
          >
            <Plus size={15} />
            <span>Record First Expense</span>
          </button>
        </div>
      )}

      {/* PINNED SECTION */}
      {pinnedExpenses.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3 px-1 text-xs font-bold uppercase tracking-wider text-gray-500">
            <Pin size={13} className="text-[#0057FF] fill-current" />
            <span>Pinned</span>
            <span className="text-[10px] bg-blue-100 text-[#0057FF] px-2 py-0.5 rounded-full font-bold">
              {pinnedExpenses.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {pinnedExpenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                onEdit={onEditExpense}
              />
            ))}
          </div>
        </div>
      )}

      {/* DATE-GROUPED SECTIONS */}
      {dateGroups.map((group) => {
        const unpinnedInGroup = group.expenses.filter((e) => !e.isPinned);
        if (unpinnedInGroup.length === 0) return null;

        const groupSpend = unpinnedInGroup.reduce((sum, e) => sum + e.amount, 0);

        return (
          <section key={group.id} className="space-y-3">
            <div className="flex items-baseline justify-between px-1 border-b border-gray-200/50 pb-1.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-2">
                <span>{group.title}</span>
                {group.dateStr && (
                  <span className="text-[11px] font-normal text-gray-400">
                    ({group.dateStr})
                  </span>
                )}
              </h2>

              <span className="text-xs font-bold text-gray-800 font-mono bg-gray-200/60 px-2 py-0.5 rounded-md">
                {formatCurrency(groupSpend, userProfile?.currency)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {unpinnedInGroup.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  onEdit={onEditExpense}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};
