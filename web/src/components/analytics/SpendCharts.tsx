import React from 'react';
import { motion } from 'framer-motion';
import { useExpense } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { X, TrendingUp, AlertTriangle, PieChart, Wallet } from 'lucide-react';

interface SpendChartsProps {
  onClose: () => void;
}

export const SpendCharts: React.FC<SpendChartsProps> = ({ onClose }) => {
  const { expenses, currentMode, stats } = useExpense();
  const { userProfile } = useAuth();

  const categorySpendMap: { [key: string]: number } = {};
  expenses.forEach((e) => {
    categorySpendMap[e.category] = (categorySpendMap[e.category] || 0) + e.amount;
  });

  const categoryEntries = Object.entries(categorySpendMap)
    .sort((a, b) => b[1] - a[1]);

  const totalModeSpend = stats.totalSpend || 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-white rounded-3xl border border-gray-200/90 shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-[#0057FF]">
              <PieChart size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {currentMode === 'individual' ? 'Personal Finance Analytics' : 'Family Ledger Analytics'}
              </h2>
              <p className="text-xs text-gray-500">
                Real-time category distribution & monthly burn-down
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

        {/* Scrollable Content */}
        <div className="py-4 overflow-y-auto space-y-6 flex-1">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#F8F7F4] p-4 rounded-2xl border border-gray-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                This Month Spend
              </span>
              <p className="text-xl font-bold text-gray-900 font-mono mt-1">
                {formatCurrency(stats.monthlySpend, userProfile?.currency)}
              </p>
            </div>

            <div className="bg-[#F8F7F4] p-4 rounded-2xl border border-gray-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Monthly Budget Limit
              </span>
              <p className="text-xl font-bold text-gray-900 font-mono mt-1">
                {formatCurrency(stats.budgetLimit, userProfile?.currency)}
              </p>
            </div>

            <div className={`p-4 rounded-2xl border ${
              stats.budgetPercentage > 100
                ? 'bg-red-50 border-red-200 text-red-700'
                : stats.budgetPercentage > 80
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Budget Consumed
              </span>
              <p className="text-xl font-bold font-mono mt-1">
                {stats.budgetPercentage}%
              </p>
            </div>
          </div>

          {/* Budget Progress Meter */}
          <div className="bg-[#F8F7F4] p-4 rounded-2xl border border-gray-200/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Wallet size={14} className="text-[#0057FF]" />
                <span>Monthly Budget Cap</span>
              </span>
              <span className="text-xs font-semibold text-gray-600 font-mono">
                {formatCurrency(stats.monthlySpend, userProfile?.currency)} / {formatCurrency(stats.budgetLimit, userProfile?.currency)}
              </span>
            </div>

            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(stats.budgetPercentage, 100)}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  stats.budgetPercentage > 100
                    ? 'bg-red-500'
                    : stats.budgetPercentage > 80
                    ? 'bg-amber-500'
                    : 'bg-[#0057FF]'
                }`}
              />
            </div>

            {stats.budgetPercentage > 100 && (
              <p className="text-xs text-red-600 font-medium mt-2 flex items-center gap-1.5">
                <AlertTriangle size={13} />
                <span>Over budget by {formatCurrency(stats.monthlySpend - stats.budgetLimit, userProfile?.currency)}! Consider adjusting limits.</span>
              </p>
            )}
          </div>

          {/* Category Breakdown Progress Bars */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
              <TrendingUp size={14} className="text-[#0057FF]" />
              <span>Category Distribution</span>
            </h3>

            {categoryEntries.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center">No expense records found for analysis</p>
            ) : (
              <div className="space-y-3">
                {categoryEntries.map(([catName, amount]) => {
                  const percentage = Math.round((amount / totalModeSpend) * 100);
                  const catObj = CATEGORIES.find((c) => c.name === catName);
                  const color = catObj ? catObj.color : '#0057FF';

                  return (
                    <div key={catName} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span>{catName}</span>
                        </span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-gray-500 text-[11px]">{percentage}%</span>
                          <span className="font-bold text-gray-900">
                            {formatCurrency(amount, userProfile?.currency)}
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
