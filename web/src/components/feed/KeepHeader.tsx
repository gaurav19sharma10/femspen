import React from 'react';
import { motion } from 'framer-motion';
import { useExpense } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  X,
  User,
  Users,
  PieChart,
  CalendarClock,
  Lock,
  Settings,
  Download,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { exportExpensesToCSV } from '../../utils/export';
import { FemSpenLogo } from '../common/VectorArt';

interface KeepHeaderProps {
  onOpenAnalytics: () => void;
  onOpenRecurring: () => void;
  onOpenSettings: () => void;
}

export const KeepHeader: React.FC<KeepHeaderProps> = ({
  onOpenAnalytics,
  onOpenRecurring,
  onOpenSettings,
}) => {
  const { currentMode, setCurrentMode, searchQuery, setSearchQuery, stats, expenses } = useExpense();
  const { lockSession, userProfile } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-[#F8F7F4]/90 backdrop-blur-md border-b border-gray-200/60 px-4 py-3 transition-colors">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand Logo & Mode Pill Switcher */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-2.5">
            <FemSpenLogo size={36} />
            <div>
              <h1 className="text-base font-black text-gray-900 leading-tight">FemSpen</h1>
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">
                Real-time Ledger
              </span>
            </div>
          </div>

          {/* Mode Pill Toggle (Google Keep style) */}
          <div className="bg-gray-200/80 p-1 rounded-2xl flex items-center shadow-inner relative">
            <button
              onClick={() => setCurrentMode('individual')}
              className={`relative z-10 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentMode === 'individual' ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {currentMode === 'individual' && (
                <motion.div
                  layoutId="mode-pill-bg"
                  className="absolute inset-0 bg-white rounded-xl shadow-xs"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <User size={13} className="relative z-10 text-[#0057FF]" />
              <span className="relative z-10">Individual</span>
            </button>

            <button
              onClick={() => setCurrentMode('family')}
              className={`relative z-10 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentMode === 'family' ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {currentMode === 'family' && (
                <motion.div
                  layoutId="mode-pill-bg"
                  className="absolute inset-0 bg-white rounded-xl shadow-xs"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <Users size={13} className="relative z-10 text-emerald-600" />
              <span className="relative z-10">Family</span>
            </button>
          </div>
        </div>

        {/* Google Keep Search Omnibar */}
        <div className="w-full md:flex-1 max-w-xl">
          <div className="relative flex items-center bg-white/90 hover:bg-white focus-within:bg-white border border-gray-200/80 rounded-2xl shadow-xs transition-all focus-within:ring-2 focus-within:ring-[#0057FF]/20 focus-within:border-[#0057FF]">
            <Search size={18} className="absolute left-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expenses, notes, categories, tags..."
              className="w-full pl-10 pr-9 py-2.5 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-gray-400 hover:text-gray-600 p-1 rounded-full cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons & Quick Stats */}
        <div className="flex items-center gap-1.5 self-end md:self-auto">
          <div className="hidden lg:flex flex-col text-right pr-2">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              {currentMode === 'individual' ? 'My Spend' : 'Family Spend'}
            </span>
            <span className="text-sm font-bold text-gray-900">
              {formatCurrency(stats.monthlySpend, userProfile?.currency)}
            </span>
          </div>

          <button
            onClick={onOpenAnalytics}
            className="p-2.5 bg-white hover:bg-gray-100 border border-gray-200/80 rounded-xl text-gray-700 hover:text-[#0057FF] transition-colors cursor-pointer shadow-xs"
            title="Analytics & Charts"
          >
            <PieChart size={17} />
          </button>

          <button
            onClick={onOpenRecurring}
            className="p-2.5 bg-white hover:bg-gray-100 border border-gray-200/80 rounded-xl text-gray-700 hover:text-[#0057FF] transition-colors cursor-pointer shadow-xs"
            title="Recurring Subscriptions"
          >
            <CalendarClock size={17} />
          </button>

          <button
            onClick={() => exportExpensesToCSV(expenses, `expenses_${currentMode}_${new Date().toISOString().slice(0, 10)}.csv`)}
            className="p-2.5 bg-white hover:bg-gray-100 border border-gray-200/80 rounded-xl text-gray-700 hover:text-[#0057FF] transition-colors cursor-pointer shadow-xs"
            title="Export CSV"
          >
            <Download size={17} />
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2.5 bg-white hover:bg-gray-100 border border-gray-200/80 rounded-xl text-gray-700 hover:text-[#0057FF] transition-colors cursor-pointer shadow-xs"
            title="Settings & Currency"
          >
            <Settings size={17} />
          </button>

          <button
            onClick={lockSession}
            className="p-2.5 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/60 rounded-xl text-[#0057FF] transition-colors cursor-pointer shadow-xs"
            title="Lock Vault (2FA PIN)"
          >
            <Lock size={17} />
          </button>
        </div>
      </div>
    </header>
  );
};
