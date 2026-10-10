import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GoalProvider } from './context/GoalContext';
import { ExpenseProvider, useExpense } from './context/ExpenseContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { PinLockScreen } from './components/auth/PinLockScreen';
import { PinSetupModal } from './components/auth/PinSetupModal';
import { KeepHeader } from './components/feed/KeepHeader';
import { FilterPills } from './components/feed/FilterPills';
import { DateGroupFeed } from './components/feed/DateGroupFeed';
import { ExpenseEditor } from './components/feed/ExpenseEditor';
import { SpendCharts } from './components/analytics/SpendCharts';
import { RecurringBills } from './components/recurring/RecurringBills';
import { SettingsModal } from './components/settings/SettingsModal';
import { ProfileModal } from './components/profile/ProfileModal';
import { GoalsDashboard } from './components/goals/GoalsDashboard';
import { CreateGoalWizard } from './components/goals/CreateGoalWizard';
import { GoalsFeedWidget } from './components/goals/GoalsFeedWidget';
import { RoundUpToast } from './components/goals/RoundUpToast';
import { WalletProvider } from './context/WalletContext';
import { WalletPill } from './components/wallet/WalletPill';
import { WalletModal } from './components/wallet/WalletModal';
import { AddMoneyModal } from './components/wallet/AddMoneyModal';
import { TransferMoneyModal } from './components/wallet/TransferMoneyModal';
import { RequestMoneyModal } from './components/wallet/RequestMoneyModal';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { Expense } from './types';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, isPinConfigured, isPinLocked, loading } = useAuth();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isRecurringOpen, setIsRecurringOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isGoalsOpen, setIsGoalsOpen] = useState(false);
  const [isCreateGoalOpen, setIsCreateGoalOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isWalletAddMoneyOpen, setIsWalletAddMoneyOpen] = useState(false);
  const [isWalletTransferOpen, setIsWalletTransferOpen] = useState(false);
  const [isWalletRequestOpen, setIsWalletRequestOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-[#0057FF] flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-[#0057FF]/30 animate-pulse">
          F
        </div>
        <p className="text-xs font-semibold text-gray-400 mt-4 tracking-wider uppercase">
          Loading FemSpen...
        </p>
      </div>
    );
  }

  // Not signed in
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // User registered but has not set up 2FA PIN yet
  if (!isPinConfigured) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
        <PinSetupModal />
      </div>
    );
  }

  // User is signed in and PIN configured, but session is locked
  if (isPinLocked) {
    return <PinLockScreen />;
  }

  const handleOpenNew = () => {
    setEditingExpense(null);
    setIsEditorOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditorOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-gray-900 flex flex-col antialiased selection:bg-[#0057FF]/20">
      {/* Sticky Google Keep Header */}
      <KeepHeader
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenRecurring={() => setIsRecurringOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenGoals={() => setIsGoalsOpen(true)}
        onOpenWallet={() => setIsWalletOpen(true)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 pt-2.5 sm:pt-3 pb-28 md:pb-8">
        {/* Horizontal Wallet Pill Widget */}
        <WalletPill
          onOpenWallet={() => setIsWalletOpen(true)}
          onOpenAddMoney={() => setIsWalletAddMoneyOpen(true)}
          onOpenTransferMoney={() => setIsWalletTransferOpen(true)}
          onOpenRequestMoney={() => setIsWalletRequestOpen(true)}
          onOpenTransactions={() => setIsWalletOpen(true)}
        />

        {/* Compact Goals Progress Widget */}
        <GoalsFeedWidget
          onOpenGoals={() => setIsGoalsOpen(true)}
          onCreateGoal={() => setIsCreateGoalOpen(true)}
        />

        {/* Category & Color Filter Pills */}
        <FilterPills />

        {/* Date Grouped Masonry Feed */}
        <div className="mt-4">
          <DateGroupFeed
            onOpenNew={handleOpenNew}
            onEditExpense={handleEditExpense}
          />
        </div>
      </main>

      {/* Floating Action Button (FAB) for Quick Note Addition */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleOpenNew}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#0057FF] hover:bg-[#0046D1] text-white shadow-xl shadow-[#0057FF]/35 flex items-center justify-center cursor-pointer transition-colors"
        title="Record New Expense"
      >
        <Plus size={26} strokeWidth={2.5} />
      </motion.button>

      {/* Expense Editor Modal */}
      <ExpenseEditor
        isOpen={isEditorOpen}
        initialExpense={editingExpense}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingExpense(null);
        }}
      />

      {/* Visual Spend Analytics Modal */}
      {isAnalyticsOpen && (
        <SpendCharts onClose={() => setIsAnalyticsOpen(false)} />
      )}

      {/* Recurring Subscriptions Modal */}
      {isRecurringOpen && (
        <RecurringBills
          onClose={() => setIsRecurringOpen(false)}
          onEditExpense={handleEditExpense}
          onOpenNew={handleOpenNew}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}

      {/* Profile & Family Hub Modal */}
      {isProfileOpen && (
        <ProfileModal onClose={() => setIsProfileOpen(false)} />
      )}

      {/* Goals Dashboard Modal */}
      {isGoalsOpen && (
        <GoalsDashboard
          isOpen={isGoalsOpen}
          onClose={() => setIsGoalsOpen(false)}
          onRequestMoney={() => {
            setIsGoalsOpen(false);
            setIsWalletRequestOpen(true);
          }}
        />
      )}

      {/* Standalone Goal Creation Wizard */}
      {isCreateGoalOpen && (
        <CreateGoalWizard
          isOpen={isCreateGoalOpen}
          onClose={() => setIsCreateGoalOpen(false)}
          onGoalCreated={() => {
            setIsGoalsOpen(true);
          }}
        />
      )}

      {/* Subtle Floating Round-Up Savings Toast */}
      <RoundUpToast onOpenGoals={() => setIsGoalsOpen(true)} />

      {/* Primary Wallet Dashboard Modal */}
      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
      />

      {/* Quick Add Money Modal */}
      <AddMoneyModal
        isOpen={isWalletAddMoneyOpen}
        onClose={() => setIsWalletAddMoneyOpen(false)}
      />

      {/* Quick Transfer Money Modal */}
      <TransferMoneyModal
        isOpen={isWalletTransferOpen}
        onClose={() => setIsWalletTransferOpen(false)}
      />

      {/* Quick Request Money Modal */}
      <RequestMoneyModal
        isOpen={isWalletRequestOpen}
        onClose={() => setIsWalletRequestOpen(false)}
      />

      {/* Smartphone Bottom Navigation Bar (Hidden on desktop) */}
      <MobileBottomNav
        onOpenFeed={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onOpenWallet={() => setIsWalletOpen(true)}
        onOpenGoals={() => setIsGoalsOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenRecurring={() => setIsRecurringOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <ExpenseProvider>
        <WalletProvider>
          <GoalProvider>
            <MainAppContent />
          </GoalProvider>
        </WalletProvider>
      </ExpenseProvider>
    </AuthProvider>
  );
}

export default App;
