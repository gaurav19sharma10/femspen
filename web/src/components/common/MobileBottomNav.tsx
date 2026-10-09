import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Wallet,
  Target,
  PieChart,
  MoreHorizontal,
  Settings,
  Lock,
  Download,
  CalendarClock,
  User,
  X,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { useGoal } from '../../context/GoalContext';
import { useAuth } from '../../context/AuthContext';
import { useExpense } from '../../context/ExpenseContext';
import { formatCurrency } from '../../utils/currency';
import { exportExpensesToCSV } from '../../utils/export';

interface MobileBottomNavProps {
  onOpenFeed: () => void;
  onOpenWallet: () => void;
  onOpenGoals: () => void;
  onOpenAnalytics: () => void;
  onOpenSettings: () => void;
  onOpenRecurring: () => void;
  onOpenProfile: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenFeed,
  onOpenWallet,
  onOpenGoals,
  onOpenAnalytics,
  onOpenSettings,
  onOpenRecurring,
  onOpenProfile,
}) => {
  const { currentWallet, unreadNotificationCount, activeRequestState, pendingRequests } = useWallet();
  const { pendingApprovalCount } = useGoal();
  const { lockSession, userProfile } = useAuth();
  const { expenses, currentMode } = useExpense();

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const isHead = userProfile?.familyRole === 'head';
  const hasWalletNotification =
    unreadNotificationCount > 0 ||
    (isHead && pendingRequests.length > 0) ||
    activeRequestState === 'pending' ||
    (currentWallet?.balance !== undefined && currentWallet.balance < 0);

  const handleExport = () => {
    exportExpensesToCSV(expenses, `expenses_${currentMode}_${new Date().toISOString().slice(0, 10)}.csv`);
    setIsMoreMenuOpen(false);
  };

  return (
    <>
      {/* Mobile More Sheet */}
      <AnimatePresence>
        {isMoreMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-black/50 backdrop-blur-xs flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="bg-white rounded-t-3xl p-5 shadow-2xl border-t border-gray-200 safe-area-pb"
            >
              {/* Sheet Handle */}
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                <span className="font-bold text-sm text-gray-900">More Quick Actions</span>
                <button
                  onClick={() => setIsMoreMenuOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded-full"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    onOpenProfile();
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-800 text-left cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#0057FF] flex items-center justify-center font-bold">
                    <User size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">My Profile</div>
                    <div className="text-[10px] text-gray-500">Family & details</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    onOpenRecurring();
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-800 text-left cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                    <CalendarClock size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">Subscriptions</div>
                    <div className="text-[10px] text-gray-500">Recurring bills</div>
                  </div>
                </button>

                <button
                  onClick={handleExport}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-800 text-left cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                    <Download size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">Export CSV</div>
                    <div className="text-[10px] text-gray-500">Download report</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    onOpenSettings();
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-800 text-left cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                    <Settings size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">Settings</div>
                    <div className="text-[10px] text-gray-500">Currency & prefs</div>
                  </div>
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    lockSession();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-blue-50 text-[#0057FF] font-bold text-xs hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <Lock size={15} />
                  <span>Lock Vault (Enter 2FA PIN)</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Persistent Bottom Bar on Smartphones */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white/95 backdrop-blur-lg border-t border-gray-200/80 px-2 py-2 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        {/* Expenses Feed */}
        <button
          onClick={onOpenFeed}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-gray-600 hover:text-[#0057FF] transition-colors cursor-pointer"
        >
          <FileText size={19} />
          <span className="text-[10px] font-bold leading-none">Expenses</span>
        </button>

        {/* Wallet */}
        <button
          onClick={onOpenWallet}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-gray-600 hover:text-emerald-600 transition-colors cursor-pointer relative"
        >
          <div className="relative">
            <Wallet size={19} className="text-emerald-600" />
            {hasWalletNotification && (
              <span className="w-2 h-2 rounded-full bg-amber-500 absolute -top-0.5 -right-0.5 ring-2 ring-white animate-pulse" />
            )}
          </div>
          <span className="text-[10px] font-bold leading-none text-emerald-700">Wallet</span>
        </button>

        {/* Goals */}
        <button
          onClick={onOpenGoals}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-gray-600 hover:text-[#0057FF] transition-colors cursor-pointer relative"
        >
          <div className="relative">
            <Target size={19} className="text-indigo-600" />
            {pendingApprovalCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 absolute -top-0.5 -right-0.5 ring-2 ring-white animate-pulse" />
            )}
          </div>
          <span className="text-[10px] font-bold leading-none text-indigo-700">Goals</span>
        </button>

        {/* Analytics */}
        <button
          onClick={onOpenAnalytics}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-gray-600 hover:text-[#0057FF] transition-colors cursor-pointer"
        >
          <PieChart size={19} />
          <span className="text-[10px] font-bold leading-none">Analytics</span>
        </button>

        {/* More Menu */}
        <button
          onClick={() => setIsMoreMenuOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <MoreHorizontal size={19} />
          <span className="text-[10px] font-bold leading-none">More</span>
        </button>
      </nav>
    </>
  );
};
