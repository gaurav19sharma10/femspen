import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';
import { useExpense } from '../../context/ExpenseContext';
import {
  Wallet as WalletIcon,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  Send,
  Coins,
  ChevronDown,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface WalletPillProps {
  onOpenWallet: () => void;
  onOpenAddMoney: () => void;
  onOpenTransferMoney: () => void;
  onOpenRequestMoney: () => void;
  onOpenTransactions?: () => void;
}

export const WalletPill: React.FC<WalletPillProps> = ({
  onOpenWallet,
  onOpenAddMoney,
  onOpenTransferMoney,
  onOpenRequestMoney,
}) => {
  const {
    currentWallet,
    activeRequestState,
    pendingRequests,
    myRequests,
    acknowledgeRequestState,
    familyPolicy,
  } = useWallet();
  const { userProfile } = useAuth();
  const { currentMode } = useExpense();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isFamilyMode = currentMode === 'family' && Boolean(userProfile?.familyId);
  const isHead = userProfile?.familyRole === 'head';
  const balance = currentWallet?.balance ?? 0;
  const isNegative = balance < 0;

  // Determine circular button visual style based on request state
  let buttonBg = 'bg-[#0057FF] text-white hover:bg-[#0046D1]';
  let statusBadge = null;

  if (activeRequestState === 'pending') {
    buttonBg = 'bg-amber-500 text-white hover:bg-amber-600 animate-pulse';
    statusBadge = (
      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 absolute -top-1 -right-1 ring-2 ring-white" />
    );
  } else if (activeRequestState === 'approved') {
    buttonBg = 'bg-emerald-500 text-white hover:bg-emerald-600';
    statusBadge = (
      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -top-1 -right-1 ring-2 ring-white" />
    );
  } else if (activeRequestState === 'rejected') {
    buttonBg = 'bg-rose-500 text-white hover:bg-rose-600';
    statusBadge = (
      <span className="w-2.5 h-2.5 rounded-full bg-rose-400 absolute -top-1 -right-1 ring-2 ring-white" />
    );
  }

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeRequestState === 'approved' || activeRequestState === 'rejected') {
      acknowledgeRequestState();
    }
    setIsMenuOpen((prev) => !prev);
  };

  return (
    <div className="relative mb-3">
      {/* Horizontal Pill Bar */}
      <div
        onClick={onOpenWallet}
        className={`w-full p-2.5 sm:p-3 rounded-2xl sm:rounded-full border transition-all cursor-pointer shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
          isNegative
            ? 'bg-rose-50/90 border-rose-300 hover:border-rose-400 text-rose-950'
            : 'bg-white hover:bg-gray-50/90 border-gray-200/90 hover:border-[#0057FF]/40 text-gray-900'
        }`}
      >
        {/* Left: Icon, Label, and Balance */}
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isNegative ? 'bg-rose-100 text-rose-600' : 'bg-blue-50 text-[#0057FF]'
            }`}
          >
            <WalletIcon size={18} />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              My Wallet
            </span>
            <span
              className={`text-base sm:text-lg font-black tracking-tight ${
                isNegative ? 'text-rose-600' : 'text-gray-900'
              }`}
            >
              {isNegative ? `Balance: −₹${Math.abs(balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : formatCurrency(balance, userProfile?.currency)}
            </span>
          </div>

          {/* Pending Requests Tag (if any) */}
          {isHead && pendingRequests.length > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              <Clock size={10} />
              {pendingRequests.length} request{pendingRequests.length !== 1 ? 's' : ''} pending
            </span>
          )}

          {!isHead && activeRequestState === 'pending' && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              <Clock size={10} />
              Request Pending
            </span>
          )}

          {!isHead && activeRequestState === 'approved' && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <CheckCircle2 size={10} />
              Request Approved!
            </span>
          )}

          {!isHead && activeRequestState === 'rejected' && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
              <XCircle size={10} />
              Request Declined
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-2 self-stretch sm:self-auto">
          <span className="text-[11px] font-semibold text-gray-400 sm:hidden">Tap for details</span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePlusClick}
              className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-xs ${buttonBg}`}
              title="Wallet Actions"
            >
              <Plus size={16} strokeWidth={2.5} />
              {statusBadge}
            </button>
          </div>
        </div>
      </div>

      {/* Negative Balance Warning Banner */}
      {isNegative && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 px-3.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-2 font-semibold"
        >
          <AlertTriangle size={14} className="shrink-0 text-rose-600" />
          <span>
            Your spending is ₹{Math.abs(balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })} above your available wallet balance.
            {isFamilyMode && !isHead && ' Your family head has been notified.'}
          </span>
        </motion.div>
      )}

      {/* Action Dropdown Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(false);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 z-50 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 text-xs text-gray-700 divide-y divide-gray-100"
            >
              {/* Menu items for Family Head */}
              {isFamilyMode && isHead && (
                <div className="py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      onOpenAddMoney();
                    }}
                    className="w-full px-3.5 py-2 text-left font-semibold hover:bg-gray-50 flex items-center gap-2 text-gray-800 cursor-pointer"
                  >
                    <Coins size={15} className="text-[#0057FF]" />
                    <span>Add Money</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      onOpenTransferMoney();
                    }}
                    className="w-full px-3.5 py-2 text-left font-semibold hover:bg-gray-50 flex items-center gap-2 text-gray-800 cursor-pointer"
                  >
                    <Send size={15} className="text-emerald-600" />
                    <span>Transfer Money</span>
                  </button>
                </div>
              )}

              {/* Menu items for Family Member */}
              {isFamilyMode && !isHead && (
                <div className="py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      onOpenRequestMoney();
                    }}
                    className="w-full px-3.5 py-2 text-left font-semibold hover:bg-gray-50 flex items-center gap-2 text-gray-800 cursor-pointer"
                  >
                    <Send size={15} className="text-amber-600" />
                    <span>Request Money</span>
                  </button>

                  {familyPolicy?.allowMemberSelfFunding && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(false);
                        onOpenAddMoney();
                      }}
                      className="w-full px-3.5 py-2 text-left font-semibold hover:bg-gray-50 flex items-center gap-2 text-gray-800 cursor-pointer"
                    >
                      <Coins size={15} className="text-[#0057FF]" />
                      <span>Add Money</span>
                    </button>
                  )}
                </div>
              )}

              {/* Menu items for Individual Mode */}
              {!isFamilyMode && (
                <div className="py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      onOpenAddMoney();
                    }}
                    className="w-full px-3.5 py-2 text-left font-semibold hover:bg-gray-50 flex items-center gap-2 text-gray-800 cursor-pointer"
                  >
                    <Coins size={15} className="text-[#0057FF]" />
                    <span>Add Money</span>
                  </button>
                </div>
              )}

              {/* Common: View Transactions */}
              <div className="py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    onOpenWallet();
                  }}
                  className="w-full px-3.5 py-2 text-left font-semibold hover:bg-gray-50 flex items-center gap-2 text-gray-800 cursor-pointer"
                >
                  <History size={15} className="text-gray-500" />
                  <span>View Wallet & History</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
