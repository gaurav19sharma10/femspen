import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ExpenseProvider, useExpense, type UnifiedExpense } from './context/ExpenseContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { KeepHeader } from './components/feed/KeepHeader';
import { KeepQuickAdd } from './components/feed/KeepQuickAdd';
import { KeepExpenseGrid } from './components/feed/KeepExpenseGrid';
import { LiveInsightsSidebar } from './components/sidebar/LiveInsightsSidebar';
import { ExpenseEditModal } from './components/feed/ExpenseEditModal';
import { FamilyManagementModal } from './components/family/FamilyManagementModal';
import { RvsLogo } from './components/vector/RvsLogo';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [editingExpense, setEditingExpense] = useState<UnifiedExpense | null>(null);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center space-y-4">
        <RvsLogo size={64} className="animate-pulse" />
        <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">
          Loading RVS Expences...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-gray-900 flex flex-col font-sans selection:bg-[#0057FF]/20">
      {/* Sticky Google Keep Header */}
      <KeepHeader onOpenFamilyModal={() => setIsFamilyModalOpen(true)} />

      {/* Main Full-Width Split Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-4">
        <div className="flex flex-col lg:flex-row items-start gap-8">
          {/* Left / Center Area: Google Keep Expense Notes Feed */}
          <div className="flex-1 w-full min-w-0">
            {/* Quick Add Expander */}
            <KeepQuickAdd />

            {/* Google Keep Masonry Cards Grid (Pinned & Others) */}
            <div className="mt-4">
              <KeepExpenseGrid onEditExpense={(exp) => setEditingExpense(exp)} />
            </div>
          </div>

          {/* Right Panel: Live Interactive Insights & Family Pot */}
          <div className="w-full lg:w-96 flex-shrink-0">
            <LiveInsightsSidebar />
          </div>
        </div>
      </main>

      {/* Edit Expense Modal */}
      {editingExpense && (
        <ExpenseEditModal
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
        />
      )}

      {/* Family Management Modal */}
      {isFamilyModalOpen && (
        <FamilyManagementModal onClose={() => setIsFamilyModalOpen(false)} />
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
