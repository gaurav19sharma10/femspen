import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ExpenseProvider } from './context/ExpenseContext';
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
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 pt-3">
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
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl bg-[#0057FF] hover:bg-[#0046D1] text-white shadow-xl shadow-[#0057FF]/35 flex items-center justify-center cursor-pointer transition-colors"
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
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <ExpenseProvider>
        <MainAppContent />
      </ExpenseProvider>
    </AuthProvider>
  );
}

export default App;
