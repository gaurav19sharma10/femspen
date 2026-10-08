import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { KeepExpenseCard } from './KeepExpenseCard';
import { EmptyLedgerIllustration } from '../vector/Illustrations';
import { useExpense, type UnifiedExpense } from '../../context/ExpenseContext';
import { formatMoney } from '../../domain/currency';

interface KeepExpenseGridProps {
  onEditExpense: (expense: UnifiedExpense) => void;
}

export const KeepExpenseGrid: React.FC<KeepExpenseGridProps> = ({ onEditExpense }) => {
  const {
    pinnedExpenses,
    unpinnedExpenses,
    expenses,
    loading,
    household,
  } = useExpense();

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-[#0057FF]/30 border-t-[#0057FF] rounded-full animate-spin" />
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Syncing expenses from Firestore...
        </p>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
        <EmptyLedgerIllustration size={200} />
        <h3 className="mt-4 text-base font-bold text-gray-800">No expenses found</h3>
        <p className="text-xs text-gray-500 max-w-sm mt-1">
          Everything is clean! Take an expense note using the bar above to log a purchase in real-time.
        </p>
      </div>
    );
  }

  const pinnedTotalMinor = pinnedExpenses.reduce((acc, curr) => acc + curr.baseAmountMinor, 0);
  const unpinnedTotalMinor = unpinnedExpenses.reduce((acc, curr) => acc + curr.baseAmountMinor, 0);
  const baseCurrency = household?.baseCurrency || 'INR';

  return (
    <div className="space-y-8 pb-12">
      {/* Pinned Section */}
      {pinnedExpenses.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-[11px] font-bold tracking-wider text-gray-500 uppercase flex items-center gap-1.5">
              <span>📌 PINNED</span>
              <span className="bg-blue-50 text-[#0057FF] px-2 py-0.5 rounded-full font-mono text-[10px]">
                {pinnedExpenses.length}
              </span>
            </h2>
            <span className="text-xs font-bold text-gray-600 font-sans">
              {formatMoney(pinnedTotalMinor, baseCurrency)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3.5">
            <AnimatePresence>
              {pinnedExpenses.map((exp) => (
                <KeepExpenseCard key={exp.id} expense={exp} onEdit={onEditExpense} />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Others / All Expenses Section */}
      {unpinnedExpenses.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-[11px] font-bold tracking-wider text-gray-500 uppercase flex items-center gap-1.5">
              <span>{pinnedExpenses.length > 0 ? 'OTHERS' : 'EXPENSES'}</span>
              <span className="bg-gray-200/80 text-gray-700 px-2 py-0.5 rounded-full font-mono text-[10px]">
                {unpinnedExpenses.length}
              </span>
            </h2>
            <span className="text-xs font-bold text-gray-600 font-sans">
              {formatMoney(unpinnedTotalMinor, baseCurrency)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3.5">
            <AnimatePresence>
              {unpinnedExpenses.map((exp) => (
                <KeepExpenseCard key={exp.id} expense={exp} onEdit={onEditExpense} />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}
    </div>
  );
};
