import React, { useState } from 'react';
import { VectorIcon } from '../vector/VectorIcons';
import { FamilyPotIllustration, AllSettledIllustration } from '../vector/Illustrations';
import { useExpense } from '../../context/ExpenseContext';
import { formatMoney } from '../../domain/currency';
import type { SettlementMethod } from '../../domain/types';

export const LiveInsightsSidebar: React.FC = () => {
  const {
    mode,
    household,
    members,
    expenses,
    balanceResult,
    settlementTransfers,
    potContributions,
    potTotalMinor,
    activities,
    makeSettlement,
    addMoneyToPot,
    changeBudget,
  } = useExpense();

  // State for modals
  const [isPotModalOpen, setIsPotModalOpen] = useState(false);
  const [potAmountStr, setPotAmountStr] = useState('');
  const [potNote, setPotNote] = useState('Pocket money');
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetAmountStr, setBudgetAmountStr] = useState('');

  const baseCurrency = household?.baseCurrency || 'INR';

  // Calculate monthly total
  const now = new Date();
  const currentMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalMonthlySpendMinor = currentMonthExpenses.reduce((acc, curr) => acc + curr.baseAmountMinor, 0);
  const budgetMinor = household?.monthlyBudgetMinor || 200000;
  const isOverBudget = budgetMinor > 0 && totalMonthlySpendMinor > budgetMinor;
  const overAmountMinor = Math.max(0, totalMonthlySpendMinor - budgetMinor);
  const budgetPercent = budgetMinor > 0 ? Math.min(100, Math.round((totalMonthlySpendMinor / budgetMinor) * 100)) : 0;

  // Category distribution
  const categoryTotals = new Map<string, { name: string; color: string; totalMinor: number }>();
  currentMonthExpenses.forEach((e) => {
    const existing = categoryTotals.get(e.categoryName) || { name: e.categoryName, color: e.categoryColor, totalMinor: 0 };
    existing.totalMinor += e.baseAmountMinor;
    categoryTotals.set(e.categoryName, existing);
  });

  const categoryList = Array.from(categoryTotals.values()).sort((a, b) => b.totalMinor - a.totalMinor);

  // SVG Donut calculation
  const totalCategorySpend = categoryList.reduce((acc, c) => acc + c.totalMinor, 0);
  let cumulativeAngle = 0;
  const donutSlices = categoryList.map((cat) => {
    const percent = totalCategorySpend > 0 ? (cat.totalMinor / totalCategorySpend) * 100 : 0;
    const strokeDasharray = `${(percent / 100) * 283} 283`;
    const strokeDashoffset = -((cumulativeAngle / 100) * 283);
    cumulativeAngle += percent;
    return {
      ...cat,
      percent: Math.round(percent),
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const handleDepositPot = async () => {
    const amount = parseFloat(potAmountStr) || 0;
    if (amount <= 0) return;
    await addMoneyToPot(Math.round(amount * 100), potNote);
    setPotAmountStr('');
    setPotNote('Pocket money');
    setIsPotModalOpen(false);
  };

  const handleSaveBudget = async () => {
    const amount = parseFloat(budgetAmountStr);
    if (isNaN(amount) || amount < 0) {
      await changeBudget(null);
    } else {
      await changeBudget(Math.round(amount * 100));
    }
    setIsBudgetModalOpen(false);
  };

  return (
    <aside className="w-full lg:w-96 flex flex-col gap-5 pt-5 pb-12 select-none">
      {/* 1. Family Pot Card (Family mode only) */}
      {mode === 'family' && (
        <div className="bg-white rounded-3xl p-5 border border-gray-200/90 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                Family Pot
              </span>
              <h3 className="text-2xl font-bold text-gray-900 mt-1 font-sans">
                {formatMoney(potTotalMinor, baseCurrency)}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">
                Money set aside to spend as a group
              </p>
            </div>
            <div className="w-14 h-14 -mr-1 -mt-1">
              <FamilyPotIllustration size={56} />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">
              Across {potContributions.length} contribution{potContributions.length === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              onClick={() => setIsPotModalOpen(true)}
              className="px-3.5 py-1.5 bg-[#0057FF] hover:bg-[#0046D1] text-white rounded-xl text-xs font-bold shadow-sm shadow-[#0057FF]/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <VectorIcon name="plus" size={13} />
              <span>Add money</span>
            </button>
          </div>

          {/* Quick contributions snippet */}
          {potContributions.length > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-100 space-y-1.5 max-h-24 overflow-y-auto pr-1">
              {potContributions.slice(0, 3).map((pot) => (
                <div key={pot.id} className="flex items-center justify-between text-xs py-0.5">
                  <span className="text-gray-700 font-medium truncate">
                    {pot.note} · <span className="text-gray-400">{pot.contributorName}</span>
                  </span>
                  <span className="font-bold text-gray-900 ml-2">
                    {formatMoney(pot.amountMinor, baseCurrency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Monthly Budget Card & Over Budget Alert */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
              Monthly Budget
            </span>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              {formatMoney(totalMonthlySpendMinor, baseCurrency)} of {formatMoney(budgetMinor, baseCurrency)} used
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setBudgetAmountStr((budgetMinor / 100).toString());
              setIsBudgetModalOpen(true);
            }}
            className="text-xs font-bold text-[#0057FF] hover:underline cursor-pointer"
          >
            Change
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div
            style={{ width: `${budgetPercent}%` }}
            className={`h-full rounded-full transition-all duration-500 ${
              isOverBudget ? 'bg-red-500' : 'bg-[#0057FF]'
            }`}
          />
        </div>

        {/* Over budget banner (Matches Android Screenshot page 7) */}
        {isOverBudget && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-red-700">
            <VectorIcon name="alert" size={17} color="#DC2626" className="mt-0.5" />
            <div>
              <p className="font-bold text-red-900">Over budget</p>
              <p className="mt-0.5 leading-snug">
                Total spent reached {formatMoney(totalMonthlySpendMinor, baseCurrency)} against a {formatMoney(budgetMinor, baseCurrency)} budget — <strong>{formatMoney(overAmountMinor, baseCurrency)} over</strong>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Balances & Settle Up (Family Mode) */}
      {mode === 'family' && (
        <div className="bg-white rounded-3xl p-5 border border-gray-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
              Settlements & Balances
            </span>
          </div>

          {settlementTransfers.length === 0 ? (
            /* All Square State (Matches Android Screenshot page 4) */
            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                <VectorIcon name="check" size={16} strokeWidth={3} />
              </div>
              <div>
                <p className="font-bold text-xs text-emerald-900">All square</p>
                <p className="text-[11px] text-emerald-700 font-medium">Nobody owes anybody. Enjoy it.</p>
              </div>
            </div>
          ) : (
            /* Pending transfers to settle */
            <div className="space-y-2">
              {settlementTransfers.map((transfer, idx) => {
                const fromMember = members.find((m) => m.uid === transfer.fromUid)?.displayName || 'Member';
                const toMember = members.find((m) => m.uid === transfer.toUid)?.displayName || 'Member';
                return (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 rounded-2xl flex items-center justify-between gap-2 border border-gray-100"
                  >
                    <div>
                      <p className="text-xs font-semibold text-gray-900">
                        <strong>{fromMember}</strong> owes <strong>{toMember}</strong>
                      </p>
                      <p className="text-xs font-bold text-[#0057FF] mt-0.5">
                        {formatMoney(transfer.amountMinor, baseCurrency)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        makeSettlement(transfer.fromUid, transfer.toUid, transfer.amountMinor, 'upi', 'Settled via Web App')
                      }
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Settle
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Donut Category Breakdown (Matches Android Screenshot page 8) */}
      {categoryList.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-gray-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
              Spend By Category
            </span>
            <span className="text-xs font-semibold text-gray-500">
              {categoryList.length} Categories
            </span>
          </div>

          <div className="flex items-center justify-center py-2 relative">
            <svg width="150" height="150" viewBox="0 0 100 100" className="transform -rotate-90">
              <circle cx="50" cy="50" r="45" fill="transparent" stroke="#F1F5F9" strokeWidth="10" />
              {donutSlices.map((slice, i) => (
                <circle
                  key={i}
                  cx="50"
                  cy="50"
                  r="45"
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth="10"
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  strokeLinecap="round"
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase font-bold text-gray-400">Total</span>
              <span className="text-sm font-bold text-gray-900">{categoryList.length}</span>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {donutSlices.map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span style={{ backgroundColor: cat.color }} className="w-2.5 h-2.5 rounded-full" />
                  <span className="text-gray-700 font-medium">{cat.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">{formatMoney(cat.totalMinor, baseCurrency)}</span>
                  <span className="font-bold text-gray-900 w-8 text-right font-mono">{cat.percent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Activity Log (Matches Android Screenshot page 18) */}
      {activities.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-gray-200/90 shadow-sm space-y-3">
          <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
            Activity Log
          </span>
          <p className="text-[11px] text-gray-500">Every change, kept forever</p>

          <div className="space-y-2.5 pt-2 max-h-56 overflow-y-auto pr-1">
            {activities.map((act) => (
              <div key={act.id} className="flex items-start gap-2.5 text-xs pb-2 border-b border-gray-50">
                <div className="w-5 h-5 rounded-full bg-blue-50 text-[#0057FF] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <VectorIcon name="plus" size={11} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{act.summary}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {new Intl.DateTimeFormat('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(act.at))}
                  </p>
                </div>
                {act.amountMinor != null && (
                  <span className="font-bold text-gray-900 text-xs font-sans">
                    {formatMoney(act.amountMinor, baseCurrency)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {isPotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-200 space-y-4">
            <h3 className="font-bold text-gray-900 text-base">Add to Family Pot</h3>
            <p className="text-xs text-gray-500">Contribute money to the shared household reserve.</p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase">Amount (₹)</label>
                <input
                  type="number"
                  autoFocus
                  value={potAmountStr}
                  onChange={(e) => setPotAmountStr(e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900 text-base"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase">Note</label>
                <input
                  type="text"
                  value={potNote}
                  onChange={(e) => setPotNote(e.target.value)}
                  placeholder="e.g. Monthly contribution, Pocket money"
                  className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm text-gray-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPotModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDepositPot}
                className="px-5 py-2 bg-[#0057FF] text-white text-xs font-bold rounded-xl shadow-md shadow-[#0057FF]/25 cursor-pointer"
              >
                Add Deposit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-200 space-y-4">
            <h3 className="font-bold text-gray-900 text-base">Monthly Budget</h3>
            <p className="text-xs text-gray-500">Set household spending limit for the month.</p>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase">Limit in ₹</label>
              <input
                type="number"
                autoFocus
                value={budgetAmountStr}
                onChange={(e) => setBudgetAmountStr(e.target.value)}
                placeholder="2000"
                className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900 text-base"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBudgetModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBudget}
                className="px-5 py-2 bg-[#0057FF] text-white text-xs font-bold rounded-xl shadow-md shadow-[#0057FF]/25 cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
