import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';
import { useExpense } from '../../context/ExpenseContext';
import { WalletTransaction, WalletMoneyRequest } from '../../types';
import {
  X,
  Wallet as WalletIcon,
  Coins,
  Send,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Settings,
  Bell,
  Download,
  CalendarClock,
  ShieldCheck,
  Filter,
  BarChart3,
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { AddMoneyModal } from './AddMoneyModal';
import { TransferMoneyModal } from './TransferMoneyModal';
import { RequestMoneyModal } from './RequestMoneyModal';
import { WalletSettingsModal } from './WalletSettingsModal';
import { RecurringAllowanceModal } from './RecurringAllowanceModal';
import { WalletNotificationsModal } from './WalletNotificationsModal';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const {
    currentWallet,
    allFamilyWallets,
    transactions,
    pendingRequests,
    myRequests,
    approveMoneyRequest,
    rejectMoneyRequest,
    cancelMoneyRequest,
    negativeBalanceMembers,
    unreadNotificationCount,
    familyPolicy,
  } = useWallet();
  const { userProfile, family, user } = useAuth();
  const { currentMode } = useExpense();

  const isFamilyMode = currentMode === 'family' && Boolean(userProfile?.familyId);
  const isHead = userProfile?.familyRole === 'head';

  // Sub-modal state
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferTargetUid, setTransferTargetUid] = useState<string | undefined>(undefined);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRecurringOpen, setIsRecurringOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Tab: Transactions vs Reports
  const [activeTab, setActiveTab] = useState<'ledger' | 'reports'>('ledger');

  // Filter state for transactions
  const [filterType, setFilterType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'this_month' | 'last_30'>('this_month');

  // Rejection modal prompt
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  if (!isOpen) return null;

  const balance = currentWallet?.balance ?? 0;
  const isNegative = balance < 0;

  // Filtered transactions based on date range and type
  const filteredTransactions = useMemo(() => {
    let list = transactions;

    // Date range filter
    if (dateRange === 'this_month') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      list = list.filter((tx) => tx.createdAt >= startOfMonth.getTime());
    } else if (dateRange === 'last_30') {
      const thirtyDaysAgo = Date.now() - 30 * 86400000;
      list = list.filter((tx) => tx.createdAt >= thirtyDaysAgo);
    }

    // Type filter
    if (filterType === 'added') {
      list = list.filter((tx) => tx.type === 'TOP_UP' || tx.type === 'ONLINE_TOP_UP');
    } else if (filterType === 'received') {
      list = list.filter((tx) => tx.type === 'TRANSFER_IN' || tx.type === 'REQUEST_APPROVED');
    } else if (filterType === 'expenses') {
      list = list.filter((tx) => tx.type === 'EXPENSE_DEBIT');
    } else if (filterType === 'transfers') {
      list = list.filter((tx) => tx.type === 'TRANSFER_IN' || tx.type === 'TRANSFER_OUT');
    } else if (filterType === 'adjustments') {
      list = list.filter((tx) => tx.type === 'EXPENSE_ADJUSTMENT' || tx.type === 'EXPENSE_REVERSAL' || tx.type === 'ADJUSTMENT');
    }

    return list;
  }, [transactions, dateRange, filterType]);

  // Financial Summary Metrics
  const summaryMetrics = useMemo(() => {
    let totalReceived = 0;
    let totalExpenses = 0;
    let totalTransfersSent = 0;
    let totalTransfersReceived = 0;

    transactions.forEach((tx) => {
      if (tx.direction === 'IN') {
        totalReceived += tx.amount;
        if (tx.type === 'TRANSFER_IN') totalTransfersReceived += tx.amount;
      } else {
        if (tx.type === 'EXPENSE_DEBIT') {
          totalExpenses += tx.amount;
        } else if (tx.type === 'TRANSFER_OUT') {
          totalTransfersSent += tx.amount;
        }
      }
    });

    return {
      totalReceived,
      totalExpenses,
      totalTransfersSent,
      totalTransfersReceived,
    };
  }, [transactions]);

  // Export CSV function (Section 4.E)
  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'Type', 'Direction', 'Amount', 'Balance Snapshot', 'Description', 'Notes', 'Related Member'];
    const rows = filteredTransactions.map((tx) => [
      tx.id,
      new Date(tx.createdAt).toISOString(),
      tx.type,
      tx.direction,
      tx.amount,
      tx.resultingBalance,
      `"${tx.description.replace(/"/g, '""')}"`,
      `"${(tx.notes || '').replace(/"/g, '""')}"`,
      tx.relatedMemberName || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `wallet_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApprove = async (requestId: string) => {
    try {
      await approveMoneyRequest(requestId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingRequestId) return;
    try {
      await rejectMoneyRequest(rejectingRequestId, rejectionReason.trim() || undefined);
      setRejectingRequestId(null);
      setRejectionReason('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-[#F8F7F4] rounded-3xl max-w-4xl w-full shadow-2xl border border-gray-200/80 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Top Header */}
        <div className="px-6 py-4.5 bg-white border-b border-gray-200/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0057FF]/10 text-[#0057FF] flex items-center justify-center font-bold text-xl shadow-inner">
              <WalletIcon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-gray-900 leading-tight">My Wallet</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0057FF] border border-blue-200 uppercase tracking-wider">
                  {isFamilyMode ? (isHead ? '👑 Family Head' : 'Family Member') : 'Individual'}
                </span>
                {currentWallet?.status === 'frozen' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                    Frozen
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {isFamilyMode
                  ? 'Real-time family wallet ledger and transfer control'
                  : 'Personal expense wallet ledger'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Notifications Button */}
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 rounded-xl text-gray-700 relative cursor-pointer"
              title="Wallet Alerts"
            >
              <Bell size={17} />
              {unreadNotificationCount > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute -top-0.5 -right-0.5 ring-2 ring-white animate-pulse" />
              )}
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 rounded-xl text-gray-700 hover:text-[#0057FF] transition-colors cursor-pointer"
              title="Wallet Limits & Policies"
            >
              <Settings size={17} />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-gray-700">
          {/* SECTION A: Balance Card */}
          <div
            className={`p-6 rounded-3xl text-white shadow-xl space-y-5 transition-all ${
              isNegative
                ? 'bg-gradient-to-br from-rose-900 via-rose-800 to-red-950'
                : 'bg-gradient-to-br from-slate-900 via-gray-900 to-blue-950'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                  Available Wallet Balance
                </span>
                <span className="text-3xl sm:text-4xl font-black text-white mt-1 block">
                  {isNegative ? `Balance: −₹${Math.abs(balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : formatCurrency(balance, userProfile?.currency)}
                </span>
              </div>

              {/* Date Filter for Balance Card */}
              <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-xl self-start sm:self-auto backdrop-blur-md">
                {[
                  { id: 'this_month', label: 'This Month' },
                  { id: 'last_30', label: '30 Days' },
                  { id: 'all', label: 'All Time' },
                ].map((range) => (
                  <button
                    key={range.id}
                    onClick={() => setDateRange(range.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      dateRange === range.id ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Negative balance warning alert inside card (Section 3 & 4) */}
            {isNegative && (
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-xs flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-300 shrink-0" />
                <span>
                  Your spending is ₹{Math.abs(balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })} above your available wallet balance.
                </span>
              </div>
            )}

            {/* Sub-metrics bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10 text-xs">
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">
                  Total Received
                </span>
                <span className="text-emerald-400 font-black text-base mt-0.5 block">
                  +{formatCurrency(summaryMetrics.totalReceived, userProfile?.currency)}
                </span>
              </div>

              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">
                  Wallet Expenses
                </span>
                <span className="text-rose-400 font-black text-base mt-0.5 block">
                  −{formatCurrency(summaryMetrics.totalExpenses, userProfile?.currency)}
                </span>
              </div>

              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">
                  Transfers Sent
                </span>
                <span className="text-gray-200 font-bold text-base mt-0.5 block">
                  {formatCurrency(summaryMetrics.totalTransfersSent, userProfile?.currency)}
                </span>
              </div>

              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">
                  Transfers In
                </span>
                <span className="text-gray-200 font-bold text-base mt-0.5 block">
                  {formatCurrency(summaryMetrics.totalTransfersReceived, userProfile?.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION B: Quick Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Add Money (for Head, Individual, or Member if policy allows) */}
            {(!isFamilyMode || isHead || familyPolicy?.allowMemberSelfFunding) && (
              <button
                type="button"
                onClick={() => setIsAddMoneyOpen(true)}
                className="p-3.5 rounded-2xl bg-white border border-gray-200/90 hover:border-[#0057FF] hover:bg-blue-50/40 text-gray-900 transition-all cursor-pointer flex items-center gap-3 shadow-2xs group"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0057FF] flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                  <Coins size={18} />
                </div>
                <div className="text-left">
                  <span className="font-bold text-xs block">Add Money</span>
                  <span className="text-[10px] text-gray-400">Record top-up</span>
                </div>
              </button>
            )}

            {/* Transfer Money (Head only in Family Mode) */}
            {isFamilyMode && isHead && (
              <button
                type="button"
                onClick={() => {
                  setTransferTargetUid(undefined);
                  setIsTransferOpen(true);
                }}
                className="p-3.5 rounded-2xl bg-white border border-gray-200/90 hover:border-emerald-500 hover:bg-emerald-50/40 text-gray-900 transition-all cursor-pointer flex items-center gap-3 shadow-2xs group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                  <Send size={18} />
                </div>
                <div className="text-left">
                  <span className="font-bold text-xs block">Transfer</span>
                  <span className="text-[10px] text-gray-400">Send to member</span>
                </div>
              </button>
            )}

            {/* Request Money (Member only in Family Mode) */}
            {isFamilyMode && !isHead && (
              <button
                type="button"
                onClick={() => setIsRequestOpen(true)}
                className="p-3.5 rounded-2xl bg-white border border-gray-200/90 hover:border-amber-500 hover:bg-amber-50/40 text-gray-900 transition-all cursor-pointer flex items-center gap-3 shadow-2xs group"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                  <Send size={18} />
                </div>
                <div className="text-left">
                  <span className="font-bold text-xs block">Request Money</span>
                  <span className="text-[10px] text-gray-400">Ask family head</span>
                </div>
              </button>
            )}

            {/* Recurring Allowances (Head only in Family Mode) */}
            {isFamilyMode && isHead && (
              <button
                type="button"
                onClick={() => setIsRecurringOpen(true)}
                className="p-3.5 rounded-2xl bg-white border border-gray-200/90 hover:border-purple-500 hover:bg-purple-50/40 text-gray-900 transition-all cursor-pointer flex items-center gap-3 shadow-2xs group"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                  <CalendarClock size={18} />
                </div>
                <div className="text-left">
                  <span className="font-bold text-xs block">Allowances</span>
                  <span className="text-[10px] text-gray-400">Scheduled transfers</span>
                </div>
              </button>
            )}

            {/* Limits & Rules */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-3.5 rounded-2xl bg-white border border-gray-200/90 hover:border-gray-400 text-gray-900 transition-all cursor-pointer flex items-center gap-3 shadow-2xs group"
            >
              <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <Settings size={18} />
              </div>
              <div className="text-left">
                <span className="font-bold text-xs block">Policies & Limits</span>
                <span className="text-[10px] text-gray-400">Spending rules</span>
              </div>
            </button>
          </div>

          {/* SECTION C: Negative Balance Alert Card (for Head - Section 9) */}
          {isFamilyMode && isHead && negativeBalanceMembers.length > 0 && (
            <div className="p-4.5 rounded-3xl bg-rose-50 border border-rose-200 space-y-3">
              <div className="flex items-center gap-2 text-rose-800">
                <AlertTriangle size={18} className="text-rose-600" />
                <h3 className="font-black text-xs uppercase tracking-wider">
                  Negative Balance Alert ({negativeBalanceMembers.length} member{negativeBalanceMembers.length !== 1 ? 's' : ''})
                </h3>
              </div>

              <div className="space-y-2">
                {negativeBalanceMembers.map((m) => (
                  <div
                    key={m.memberUid}
                    className="p-3 rounded-2xl bg-white border border-rose-200/80 flex items-center justify-between shadow-2xs"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-gray-900">{m.memberName}</h4>
                      <p className="text-[11px] text-rose-600 font-bold">
                        Negative Balance: −₹{m.negativeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setTransferTargetUid(m.memberUid);
                        setIsTransferOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
                    >
                      Transfer Funds
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION D: Money Requests Section (Section 7) */}
          {isFamilyMode && (
            <div className="p-5 rounded-3xl bg-white border border-gray-200/80 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-gray-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Send size={15} className="text-[#0057FF]" />
                  <span>{isHead ? `Money Requests (${pendingRequests.length} pending)` : 'Your Money Requests'}</span>
                </h3>
                {isHead && (
                  <span className="text-[11px] text-gray-400">Requires Head approval</span>
                )}
              </div>

              {isHead ? (
                /* Head View: Review Pending Requests */
                pendingRequests.length === 0 ? (
                  <p className="text-xs text-gray-400 py-3 text-center">No pending money requests right now.</p>
                ) : (
                  <div className="space-y-2.5">
                    {pendingRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-gray-900 text-sm">
                              {formatCurrency(req.amount, userProfile?.currency)}
                            </span>
                            <span className="text-xs font-bold text-amber-800">• {req.reason}</span>
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                              {req.urgency} Urgency
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600 mt-0.5">
                            From: <strong className="text-gray-900">{req.requesterName}</strong> • Current balance:{' '}
                            {formatCurrency(req.requesterCurrentBalance, userProfile?.currency)}
                          </p>
                          {req.description && (
                            <p className="text-[11px] text-gray-500 italic mt-0.5">"{req.description}"</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleApprove(req.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1"
                          >
                            <CheckCircle2 size={14} />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectingRequestId(req.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1"
                          >
                            <XCircle size={14} />
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* Member View: Request History */
                myRequests.length === 0 ? (
                  <p className="text-xs text-gray-400 py-3 text-center">You haven't requested any money yet.</p>
                ) : (
                  <div className="space-y-2">
                    {myRequests.slice(0, 3).map((req) => (
                      <div
                        key={req.id}
                        className="p-3 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">
                              {formatCurrency(req.amount, userProfile?.currency)}
                            </span>
                            <span className="text-gray-500">• {req.reason}</span>
                          </div>
                          <span className="text-[10px] text-gray-400">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              req.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : req.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {req.status}
                          </span>

                          {req.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => cancelMoneyRequest(req.id)}
                              className="text-[11px] text-gray-400 hover:text-gray-700 underline cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}

          {/* SECTION E: Recent Transactions Ledger */}
          <div className="p-5 rounded-3xl bg-white border border-gray-200/80 space-y-4 shadow-2xs">
            {/* Ledger Header with Filters & Export */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-gray-900 text-xs uppercase tracking-wider">
                  Transaction Ledger ({filteredTransactions.length})
                </h3>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Filter Pills */}
                <div className="flex items-center gap-1">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'expenses', label: 'Expenses' },
                    { id: 'added', label: 'Added' },
                    { id: 'transfers', label: 'Transfers' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilterType(f.id)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition-colors ${
                        filterType === f.id
                          ? 'bg-[#0057FF] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* CSV Export Button */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-2.5 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  title="Export Ledger to CSV"
                >
                  <Download size={13} />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Transactions List */}
            {filteredTransactions.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <WalletIcon size={32} className="mx-auto text-gray-300 opacity-60" />
                <p className="font-bold text-gray-700 text-xs">No transactions yet</p>
                <p className="text-gray-400 text-[11px]">
                  Your wallet activity will appear here once you add money or record an expense.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 space-y-1">
                {filteredTransactions.map((tx) => {
                  const isIncoming = tx.direction === 'IN';
                  return (
                    <div key={tx.id} className="pt-2.5 pb-2 flex items-start justify-between gap-3 text-xs">
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isIncoming ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {isIncoming ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                        </span>

                        <div>
                          <p className="font-bold text-gray-900 leading-snug">{tx.description}</p>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                            <span>
                              {new Date(tx.createdAt).toLocaleString('en-US', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </span>
                            {tx.relatedMemberName && (
                              <span>• With: {tx.relatedMemberName}</span>
                            )}
                            {tx.fundingSource && (
                              <span>• via {tx.fundingSource}</span>
                            )}
                          </div>
                          {tx.notes && <p className="text-[11px] text-gray-500 italic mt-0.5">{tx.notes}</p>}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`font-black text-sm block ${
                            isIncoming ? 'text-emerald-600' : 'text-gray-900'
                          }`}
                        >
                          {isIncoming ? '+' : '−'}
                          {formatCurrency(tx.amount, userProfile?.currency)}
                        </span>
                        <span className="text-[10px] text-gray-400 block font-mono">
                          Bal: {formatCurrency(tx.resultingBalance, userProfile?.currency)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Sub-modals */}
      {isAddMoneyOpen && <AddMoneyModal isOpen={isAddMoneyOpen} onClose={() => setIsAddMoneyOpen(false)} />}
      {isTransferOpen && (
        <TransferMoneyModal
          isOpen={isTransferOpen}
          initialRecipientUid={transferTargetUid}
          onClose={() => setIsTransferOpen(false)}
          onOpenAddMoney={() => setIsAddMoneyOpen(true)}
        />
      )}
      {isRequestOpen && <RequestMoneyModal isOpen={isRequestOpen} onClose={() => setIsRequestOpen(false)} />}
      {isSettingsOpen && <WalletSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />}
      {isRecurringOpen && <RecurringAllowanceModal isOpen={isRecurringOpen} onClose={() => setIsRecurringOpen(false)} />}
      {isNotificationsOpen && <WalletNotificationsModal isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />}

      {/* Rejection Prompt Modal */}
      {rejectingRequestId && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4"
          >
            <h3 className="font-black text-gray-900 text-sm">Decline Money Request</h3>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                Reason for rejection (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Budget limit reached, Talk to me first..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingRequestId(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs"
              >
                Confirm Decline
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
