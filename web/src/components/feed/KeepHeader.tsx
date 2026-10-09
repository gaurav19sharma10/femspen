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
  Wallet,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { exportExpensesToCSV } from '../../utils/export';
import { FemSpenLogo } from '../common/VectorArt';
import { useGoal } from '../../context/GoalContext';
import { useWallet } from '../../context/WalletContext';

interface KeepHeaderProps {
  onOpenAnalytics: () => void;
  onOpenRecurring: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenGoals: () => void;
  onOpenWallet: () => void;
}

export const KeepHeader: React.FC<KeepHeaderProps> = ({
  onOpenAnalytics,
  onOpenRecurring,
  onOpenSettings,
  onOpenProfile,
  onOpenGoals,
  onOpenWallet,
}) => {
  const { currentMode, setCurrentMode, searchQuery, setSearchQuery, stats, expenses } = useExpense();
  const { lockSession, userProfile } = useAuth();
  const { pendingApprovalCount } = useGoal();
  const { pendingRequests, activeRequestState, unreadNotificationCount, currentWallet } = useWallet();

  const isHead = userProfile?.familyRole === 'head';
  const hasWalletNotification =
    unreadNotificationCount > 0 ||
    (isHead && pendingRequests.length > 0) ||
    activeRequestState === 'pending' ||
    (currentWallet?.balance !== undefined && currentWallet.balance < 0);


  return (
    <header className="sticky top-0 z-30 bg-[#F8F7F4]/95 backdrop-blur-md border-b border-gray-200/60 px-3 sm:px-4 py-2 sm:py-3 transition-colors">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-3">
        {/* Brand Logo & Mode Pill Switcher */}
        <div className="flex items-center justify-between w-full md:w-auto gap-2">
          <div className="flex items-center gap-2">
            <FemSpenLogo size={32} />
            <div>
              <h1 className="text-sm sm:text-base font-black text-gray-900 leading-tight">FemSpen</h1>
              <span className="text-[9px] sm:text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">
                {currentMode === 'individual' ? 'Personal' : 'Family'}
              </span>
            </div>
          </div>

          {/* Mode Pill Toggle (Google Keep style) */}
          <div className="bg-gray-200/80 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl flex items-center shadow-inner relative">
            <button
              onClick={() => setCurrentMode('individual')}
              className={`relative z-10 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                currentMode === 'individual' ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {currentMode === 'individual' && (
                <motion.div
                  layoutId="mode-pill-bg"
                  className="absolute inset-0 bg-white rounded-lg sm:rounded-xl shadow-xs"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <User size={12} className="relative z-10 text-[#0057FF]" />
              <span className="relative z-10">Me</span>
            </button>

            <button
              onClick={() => setCurrentMode('family')}
              className={`relative z-10 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                currentMode === 'family' ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {currentMode === 'family' && (
                <motion.div
                  layoutId="mode-pill-bg"
                  className="absolute inset-0 bg-white rounded-lg sm:rounded-xl shadow-xs"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <Users size={12} className="relative z-10 text-emerald-600" />
              <span className="relative z-10">Family</span>
            </button>
          </div>

          {/* Mobile Profile Avatar Trigger (tap opens Profile directly on phones) */}
          <button
            onClick={onOpenProfile}
            className="md:hidden flex items-center justify-center p-0.5 rounded-full border border-gray-200/80 bg-white shadow-xs cursor-pointer"
            title="Profile & Family Hub"
          >
            <div className="w-7 h-7 rounded-full bg-blue-100 text-[#0057FF] font-bold text-xs flex items-center justify-center overflow-hidden shrink-0">
              {userProfile?.photoUrl ? (
                <img src={userProfile.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                (userProfile?.displayName || userProfile?.email || 'U')[0].toUpperCase()
              )}
            </div>
          </button>
        </div>

        {/* Google Keep Search Omnibar */}
        <div className="w-full md:flex-1 max-w-xl">
          <div className="relative flex items-center bg-white hover:bg-white focus-within:bg-white border border-gray-200/80 rounded-2xl shadow-xs transition-all focus-within:ring-2 focus-within:ring-[#0057FF]/20 focus-within:border-[#0057FF]">
            <Search size={16} className="absolute left-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expenses, notes, categories..."
              className="w-full pl-9 pr-8 py-2 sm:py-2.5 bg-transparent text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-gray-400 hover:text-gray-600 p-1 rounded-full cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons & Quick Stats (Desktop & Tablet only - Mobile uses MobileBottomNav!) */}
        <div className="hidden md:flex items-center gap-1.5 self-end md:self-auto">
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
            onClick={onOpenWallet}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-50 to-teal-50/80 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200/80 rounded-xl text-gray-800 hover:text-emerald-700 transition-all cursor-pointer shadow-xs relative"
            title="My Wallet & Family Ledger"
          >
            <Wallet size={16} className="text-emerald-600" />
            <span className="text-xs font-bold hidden sm:inline">Wallet</span>
            {hasWalletNotification && (
              <span className="w-2 h-2 rounded-full bg-amber-500 absolute -top-0.5 -right-0.5 ring-2 ring-white animate-pulse" />
            )}
          </button>

          <button
            onClick={onOpenGoals}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50/80 hover:from-blue-100 hover:to-indigo-100 border border-blue-200/80 rounded-xl text-gray-800 hover:text-[#0057FF] transition-all cursor-pointer shadow-xs relative"
            title="Goals & Target Savings"
          >
            <span className="text-sm">🎯</span>
            <span className="text-xs font-bold hidden sm:inline">Goals</span>
            {pendingApprovalCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 absolute -top-0.5 -right-0.5 ring-2 ring-white animate-pulse" />
            )}
          </button>

          <button
            onClick={() => exportExpensesToCSV(expenses, `expenses_${currentMode}_${new Date().toISOString().slice(0, 10)}.csv`)}
            className="p-2.5 bg-white hover:bg-gray-100 border border-gray-200/80 rounded-xl text-gray-700 hover:text-[#0057FF] transition-colors cursor-pointer shadow-xs"
            title="Export CSV"
          >
            <Download size={17} />
          </button>

          {/* Profile & Family Hub Button */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200/80 rounded-xl cursor-pointer shadow-xs transition-colors"
            title="Profile & Family Hub"
          >
            <div className="w-6 h-6 rounded-full bg-blue-100 text-[#0057FF] font-bold text-xs flex items-center justify-center overflow-hidden shrink-0">
              {userProfile?.photoUrl ? (
                <img src={userProfile.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                (userProfile?.displayName || userProfile?.email || 'U')[0].toUpperCase()
              )}
            </div>
            <span className="text-xs font-bold text-gray-800 max-w-[90px] truncate hidden sm:inline">
              {userProfile?.displayName || 'Profile'}
            </span>
            {userProfile?.familyRole === 'head' && (
              <span className="text-[10px] text-amber-500 font-bold" title="Head of Family">👑</span>
            )}
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
